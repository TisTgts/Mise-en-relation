"""Opportunités de devis liées au matching (avant confirmation client)."""

from django.db.models import Q
from django.utils import timezone

from services.models import Besoin, Message, Prestation, TransactionService

NOTIFICATION_SUBJECT = "Le client vous a choisi — devis à proposer"


def besoin_requires_quote(besoin):
    return besoin.mode_budget == "sur_devis"


def prestation_requires_quote(prestation):
    return prestation.mode_tarification == "devis"


def match_requires_quote(besoin, prestation):
    """Flux devis : besoin « sur devis » ou prestation facturée « sur devis »."""
    return besoin_requires_quote(besoin) or prestation_requires_quote(prestation)


def quote_info_from_transaction(transaction):
    if transaction is None:
        return {
            "transaction_id": None,
            "devis_statut": None,
            "devis_montant_propose": None,
            "devis_description": "",
            "devis_date_proposition": None,
            "devis_date_reponse_client": None,
            "can_confirm_match": False,
            "awaiting_supplier": True,
            "awaiting_client": False,
        }
    statut = transaction.devis_statut
    return {
        "transaction_id": transaction.id,
        "devis_statut": statut,
        "devis_montant_propose": (
            str(transaction.devis_montant_propose) if transaction.devis_montant_propose is not None else None
        ),
        "devis_description": transaction.devis_description or "",
        "devis_date_proposition": transaction.devis_date_proposition,
        "devis_date_reponse_client": transaction.devis_date_reponse_client,
        "can_confirm_match": statut == "accepte_client",
        "awaiting_supplier": statut in ("a_proposer",),
        "awaiting_client": statut == "en_attente_client",
    }


def build_quote_context(besoin, prestation, transaction=None):
    ctx = {
        "besoin_sur_devis": besoin_requires_quote(besoin),
        "prestation_sur_devis": prestation_requires_quote(prestation),
        "match_requires_quote": match_requires_quote(besoin, prestation),
    }
    if ctx["match_requires_quote"]:
        ctx.update(quote_info_from_transaction(transaction))
    return ctx


def load_transactions_for_pairs(pairs):
    """pairs: iterable of (besoin_id, prestation_id) -> {(bid, pid): TransactionService}."""
    pairs = list(pairs)
    if not pairs:
        return {}
    q = Q()
    for bid, pid in pairs:
        q |= Q(besoin_id=bid, prestation_id=pid)
    txs = TransactionService.objects.filter(q).select_related("besoin", "prestation")
    return {(tx.besoin_id, tx.prestation_id): tx for tx in txs}


def ensure_quote_opportunity_transaction(besoin, prestation):
    """Crée ou réactive une transaction « opportunité devis » (en_attente)."""
    tx, created = TransactionService.objects.get_or_create(
        prestation=prestation,
        besoin=besoin,
        fournisseur=prestation.fournisseur,
        client=besoin.client,
        defaults={
            "statut": "en_attente",
            "devis_statut": "a_proposer",
            "notes": "Opportunité devis créée après matching.",
        },
    )
    updated = False
    if not created:
        if tx.statut in ("annulee", "terminee"):
            return tx, created, False
        if tx.devis_statut == "non_requis" and match_requires_quote(besoin, prestation):
            tx.devis_statut = "a_proposer"
            tx.statut = "en_attente"
            updated = True
        elif tx.statut not in ("en_cours",) and tx.devis_statut in (
            "a_proposer",
            "en_attente_client",
            "rejete_client",
        ):
            if tx.statut != "en_attente":
                tx.statut = "en_attente"
                updated = True
    if updated:
        tx.save(update_fields=["devis_statut", "statut", "updated_at"])
    return tx, created, updated


def notify_fournisseur_quote_opportunity(besoin, prestation, transaction):
    """Message système au fournisseur (une fois par opportunité nouvelle)."""
    fournisseur = prestation.fournisseur
    already = Message.objects.filter(
        transaction=transaction,
        destinataire=fournisseur,
        sujet=NOTIFICATION_SUBJECT,
    ).exists()
    if already:
        return False

    Message.objects.create(
        expediteur=besoin.client,
        destinataire=fournisseur,
        transaction=transaction,
        sujet=NOTIFICATION_SUBJECT,
        contenu=(
            f"Le client {besoin.client.username} a retenu votre prestation "
            f"« {prestation.intitule} » pour son besoin « {besoin.intitule} ». "
            "Merci de proposer votre devis depuis la transaction associée pour "
            "poursuivre la collaboration."
        ),
        lu=False,
    )
    return True


def process_quote_opportunities_after_matching(besoin, matches, notify=False):
    """
    Crée (ou réactive) les transactions opportunité devis pour chaque paire où
    match_requires_quote(besoin, prestation) est vrai.

    Par défaut, AUCUNE notification n'est envoyée au fournisseur : seul le
    fournisseur explicitement choisi par le client (confirmation de
    collaboration) est notifié, via initiate_quote_request_for_match().
    """
    summary = []
    for m in matches:
        prestation = m.get("prestation") if isinstance(m, dict) else m
        if not isinstance(prestation, Prestation):
            continue
        if not match_requires_quote(besoin, prestation):
            continue

        tx, created, _updated = ensure_quote_opportunity_transaction(besoin, prestation)
        notified = False
        if notify and (created or tx.devis_statut == "a_proposer"):
            notified = notify_fournisseur_quote_opportunity(besoin, prestation, tx)

        summary.append(
            {
                "prestation_id": prestation.id,
                "transaction_id": tx.id,
                "created": created,
                "notified": notified,
                "devis_statut": tx.devis_statut,
            }
        )
    return summary


def initiate_quote_request_for_match(besoin, prestation):
    """
    Le client a choisi ce fournisseur : on s'assure que l'opportunité de devis
    est active (statut « à proposer ») et on notifie UNIQUEMENT ce fournisseur.

    Retourne (transaction, notified).
    """
    tx, _created, _updated = ensure_quote_opportunity_transaction(besoin, prestation)

    if tx.devis_statut in (None, "non_requis", "rejete_client"):
        tx.devis_statut = "a_proposer"
        tx.statut = "en_attente"
        tx.save(update_fields=["devis_statut", "statut", "updated_at"])

    notified = notify_fournisseur_quote_opportunity(besoin, prestation, tx)
    return tx, notified
