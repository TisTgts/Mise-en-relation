"""
Peuple la base avec des données de démonstration.

Tous les comptes (username, email, type, prénom, nom) sont définis dans
accounts/data/seed_users.json. Les identifiants de connexion restent stables ;
modifiez first_name / last_name pour changer les personnes affichées.

Usage:
  python manage.py seed_db              # remplit une base vide
  python manage.py seed_db --reset      # supprime db.sqlite3, migrate, puis peuple
"""
import json
from typing import DefaultDict, List, Tuple
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
import random

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.utils import timezone

from accounts.data.seed_business_data import (
    CATEGORIES,
    CLIENTS,
    FOURNISSEURS,
    TRANSACTION_NOTES,
    USER_PHONES,
)
from accounts.models import User, ProfileClient, ProfileFournisseur
from services.models import Besoin, CategorieService, SousCategorieService, Prestation, TransactionService


def _seed_users_json_path() -> Path:
    return Path(__file__).resolve().parent.parent.parent / "data" / "seed_users.json"


def _default_users_from_model() -> List[dict]:
    """Un compte de démo par type si seed_users.json est absent."""
    mapping = {
        "administrateur": ("admin", "admin@demo.local", "Super", "Admin"),
        "client": ("client_demo", "client@demo.local", "Client", "Démo"),
        "fournisseur": ("fournisseur_demo", "fournisseur@demo.local", "Fournisseur", "Démo"),
    }
    users = []
    for code, label in User.TYPES_UTILISATEUR:
        u, em, fn, ln = mapping[code]
        users.append(
            {
                "type_utilisateur": code,
                "username": u,
                "email": em,
                "first_name": fn,
                "last_name": ln,
                "_label_pdf": label,
            }
        )
    return users


def load_user_specs() -> Tuple[List[dict], str, dict]:
    path = _seed_users_json_path()
    allowed = {code for code, _ in User.TYPES_UTILISATEUR}
    if path.exists():
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        users = [u for u in data.get("users", []) if isinstance(u, dict)]
        password = data.get("password", "demo1234")
        counts = data.get("counts") if isinstance(data.get("counts"), dict) else {}
    else:
        users = _default_users_from_model()
        password = "demo1234"
        counts = {}
    seen_usernames = set()
    for u in users:
        t = u.get("type_utilisateur")
        if t not in allowed:
            raise CommandError(
                f"type_utilisateur invalide {t!r} pour {u.get('username')!r}. "
                f"Valeurs autorisées : {sorted(allowed)}"
            )
        if not u.get("username") or not u.get("email"):
            raise CommandError(f"username et email obligatoires : {u!r}")
        username = u["username"]
        if username in seen_usernames:
            raise CommandError(f"username dupliqué dans seed_users.json : {username!r}")
        seen_usernames.add(username)
    return users, password, counts


def _validate_user_counts(users: List[dict], counts: dict) -> None:
    """Vérifie que seed_users.json contient le nombre attendu par type."""
    if not counts:
        return
    by_type: DefaultDict[str, int] = defaultdict(int)
    for u in users:
        by_type[u["type_utilisateur"]] += 1
    for utype, expected in counts.items():
        actual = by_type.get(utype, 0)
        if actual != expected:
            raise CommandError(
                f"seed_users.json : {actual} compte(s) « {utype} », "
                f"{expected} attendu(s) (champ counts)."
            )


def _ensure_user(
    username: str,
    email: str,
    utype: str,
    first_name: str = "",
    last_name: str = "",
    *,
    password: str = "demo1234",
) -> User:
    user, _ = User.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "type_utilisateur": utype,
            "first_name": first_name,
            "last_name": last_name,
            "is_active": True,
        },
    )
    user.set_password(password)
    user.email = email
    user.type_utilisateur = utype
    user.first_name = first_name or ""
    user.last_name = last_name or ""
    user.is_active = True
    user.telephone = USER_PHONES.get(username, "")
    user.est_verifie = utype != "administrateur"
    if utype == "administrateur":
        user.is_staff = True
        user.is_superuser = True
    else:
        user.is_staff = False
        user.is_superuser = False
    user.save()
    return user


class Command(BaseCommand):
    help = (
        "Peuple la base (catégories, profils, prestations, besoins, transactions). "
        "Les utilisateurs viennent de accounts/data/seed_users.json (types du PDF / modèle)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime le fichier SQLite, réapplique toutes les migrations puis insère les données.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Peuple même si des utilisateurs existent déjà (sans --reset : risque de doublons partiels).",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self._reset_database()

        if User.objects.exists() and not options["force"] and not options["reset"]:
            self.stdout.write(
                self.style.WARNING(
                    "La base contient déjà des utilisateurs. Utilisez --reset ou --force."
                )
            )
            return

        if options["force"] and not options["reset"] and User.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    "--force : poursuite du peuplement (get_or_create sur les clés naturelles)."
                )
            )

        self._seed()

    def _reset_database(self):
        engine = settings.DATABASES["default"]["ENGINE"]
        if engine == "django.db.backends.sqlite3":
            db_path = Path(settings.DATABASES["default"]["NAME"])
            connection.close()
            if db_path.exists():
                try:
                    db_path.unlink()
                except PermissionError:
                    self.stderr.write(
                        self.style.ERROR(
                            "Impossible de supprimer db.sqlite3 (fichier utilisé). "
                            "Arrêtez le serveur Django (runserver) et réessayez."
                        )
                    )
                    raise SystemExit(1)
                self.stdout.write(self.style.SUCCESS(f"Fichier supprimé : {db_path}"))
            call_command("migrate", interactive=False, verbosity=1)
            self.stdout.write(self.style.SUCCESS("Migrations appliquées."))
            return

        if not settings.DEBUG:
            self.stdout.write(
                self.style.WARNING(
                    "ATTENTION : --reset efface TOUTES les données PostgreSQL "
                    "(utilisateurs, besoins, transactions, matchings)."
                )
            )
        connection.close()
        call_command("flush", interactive=False, verbosity=1)
        self.stdout.write(self.style.SUCCESS("Base PostgreSQL vidée (flush)."))

    def _seed(self):
        random.seed(226)
        now = timezone.now()
        specs, password, counts = load_user_specs()
        _validate_user_counts(specs, counts)

        created: List[User] = []
        for spec in specs:
            u = _ensure_user(
                spec["username"],
                spec["email"],
                spec["type_utilisateur"],
                spec.get("first_name", ""),
                spec.get("last_name", ""),
                password=password,
            )
            created.append(u)

        by_type: DefaultDict[str, List[User]] = defaultdict(list)
        for u in created:
            by_type[u.type_utilisateur].append(u)

        admins = by_type["administrateur"]
        clients = by_type["client"]
        fournis = by_type["fournisseur"]
        if not admins:
            raise CommandError(
                "Au moins un utilisateur avec type_utilisateur « administrateur » est requis dans seed_users.json."
            )
        if not clients:
            raise CommandError(
                "Au moins un utilisateur avec type_utilisateur « client » est requis dans seed_users.json."
            )
        if not fournis:
            raise CommandError(
                "Au moins un utilisateur avec type_utilisateur « fournisseur » est requis dans seed_users.json."
            )

        admin = admins[0]
        clients = sorted(clients, key=lambda u: u.username)
        fournis = sorted(fournis, key=lambda u: u.username)

        categories_by_name = {}
        for parent_name, meta in CATEGORIES.items():
            parent_cat, _ = CategorieService.objects.get_or_create(
                nom=parent_name,
                defaults={"description": meta["description"], "est_active": True},
            )
            if parent_cat.description != meta["description"]:
                parent_cat.description = meta["description"]
                parent_cat.save(update_fields=["description"])
            categories_by_name[parent_name] = parent_cat
            for child_name, child_desc in meta["sous_categories"].items():
                child_cat, _ = SousCategorieService.objects.get_or_create(
                    categorie=parent_cat,
                    nom=child_name,
                    defaults={"description": child_desc, "est_active": True},
                )
                if child_cat.description != child_desc or not child_cat.est_active:
                    child_cat.description = child_desc
                    child_cat.est_active = True
                    child_cat.save(update_fields=["description", "est_active"])
                categories_by_name[child_name] = child_cat

        today = now.date()
        abonnement_fin = today + timedelta(days=365)

        for fournisseur in fournis:
            biz = FOURNISSEURS.get(fournisseur.username)
            if not biz:
                raise CommandError(
                    f"Profil fournisseur manquant dans seed_business_data.py : {fournisseur.username!r}"
                )
            loc = biz["emplacement"]
            offered = [p["sous_categorie"] for p in biz["prestations"]]
            ProfileFournisseur.objects.update_or_create(
                user=fournisseur,
                defaults={
                    "raison_sociale": biz["raison_sociale"],
                    "types_services_offerts": offered,
                    "zones_couverture": biz["zones"],
                    "annees_experience": biz["annees_experience"],
                    "certifications": biz["certifications"],
                    "assurance_valide": True,
                    "note_moyenne": biz["note_moyenne"],
                    "services_effectues": biz["services_effectues"],
                    "disponibilites": biz["disponibilites"],
                    "tarif_horaire": biz["tarif_horaire"],
                    "emplacement": {
                        "latitude": loc["latitude"],
                        "longitude": loc["longitude"],
                        "adresse": loc["adresse"],
                        "ville": loc["ville"],
                        "quartier": loc.get("quartier", ""),
                    },
                    "abonnement_type": biz.get("abonnement_type", "standard"),
                    "abonnement_actif": True,
                    "abonnement_debut": today,
                    "abonnement_fin": abonnement_fin,
                },
            )
            for p in biz["prestations"]:
                sub = categories_by_name.get(p["sous_categorie"])
                if not sub:
                    continue
                Prestation.objects.update_or_create(
                    fournisseur=fournisseur,
                    intitule=p["intitule"],
                    defaults={
                        "categorie": sub.categorie,
                        "sous_categorie": sub,
                        "description": p["description"],
                        "type_prestation": p["sous_categorie"],
                        "caracteristiques": {
                            **p.get("caracteristiques", {}),
                            "domaine": biz["domaine"],
                            "entreprise": biz["raison_sociale"],
                        },
                        "zones_intervention": biz["zones"],
                        "disponibilite_debut": now,
                        "disponibilite_fin": now + timedelta(days=180),
                        "mode_tarification": p["mode_tarification"],
                        "tarif_min": p["tarif_min"],
                        "tarif_max": p["tarif_max"],
                        "statut": "active",
                    },
                )

        prestations_by_sub = defaultdict(list)
        for prest in Prestation.objects.filter(statut="active").select_related("sous_categorie"):
            if prest.sous_categorie_id:
                prestations_by_sub[prest.sous_categorie.nom].append(prest)

        for client in clients:
            biz = CLIENTS.get(client.username)
            if not biz:
                raise CommandError(
                    f"Profil client manquant dans seed_business_data.py : {client.username!r}"
                )
            loc = biz["emplacement"]
            besoin_types = list({b["sous_categorie"] for b in biz["besoins"]})
            ProfileClient.objects.update_or_create(
                user=client,
                defaults={
                    "raison_sociale": biz["raison_sociale"],
                    "secteur_activite": biz["secteur_activite"],
                    "taille_entreprise": biz["taille_entreprise"],
                    "besoins_services": besoin_types[:6],
                    "fournisseurs_preferes": [],
                    "plage_budget": biz["plage_budget"],
                    "frequence_besoins": biz["frequence_besoins"],
                    "contact_principal": client.get_full_name() or client.username,
                    "mode_paiement_preferes": biz["mode_paiement_preferes"],
                    "emplacement": {
                        "latitude": loc["latitude"],
                        "longitude": loc["longitude"],
                        "adresse": loc["adresse"],
                        "ville": loc["ville"],
                        "quartier": loc.get("quartier", ""),
                    },
                },
            )
            for j, b in enumerate(biz["besoins"]):
                sub = categories_by_name.get(b["sous_categorie"])
                if not sub:
                    continue
                Besoin.objects.update_or_create(
                    client=client,
                    intitule=b["intitule"],
                    defaults={
                        "categorie": sub.categorie,
                        "sous_categorie": sub,
                        "description": b["description"],
                        "type_service": b["sous_categorie"],
                        "exigences": {
                            **b.get("exigences", {}),
                            "entreprise": biz["raison_sociale"],
                            "ville": loc["ville"],
                        },
                        "lieu_intervention": b.get("lieu", loc["adresse"]),
                        "date_souhaitee": now + timedelta(days=3 + (j % 14)),
                        "date_limite": now + timedelta(days=12 + (j % 25)),
                        "urgence": b["urgence"],
                        "mode_budget": b["mode_budget"],
                        "budget": b.get("budget"),
                        "flexible": b["flexible"],
                        "statut": b["statut"],
                    },
                )

        besoins_non_ouverts = list(
            Besoin.objects.filter(statut__in=["en_cours", "pourvue"])
            .select_related("sous_categorie", "client")
            .order_by("id")
        )
        all_prestations = list(Prestation.objects.filter(statut="active").order_by("id"))

        for idx, besoin in enumerate(besoins_non_ouverts):
            sub_name = besoin.sous_categorie.nom if besoin.sous_categorie else None
            candidates = prestations_by_sub.get(sub_name, []) if sub_name else []
            prestation = candidates[idx % len(candidates)] if candidates else all_prestations[idx % len(all_prestations)]

            if besoin.mode_budget == "sur_devis":
                devis_statut = ["en_attente_client", "accepte_client", "rejete_client"][idx % 3]
                devis_montant = (
                    (besoin.budget or prestation.tarif_min or Decimal("150000"))
                    if devis_statut == "accepte_client"
                    else (prestation.tarif_min or Decimal("150000"))
                )
                prix_final = devis_montant if devis_statut == "accepte_client" else None
                devis_desc = (
                    f"Devis détaillé pour « {besoin.intitule} » — "
                    f"prestataire {prestation.fournisseur.get_full_name() or prestation.fournisseur.username}, "
                    f"délai estimé 5 à 10 jours ouvrés."
                )
            else:
                devis_statut = "non_requis"
                devis_montant = None
                prix_final = besoin.budget or prestation.tarif_min
                devis_desc = ""

            if besoin.statut == "en_cours":
                tx_statut = "en_cours"
                note = TRANSACTION_NOTES["en_cours"]
            elif besoin.statut == "pourvue":
                tx_statut = "terminee"
                note = TRANSACTION_NOTES["terminee"]
            else:
                tx_statut = "acceptee"
                note = TRANSACTION_NOTES["acceptee"]

            TransactionService.objects.update_or_create(
                prestation=prestation,
                besoin=besoin,
                defaults={
                    "fournisseur": prestation.fournisseur,
                    "client": besoin.client,
                    "prix_final": prix_final,
                    "devis_montant_propose": devis_montant,
                    "devis_description": devis_desc,
                    "devis_statut": devis_statut,
                    "devis_date_proposition": now if besoin.mode_budget == "sur_devis" else None,
                    "devis_date_reponse_client": (
                        now if devis_statut in ["accepte_client", "rejete_client"] else None
                    ),
                    "devis_propose_par": prestation.fournisseur if besoin.mode_budget == "sur_devis" else None,
                    "statut": tx_statut,
                    "debut_confirme": True,
                    "fin_confirmee": besoin.statut == "pourvue",
                    "notes": note,
                },
            )

        self.stdout.write(self.style.SUCCESS("Données de démonstration insérées."))
        self.stdout.write(f"Fichier utilisateurs : {_seed_users_json_path()}")
        self.stdout.write(f"Mot de passe : {password}")
        self.stdout.write("Types créés (modèle / PDF) :")
        for code, label in User.TYPES_UTILISATEUR:
            names = ", ".join(sorted(u.username for u in by_type[code]))
            self.stdout.write(f"  - {code} ({label}) : {names or '—'}")
        self.stdout.write(f"  - Administrateur principal : {admin.username}")
        self.stdout.write(f"  - Catégories : {CategorieService.objects.count()}")
        self.stdout.write(f"  - Prestations : {Prestation.objects.count()}")
        self.stdout.write(f"  - Besoins : {Besoin.objects.count()}")
        self.stdout.write(f"  - Transactions : {TransactionService.objects.count()}")
