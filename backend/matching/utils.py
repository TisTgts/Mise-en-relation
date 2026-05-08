"""Stockage des correspondances par exécution (MatchingRun) : fusion et purge."""

from django.utils import dateparse


def correspondence_entry(besoin_id, prestation_id, score, details, calculated_at=None):
    from django.utils import timezone

    dt = calculated_at or timezone.now()
    iso = dt.isoformat() if hasattr(dt, "isoformat") else str(dt)
    return {
        "besoin_id": int(besoin_id),
        "prestation_id": int(prestation_id),
        "score": float(score),
        "details": details or {},
        "calculated_at": iso,
    }


def create_matching_run(lance_par, correspondances_list):
    from .models import MatchingRun

    if not correspondances_list:
        return None
    return MatchingRun.objects.create(lance_par=lance_par, correspondances=list(correspondances_list))


def merge_effective_correspondences():
    """Dernière version gagne pour chaque paire (besoin_id, prestation_id)."""
    from .models import MatchingRun

    merged = {}
    for run in MatchingRun.objects.order_by("lance_le"):
        for idx, c in enumerate(run.correspondances or []):
            key = (int(c["besoin_id"]), int(c["prestation_id"]))
            corr_ref = f"{run.id}:{idx}"
            merged[key] = {
                **c,
                "_matching_run_id": run.id,
                "_entry_index": idx,
                "corr_ref": corr_ref,
            }
    return merged


def purge_correspondence_pair(besoin_id, prestation_id):
    """Retire la paire de toutes les exécutions en base."""
    from .models import MatchingRun

    bid, pid = int(besoin_id), int(prestation_id)
    for run in MatchingRun.objects.all():
        original = run.correspondances or []
        filtered = [
            c for c in original if not (int(c["besoin_id"]) == bid and int(c["prestation_id"]) == pid)
        ]
        if len(filtered) != len(original):
            run.correspondances = filtered
            run.save(update_fields=["correspondances"])


def besoin_ids_with_effective_matches():
    return {bid for (bid, _pid) in merge_effective_correspondences().keys()}


def get_effective_entry_by_corr_ref(corr_ref):
    for entry in merge_effective_correspondences().values():
        if entry.get("corr_ref") == corr_ref:
            return entry
    return None


def parse_corr_ref(corr_ref):
    """Format attendu : « run_id:index » (index dans le tableau JSON au moment de l'exécution)."""
    s = str(corr_ref).strip()
    if ":" not in s:
        raise ValueError("Référence invalide")
    left, _, right = s.partition(":")
    return int(left), int(right)


def parse_datetime_safe(raw):
    if raw is None:
        return None
    if hasattr(raw, "isoformat"):
        return raw
    return dateparse.parse_datetime(str(raw))
