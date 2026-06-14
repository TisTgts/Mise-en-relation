from decimal import Decimal

from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import User
from accounts.client_premium import client_can_self_launch_matching
from services.models import Besoin, Prestation, TransactionService, Message
from services.serializers import BesoinSerializer, PrestationSerializer

from .devis_matching import (
    build_quote_context,
    initiate_quote_request_for_match,
    load_transactions_for_pairs,
    match_requires_quote,
    process_quote_opportunities_after_matching,
)
from .models import MatchingRun
from .presentation import match_payload_from_besoin, match_payload_from_prestation
from .services import MatchingService
from .utils import (
    besoin_ids_with_effective_matches,
    correspondence_entry,
    create_matching_run,
    get_effective_entry_by_corr_ref,
    merge_effective_correspondences,
    parse_corr_ref,
    parse_datetime_safe,
    purge_correspondence_pair,
)


def matching_besoin_queryset(queryset):
    return queryset.select_related(
        "client",
        "client__profile_client",
        "categorie",
        "sous_categorie",
        "sous_categorie__categorie",
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def trouver_correspondances_pour_besoin(request, besoin_id):
    """Trouve les meilleures prestations pour un besoin donné."""
    besoin = get_object_or_404(
        Besoin.objects.select_related(
            "client",
            "categorie",
            "sous_categorie",
            "sous_categorie__categorie",
        ),
        id=besoin_id,
    )

    if request.user.user_type == "client" and besoin.client != request.user:
        return Response(
            {"error": "Vous n'êtes pas autorisé à accéder à ce besoin"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.user.type_utilisateur == "client" and not client_can_self_launch_matching(request.user):
        return Response(
            {
                "error": (
                    "Le lancement du matching est réservé aux comptes client Premium. "
                    "Contactez l'administrateur pour activer cette option."
                ),
                "code": "client_matching_premium_required",
                "matching_self_service": False,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.user.type_utilisateur != "administrateur" and besoin.statut != "ouverte":
        return Response(
            {
                "error": "Seuls les besoins au statut « ouverte » peuvent être mis en correspondance.",
                "statut_actuel": besoin.statut,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    matching_service = MatchingService()
    matches = matching_service.find_matches_for_besoin(besoin)
    entries = [
        correspondence_entry(besoin.id, m["prestation"].id, m["score"], m["details"]) for m in matches
    ]
    create_matching_run(request.user, entries)
    quote_opportunities = process_quote_opportunities_after_matching(besoin, matches)

    results = []
    for m in matches:
        payload = match_payload_from_besoin(m["prestation"], besoin, m["score"])
        payload["reasons"] = m.get("reasons", [])
        payload["score_details"] = m.get("details", {})
        payload["quote"] = build_quote_context(besoin, m["prestation"])
        results.append(payload)

    return Response(
        {
            "besoin_id": besoin_id,
            "matches": results,
            "total_matches": len(results),
            "besoin_sur_devis": besoin.mode_budget == "sur_devis",
            "quote_opportunities": quote_opportunities,
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def trouver_correspondances_pour_prestation(request, prestation_id):
    """Trouve les meilleurs besoins pour une prestation donnée."""
    prestation = get_object_or_404(
        Prestation.objects.select_related(
            "fournisseur",
            "categorie",
            "sous_categorie",
            "sous_categorie__categorie",
        ),
        id=prestation_id,
    )

    if request.user.user_type == "fournisseur" and prestation.provider != request.user:
        return Response(
            {"error": "Vous n'êtes pas autorisé à accéder à cette offre"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if prestation.statut != "active":
        return Response(
            {
                "error": "Seules les prestations actives peuvent être utilisées pour chercher des besoins.",
                "statut_actuel": prestation.statut,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    matching_service = MatchingService()
    matches = matching_service.find_matches_for_prestation(prestation)
    entries = [
        correspondence_entry(m["besoin"].id, prestation.id, m["score"], m["details"]) for m in matches
    ]
    create_matching_run(request.user, entries)

    results = []
    for m in matches:
        payload = match_payload_from_prestation(prestation, m["besoin"], m["score"])
        payload["reasons"] = m.get("reasons", [])
        payload["score_details"] = m.get("details", {})
        results.append(payload)

    return Response({"prestation_id": prestation_id, "matches": results, "total_matches": len(results)})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_matching_scores(request):
    """Scores effectifs de matching pour l'utilisateur (dernière version par paire)."""
    user = request.user
    merged = merge_effective_correspondences()
    if not merged:
        return Response([])

    besoin_ids = {bid for (bid, _) in merged}
    prestation_ids = {pid for (_, pid) in merged}
    besoins_map = {
        b.id: b
        for b in Besoin.objects.select_related("client", "categorie", "sous_categorie").filter(
            id__in=besoin_ids
        )
    }
    prestations_map = {
        p.id: p
        for p in Prestation.objects.select_related("fournisseur", "categorie", "sous_categorie").filter(
            id__in=prestation_ids
        )
    }

    matching_service = MatchingService()
    pair_keys = list(merged.keys())
    tx_by_pair = load_transactions_for_pairs(pair_keys)
    scores_payload = []
    for (bid, pid), entry in merged.items():
        prestation = prestations_map.get(pid)
        besoin = besoins_map.get(bid)
        if not prestation or not besoin:
            continue
        if user.user_type == "fournisseur" and prestation.fournisseur_id != user.id:
            continue
        if user.user_type == "client" and besoin.client_id != user.id:
            continue
        if user.user_type not in ("fournisseur", "client"):
            continue

        score = Decimal(str(entry["score"])).quantize(Decimal("0.01"))
        details = entry.get("details") or {}
        hard_match = bool(details.get("meta", {}).get("category_compatibility_level", 0) != 0)
        threshold = matching_service._score_threshold_for_pair(prestation, besoin)
        reasons = matching_service.build_match_reasons(score, details, hard_match, threshold)
        quote_ctx = build_quote_context(besoin, prestation, tx_by_pair.get((bid, pid)))
        scores_payload.append(
            {
                "id": entry["corr_ref"],
                "score": str(score),
                "details": details,
                "accepted": bool(score >= threshold),
                "threshold": str(threshold),
                "reasons": reasons,
                "calculated_at": parse_datetime_safe(entry.get("calculated_at")),
                "prestation": PrestationSerializer(prestation).data,
                "besoin": BesoinSerializer(besoin).data,
                "quote": quote_ctx,
            }
        )

    scores_payload.sort(key=lambda x: float(x["score"]), reverse=True)
    return Response(scores_payload[:20])


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def debug_matching_score(request, besoin_id, prestation_id):
    """Retourne le détail du scoring pour un couple besoin/prestation."""
    besoin = get_object_or_404(Besoin, id=besoin_id)
    prestation = get_object_or_404(Prestation, id=prestation_id)

    if request.user.user_type == "client" and besoin.client != request.user:
        return Response(
            {"error": "Vous n'êtes pas autorisé à déboguer ce besoin"},
            status=status.HTTP_403_FORBIDDEN,
        )
    if request.user.user_type == "fournisseur" and prestation.provider != request.user:
        return Response(
            {"error": "Vous n'êtes pas autorisé à déboguer cette prestation"},
            status=status.HTTP_403_FORBIDDEN,
        )

    matching_service = MatchingService()
    debug_payload = matching_service.debug_score_for_pair(prestation, besoin)

    return Response(
        {
            "besoin_id": besoin.id,
            "prestation_id": prestation.id,
            "score": debug_payload["score"],
            "hard_match": debug_payload["hard_match"],
            "accepted": debug_payload["accepted"],
            "threshold": debug_payload["threshold"],
            "recommendation": debug_payload["recommendation"],
            "reasons": debug_payload["reasons"],
            "details": debug_payload["details"],
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def lancer_matching_besoins_sans_matching(request):
    """Matching pour les besoins ouverts sans aucune correspondance effective."""
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    limit = request.data.get("limit", 50)
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 50
    limit = max(1, min(limit, 200))

    with_matches = besoin_ids_with_effective_matches()
    besoins_list = list(
        matching_besoin_queryset(
            Besoin.objects.filter(statut="ouverte").exclude(id__in=with_matches).order_by("-created_at")
        )[:limit]
    )

    matching_service = MatchingService()
    details = []
    all_entries = []
    for besoin in besoins_list:
        matches = matching_service.find_matches_for_besoin(besoin)
        for m in matches:
            all_entries.append(
                correspondence_entry(besoin.id, m["prestation"].id, m["score"], m["details"])
            )
        process_quote_opportunities_after_matching(besoin, matches)
        details.append(
            {
                "besoin_id": besoin.id,
                "intitule": besoin.intitule,
                "matches_trouves": len(matches),
            }
        )

    run = create_matching_run(request.user, all_entries)

    still_without = (
        Besoin.objects.filter(statut="ouverte")
        .exclude(id__in=besoin_ids_with_effective_matches())
        .count()
    )

    return Response(
        {
            "processed_besoins": len(besoins_list),
            "total_matches_generated": len(all_entries),
            "matching_run_id": run.id if run else None,
            "remaining_besoins_without_matching": still_without,
            "details": details,
            "total_matching_runs": MatchingRun.objects.count(),
            "total_correspondances_effectives": len(merge_effective_correspondences()),
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def lancer_matching_besoins_admin(request):
    """Lance le matching administrateur (ouvert ou sélection d'IDs)."""
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    all_open = bool(request.data.get("all_open", False))
    besoin_ids = request.data.get("besoin_ids") or []
    if not isinstance(besoin_ids, list):
        besoin_ids = []

    if all_open:
        besoins_qs = matching_besoin_queryset(
            Besoin.objects.filter(statut="ouverte").order_by("-created_at")
        )
    else:
        ids = []
        for bid in besoin_ids:
            try:
                ids.append(int(bid))
            except (TypeError, ValueError):
                continue
        if not ids:
            return Response(
                {"error": "Aucun besoin sélectionné"}, status=status.HTTP_400_BAD_REQUEST
            )
        besoins_qs = matching_besoin_queryset(Besoin.objects.filter(id__in=ids).order_by("-created_at"))

    besoins = list(besoins_qs)
    matching_service = MatchingService()
    details = []
    all_entries = []
    for besoin in besoins:
        matches = matching_service.find_matches_for_besoin(besoin)
        for m in matches:
            all_entries.append(
                correspondence_entry(besoin.id, m["prestation"].id, m["score"], m["details"])
            )
        process_quote_opportunities_after_matching(besoin, matches)
        details.append(
            {
                "besoin_id": besoin.id,
                "intitule": besoin.intitule,
                "statut": besoin.statut,
                "matches_trouves": len(matches),
            }
        )

    run = create_matching_run(request.user, all_entries)

    return Response(
        {
            "processed_besoins": len(besoins),
            "total_matches_generated": len(all_entries),
            "matching_run_id": run.id if run else None,
            "details": details,
            "total_matching_runs": MatchingRun.objects.count(),
            "total_correspondances_effectives": len(merge_effective_correspondences()),
        }
    )


def _build_grouped_admin_payload():
    merged = merge_effective_correspondences()
    if not merged:
        return []

    besoin_ids = {bid for (bid, _) in merged}
    prestation_ids = {pid for (_, pid) in merged}
    besoins_map = {
        b.id: b
        for b in Besoin.objects.select_related("client", "categorie", "sous_categorie").filter(
            id__in=besoin_ids
        )
    }
    prestations_map = {
        p.id: p
        for p in Prestation.objects.select_related("fournisseur", "categorie", "sous_categorie").filter(
            id__in=prestation_ids
        )
    }

    grouped = {}
    for (bid, pid), entry in merged.items():
        b = besoins_map.get(bid)
        p = prestations_map.get(pid)
        if not b or not p:
            continue
        if bid not in grouped:
            grouped[bid] = {
                "besoin_id": bid,
                "besoin_titre": b.intitule,
                "client_nom": b.client.username,
                "besoin_ville": b.lieu_intervention,
                "besoin_categorie": b.categorie.nom if b.categorie else "",
                "besoin_sous_categorie": b.sous_categorie.nom if b.sous_categorie else "",
                "correspondances_count": 0,
                "correspondances": [],
            }
        fournisseur = p.fournisseur
        profile = getattr(fournisseur, "profile_fournisseur", None)
        grouped[bid]["correspondances_count"] += 1
        grouped[bid]["correspondances"].append(
            {
                "score_id": entry["corr_ref"],
                "score": float(entry["score"]),
                "calculated_at": parse_datetime_safe(entry.get("calculated_at")),
                "prestation_id": pid,
                "prestation_titre": p.intitule,
                "prestation_categorie": p.categorie.nom if p.categorie else "",
                "prestation_sous_categorie": p.sous_categorie.nom if p.sous_categorie else "",
                "fournisseur": {
                    "id": fournisseur.id,
                    "username": fournisseur.username,
                    "email": fournisseur.email,
                    "telephone": fournisseur.telephone,
                    "est_verifie": fournisseur.est_verifie,
                    "raison_sociale": getattr(profile, "raison_sociale", ""),
                    "note_moyenne": float(getattr(profile, "note_moyenne", 0) or 0),
                    "services_effectues": getattr(profile, "services_effectues", 0),
                    "types_services_offerts": getattr(profile, "types_services_offerts", []),
                    "zones_couverture": getattr(profile, "zones_couverture", []),
                },
            }
        )

    results = list(grouped.values())
    results.sort(key=lambda x: x["correspondances_count"], reverse=True)
    return results


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_lister_correspondances(request):
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    results = _build_grouped_admin_payload()
    return Response({"count": len(results), "results": results})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_lister_correspondances_plates(request):
    """Liste plate des correspondances effectives (tableau de bord admin)."""
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    merged = merge_effective_correspondences()
    if not merged:
        return Response([])

    besoin_ids = {bid for (bid, _) in merged}
    prestation_ids = {pid for (_, pid) in merged}
    besoins_map = {
        b.id: b
        for b in Besoin.objects.select_related("client", "categorie", "sous_categorie").filter(
            id__in=besoin_ids
        )
    }
    prestations_map = {
        p.id: p
        for p in Prestation.objects.select_related("fournisseur", "categorie", "sous_categorie").filter(
            id__in=prestation_ids
        )
    }

    rows = []
    for (bid, pid), entry in merged.items():
        b = besoins_map.get(bid)
        p = prestations_map.get(pid)
        if not b or not p:
            continue
        corr_ref = entry["corr_ref"]
        rows.append(
            {
                "id": corr_ref,
                "corr_ref": corr_ref,
                "score": float(entry["score"]),
                "calculated_at": parse_datetime_safe(entry.get("calculated_at")),
                "prestation_id": pid,
                "prestation_titre": p.intitule,
                "fournisseur_nom": p.fournisseur.username,
                "besoin_id": bid,
                "besoin_titre": b.intitule,
                "client_nom": b.client.username,
            }
        )
    rows.sort(key=lambda x: x["score"], reverse=True)
    return Response(rows)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_lister_matching_runs(request):
    """Historique des exécutions : numéro (id), date, auteur, taille du tableau."""
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    runs = MatchingRun.objects.select_related("lance_par").order_by("-lance_le")[:200]
    data = []
    for run in runs:
        u = run.lance_par
        data.append(
            {
                "id": run.id,
                "lance_le": run.lance_le,
                "lance_par_id": u.id if u else None,
                "lance_par_username": u.username if u else None,
                "nombre_correspondances": len(run.correspondances or []),
            }
        )
    return Response({"count": len(data), "results": data})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_detail_correspondance(request, corr_ref):
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    entry = get_effective_entry_by_corr_ref(corr_ref)
    if not entry:
        return Response({"error": "Correspondance introuvable"}, status=status.HTTP_404_NOT_FOUND)

    bid = int(entry["besoin_id"])
    pid = int(entry["prestation_id"])
    besoin = get_object_or_404(
        Besoin.objects.select_related("client", "categorie", "sous_categorie"), id=bid
    )
    prestation = get_object_or_404(
        Prestation.objects.select_related("fournisseur", "categorie", "sous_categorie"), id=pid
    )

    return Response(
        {
            "id": entry["corr_ref"],
            "corr_ref": entry["corr_ref"],
            "score": str(Decimal(str(entry["score"])).quantize(Decimal("0.01"))),
            "details": entry.get("details") or {},
            "calculated_at": parse_datetime_safe(entry.get("calculated_at")),
            "prestation": PrestationSerializer(prestation).data,
            "besoin": BesoinSerializer(besoin).data,
        }
    )


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def admin_supprimer_correspondance(request, corr_ref):
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    entry = get_effective_entry_by_corr_ref(corr_ref)
    if not entry:
        try:
            run_id, idx = parse_corr_ref(corr_ref)
            run = get_object_or_404(MatchingRun, id=run_id)
            cors = run.correspondances or []
            if 0 <= idx < len(cors):
                c = cors[idx]
                purge_correspondence_pair(c["besoin_id"], c["prestation_id"])
                return Response({"message": "Correspondance supprimée avec succès"})
        except (ValueError, IndexError, KeyError):
            pass
        return Response({"error": "Correspondance introuvable"}, status=status.HTTP_404_NOT_FOUND)

    purge_correspondence_pair(entry["besoin_id"], entry["prestation_id"])
    return Response({"message": "Correspondance supprimée avec succès"})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_correspondances_pour_besoin(request, besoin_id):
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    besoin = get_object_or_404(Besoin.objects.select_related("client", "categorie", "sous_categorie"), id=besoin_id)
    merged = merge_effective_correspondences()
    prestation_ids = {pid for (bid, pid) in merged if bid == besoin_id}
    prestations_map = {
        p.id: p
        for p in Prestation.objects.select_related(
            "fournisseur", "categorie", "sous_categorie"
        ).filter(id__in=prestation_ids)
    }

    results = []
    for (bid, pid), entry in merged.items():
        if bid != besoin_id:
            continue
        p = prestations_map.get(pid)
        if not p:
            continue
        fournisseur = p.fournisseur
        profile = getattr(fournisseur, "profile_fournisseur", None)
        corr_ref = entry["corr_ref"]
        results.append(
            {
                "score_id": corr_ref,
                "corr_ref": corr_ref,
                "score": float(entry["score"]),
                "details": entry.get("details") or {},
                "calculated_at": parse_datetime_safe(entry.get("calculated_at")),
                "prestation_id": pid,
                "prestation_titre": p.intitule,
                "prestation_categorie": p.categorie.nom if p.categorie else "",
                "prestation_sous_categorie": p.sous_categorie.nom if p.sous_categorie else "",
                "fournisseur": {
                    "id": fournisseur.id,
                    "username": fournisseur.username,
                    "email": fournisseur.email,
                    "telephone": fournisseur.telephone,
                    "est_verifie": fournisseur.est_verifie,
                    "raison_sociale": getattr(profile, "raison_sociale", ""),
                },
            }
        )

    results.sort(key=lambda x: x["score"], reverse=True)

    return Response(
        {
            "besoin": {
                "id": besoin.id,
                "intitule": besoin.intitule,
                "client_nom": besoin.client.username,
                "statut": besoin.statut,
                "lieu_intervention": besoin.lieu_intervention,
                "categorie": besoin.categorie.nom if besoin.categorie else "",
                "sous_categorie": besoin.sous_categorie.nom if besoin.sous_categorie else "",
            },
            "count": len(results),
            "results": results,
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_profil_fournisseur(request, fournisseur_id):
    if request.user.type_utilisateur != "administrateur":
        return Response(
            {"error": "Accès réservé aux administrateurs"}, status=status.HTTP_403_FORBIDDEN
        )

    fournisseur = get_object_or_404(User, id=fournisseur_id, type_utilisateur="fournisseur")
    profile = getattr(fournisseur, "profile_fournisseur", None)
    return Response(
        {
            "id": fournisseur.id,
            "username": fournisseur.username,
            "email": fournisseur.email,
            "telephone": fournisseur.telephone,
            "first_name": fournisseur.first_name,
            "last_name": fournisseur.last_name,
            "est_verifie": fournisseur.est_verifie,
            "profile": {
                "raison_sociale": getattr(profile, "raison_sociale", ""),
                "types_services_offerts": getattr(profile, "types_services_offerts", []),
                "zones_couverture": getattr(profile, "zones_couverture", []),
                "annees_experience": getattr(profile, "annees_experience", 0),
                "note_moyenne": float(getattr(profile, "note_moyenne", 0) or 0),
                "services_effectues": getattr(profile, "services_effectues", 0),
                "tarif_horaire": str(getattr(profile, "tarif_horaire", "") or ""),
                "certifications": getattr(profile, "certifications", []),
                "emplacement": getattr(profile, "emplacement", {}),
                "abonnement_type": getattr(profile, "abonnement_type", "standard"),
                "abonnement_actif": bool(getattr(profile, "abonnement_actif", True)),
            },
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def client_profil_fournisseur_matche(request, fournisseur_id):
    """Profil fournisseur visible par un client pour un besoin matché."""
    if request.user.type_utilisateur != "client":
        return Response(
            {"error": "Accès réservé aux clients"}, status=status.HTTP_403_FORBIDDEN
        )

    besoin_id = request.query_params.get("besoin_id")
    try:
        besoin_id = int(besoin_id)
    except (TypeError, ValueError):
        return Response(
            {"error": "Paramètre besoin_id invalide"}, status=status.HTTP_400_BAD_REQUEST
        )

    besoin = get_object_or_404(Besoin, id=besoin_id, client=request.user)
    fournisseur = get_object_or_404(User, id=fournisseur_id, type_utilisateur="fournisseur")

    merged = merge_effective_correspondences()
    if not merged:
        return Response(
            {"error": "Aucune correspondance disponible pour ce besoin"},
            status=status.HTTP_404_NOT_FOUND,
        )

    matched_prestation_ids = [
        pid
        for (bid, pid), _entry in merged.items()
        if bid == besoin.id
    ]
    if not matched_prestation_ids:
        return Response(
            {"error": "Aucune correspondance disponible pour ce besoin"},
            status=status.HTTP_404_NOT_FOUND,
        )

    prestations = list(
        Prestation.objects.filter(
            id__in=matched_prestation_ids, fournisseur=fournisseur
        ).order_by("-updated_at")
    )
    if not prestations:
        return Response(
            {"error": "Ce fournisseur n'est pas associé aux correspondances de ce besoin"},
            status=status.HTTP_404_NOT_FOUND,
        )

    profile = getattr(fournisseur, "profile_fournisseur", None)
    return Response(
        {
            "id": fournisseur.id,
            "username": fournisseur.username,
            "email": fournisseur.email,
            "telephone": fournisseur.telephone,
            "first_name": fournisseur.first_name,
            "last_name": fournisseur.last_name,
            "est_verifie": fournisseur.est_verifie,
            "profile": {
                "raison_sociale": getattr(profile, "raison_sociale", ""),
                "types_services_offerts": getattr(profile, "types_services_offerts", []),
                "zones_couverture": getattr(profile, "zones_couverture", []),
                "annees_experience": getattr(profile, "annees_experience", 0),
                "note_moyenne": float(getattr(profile, "note_moyenne", 0) or 0),
                "services_effectues": getattr(profile, "services_effectues", 0),
                "tarif_horaire": str(getattr(profile, "tarif_horaire", "") or ""),
                "certifications": getattr(profile, "certifications", []),
                "abonnement_type": getattr(profile, "abonnement_type", "standard"),
                "abonnement_actif": bool(getattr(profile, "abonnement_actif", True)),
            },
            "besoin": {
                "id": besoin.id,
                "intitule": besoin.intitule,
            },
            "matched_prestations": [
                {
                    "id": p.id,
                    "intitule": p.intitule,
                    "categorie": p.categorie.nom if p.categorie else "",
                    "sous_categorie": p.sous_categorie.nom if p.sous_categorie else "",
                    "tarif_min": p.tarif_min,
                    "tarif_max": p.tarif_max,
                    "statut": p.statut,
                }
                for p in prestations
            ],
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def sync_devis_opportunities_besoin(request, besoin_id):
    """Crée les opportunités devis pour les correspondances existantes d'un besoin."""
    besoin = get_object_or_404(
        Besoin.objects.select_related("client"),
        id=besoin_id,
    )
    if request.user.type_utilisateur == "client" and besoin.client_id != request.user.id:
        return Response(
            {"error": "Accès non autorisé à ce besoin"},
            status=status.HTTP_403_FORBIDDEN,
        )
    if request.user.type_utilisateur not in ("client", "administrateur"):
        return Response(
            {"error": "Accès réservé au client ou à l'administrateur"},
            status=status.HTTP_403_FORBIDDEN,
        )

    merged = merge_effective_correspondences()
    prestation_ids = [pid for (bid, pid) in merged.keys() if bid == besoin.id]
    if not prestation_ids:
        return Response(
            {
                "besoin_id": besoin.id,
                "besoin_sur_devis": besoin.mode_budget == "sur_devis",
                "quote_opportunities": [],
                "message": "Aucune correspondance à synchroniser.",
            }
        )

    prestations = list(
        Prestation.objects.select_related("fournisseur").filter(id__in=prestation_ids)
    )
    matches = [{"prestation": p} for p in prestations]
    summary = process_quote_opportunities_after_matching(besoin, matches)

    return Response(
        {
            "besoin_id": besoin.id,
            "besoin_sur_devis": besoin.mode_budget == "sur_devis",
            "quote_opportunities": summary,
            "synchronized": len(summary),
        }
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def client_confirmer_match(request):
    """Confirme un match côté client et crée la collaboration associée."""
    if request.user.type_utilisateur != "client":
        return Response(
            {"error": "Accès réservé aux clients"}, status=status.HTTP_403_FORBIDDEN
        )

    besoin_id = request.data.get("besoin_id")
    prestation_id = request.data.get("prestation_id")
    sujet = (request.data.get("sujet") or "").strip()
    contenu = (request.data.get("contenu") or "").strip()
    try:
        besoin_id = int(besoin_id)
        prestation_id = int(prestation_id)
    except (TypeError, ValueError):
        return Response(
            {"error": "besoin_id et prestation_id sont obligatoires"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    besoin = get_object_or_404(Besoin, id=besoin_id, client=request.user)
    prestation = get_object_or_404(Prestation, id=prestation_id)

    merged = merge_effective_correspondences()
    selected_entry = merged.get((besoin.id, prestation.id))
    if not selected_entry:
        return Response(
            {"error": "La prestation sélectionnée n'est pas dans les correspondances de ce besoin"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    quote_required = match_requires_quote(besoin, prestation)
    transaction = TransactionService.objects.filter(
        besoin=besoin, prestation=prestation
    ).first()

    if quote_required:
        if not transaction or transaction.devis_statut != "accepte_client":
            # Le client choisit ce fournisseur : on déclenche la demande de devis
            # et on notifie UNIQUEMENT ce fournisseur. La collaboration ne démarre
            # qu'après que le client ait accepté le devis proposé.
            tx, notified = initiate_quote_request_for_match(besoin, prestation)
            awaiting = (
                "en_attente_client"
                if tx.devis_statut == "en_attente_client"
                else "a_proposer"
            )
            return Response(
                {
                    "message": (
                        "Devis en attente de votre validation : acceptez-le pour lancer la collaboration."
                        if awaiting == "en_attente_client"
                        else "Fournisseur sélectionné. Une demande de devis lui a été envoyée."
                    ),
                    "awaiting_quote": True,
                    "requires_quote": True,
                    "notified": notified,
                    "devis_statut": tx.devis_statut,
                    "transaction_id": tx.id,
                    "besoin_id": besoin.id,
                    "prestation_id": prestation.id,
                },
                status=status.HTTP_202_ACCEPTED,
            )
        created = False
        transaction.statut = "en_cours"
        if transaction.prix_final is None and transaction.devis_montant_propose is not None:
            transaction.prix_final = transaction.devis_montant_propose
        transaction.save(update_fields=["statut", "prix_final", "updated_at"])
    else:
        transaction, created = TransactionService.objects.get_or_create(
            prestation=prestation,
            besoin=besoin,
            fournisseur=prestation.fournisseur,
            client=besoin.client,
            defaults={
                "prix_final": prestation.tarif_min,
                "statut": "en_cours",
                "devis_statut": "non_requis",
                "notes": "Transaction créée depuis la confirmation de matching client.",
            },
        )
        if not created and transaction.statut in {"annulee", "en_attente", "acceptee"}:
            transaction.statut = "en_cours"
            transaction.save(update_fields=["statut", "updated_at"])

    if besoin.statut != "en_cours":
        besoin.statut = "en_cours"
        besoin.save(update_fields=["statut", "updated_at"])
    if prestation.statut == "active":
        prestation.statut = "en_cours"
        prestation.save(update_fields=["statut", "updated_at"])

    # Garder uniquement le match confirmé pour ce besoin (match complet).
    for (bid, pid) in list(merge_effective_correspondences().keys()):
        if bid == besoin.id and pid != prestation.id:
            purge_correspondence_pair(bid, pid)

    if sujet and contenu:
        Message.objects.create(
            expediteur=request.user,
            destinataire=prestation.fournisseur,
            transaction=transaction,
            sujet=sujet,
            contenu=contenu,
            lu=False,
        )

    return Response(
        {
            "message": "Match confirmé et collaboration créée.",
            "transaction_id": transaction.id,
            "created": created,
            "besoin_id": besoin.id,
            "prestation_id": prestation.id,
            "score": float(selected_entry["score"]),
            "transaction_statut": transaction.statut,
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )
