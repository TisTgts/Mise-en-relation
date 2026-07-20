import { formatDate, formatMoney } from './format';

const TX_STATUT_LABELS = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const DEVIS_STATUT_LABELS = {
  non_requis: 'Devis non requis',
  a_proposer: 'Devis à proposer',
  en_attente_client: 'Devis en attente client',
  accepte_client: 'Devis accepté',
  rejete_client: 'Devis rejeté',
};

function pickNestedLabel(tx, flatKey, nestedKey) {
  if (!tx) return null;
  if (tx[flatKey]) return tx[flatKey];
  const nested = tx[nestedKey];
  if (nested && typeof nested === 'object') {
    return nested.intitule || nested.titre || nested.title || nested.nom || null;
  }
  return null;
}

function formatPersonName(entity) {
  if (!entity || typeof entity !== 'object') return null;
  const full = [entity.first_name, entity.last_name].filter(Boolean).join(' ').trim();
  return full || entity.raison_sociale || entity.username || entity.email || null;
}

function pickPartnerName(tx, role) {
  if (!tx) return '—';
  if (role === 'fournisseur') {
    return (
      tx.client_nom ||
      formatPersonName(tx.client) ||
      (typeof tx.client === 'object' ? tx.client?.username : null) ||
      'Client'
    );
  }
  return (
    tx.fournisseur_nom ||
    formatPersonName(tx.fournisseur) ||
    (typeof tx.fournisseur === 'object' ? tx.fournisseur?.username : null) ||
    'Fournisseur'
  );
}

export function labelTransactionStatut(statut) {
  return TX_STATUT_LABELS[statut] || statut || '—';
}

export function labelDevisStatut(statut) {
  return DEVIS_STATUT_LABELS[statut] || statut || '—';
}

/** Titre principal d'une collaboration (aligné web). */
export function pickTransactionTitle(tx, role = 'client') {
  if (!tx) return '—';
  const besoin = pickNestedLabel(tx, 'besoin_intitule', 'besoin');
  const presta = pickNestedLabel(tx, 'prestation_intitule', 'prestation');

  if (role === 'fournisseur') {
    return presta || besoin || `Collaboration #${tx.id}`;
  }
  return besoin || presta || `Collaboration #${tx.id}`;
}

export function pickTransactionPartner(tx, role = 'client') {
  return pickPartnerName(tx, role);
}

export function pickTransactionAmount(tx) {
  if (!tx) return null;
  if (tx.prix_final != null && tx.prix_final !== '') return tx.prix_final;
  if (tx.devis_montant_propose != null && tx.devis_montant_propose !== '') {
    return tx.devis_montant_propose;
  }
  return null;
}

export function formatTransactionAmount(tx) {
  const amount = pickTransactionAmount(tx);
  return amount != null ? formatMoney(amount) : 'Montant à définir';
}

export function transactionSummary(tx, role = 'client') {
  return {
    id: tx.id,
    title: pickTransactionTitle(tx, role),
    partner: pickTransactionPartner(tx, role),
    partnerLabel: role === 'fournisseur' ? 'Client' : 'Fournisseur',
    besoin: pickNestedLabel(tx, 'besoin_intitule', 'besoin'),
    prestation: pickNestedLabel(tx, 'prestation_intitule', 'prestation'),
    statut: tx.statut,
    statutLabel: labelTransactionStatut(tx.statut),
    devisStatut: tx.devis_statut,
    devisLabel: labelDevisStatut(tx.devis_statut),
    amount: formatTransactionAmount(tx),
    amountRaw: pickTransactionAmount(tx),
    date: formatDate(tx.updated_at || tx.created_at),
    notes: (tx.notes && String(tx.notes).trim()) || null,
    workDone: !!tx.travail_fournisseur_termine,
    verifDone: !!tx.verification_client_effectuee,
    verifOk: !!tx.verification_client_validee,
  };
}

/** Prochaine action attendue sur une collaboration. */
export function pickTransactionNextAction(tx, role = 'client') {
  if (!tx || tx.statut === 'terminee' || tx.statut === 'annulee') return null;
  const devis = tx.devis_statut || 'non_requis';
  const isClient = role === 'client';

  if (!isClient && devis === 'a_proposer') {
    return { label: 'Proposer un devis', icon: 'receipt-outline', tone: 'primary' };
  }
  if (isClient && devis === 'en_attente_client') {
    return { label: 'Répondre au devis', icon: 'receipt-outline', tone: 'warning' };
  }
  if (
    !isClient &&
    (devis === 'accepte_client' || devis === 'non_requis') &&
    !tx.travail_fournisseur_termine &&
    tx.statut !== 'terminee'
  ) {
    return { label: 'Marquer le travail terminé', icon: 'checkmark-done-outline', tone: 'primary' };
  }
  if (isClient && tx.travail_fournisseur_termine && !tx.verification_client_effectuee) {
    return { label: 'Vérifier le travail', icon: 'shield-checkmark-outline', tone: 'warning' };
  }
  if (
    isClient &&
    tx.verification_client_effectuee &&
    tx.verification_client_validee &&
    tx.statut !== 'terminee'
  ) {
    return { label: 'Clôturer la collaboration', icon: 'ribbon-outline', tone: 'success' };
  }
  return { label: 'Envoyer un message', icon: 'chatbubbles-outline', tone: 'muted' };
}

export function pickTransactionReview(tx) {
  const avis = tx?.avis;
  if (!avis) return null;
  return {
    rating: avis.rating ?? avis.note,
    comment: avis.comment ?? avis.commentaire ?? '',
    date: avis.date ?? avis.created_at,
    auteur: avis.auteur ?? avis.auteur_nom,
  };
}

export const TRANSACTION_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'acceptee', label: 'Acceptées' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'terminee', label: 'Terminées' },
  { value: 'annulee', label: 'Annulées' },
  { value: 'avec_avis', label: 'Avec avis' },
  { value: 'sans_avis', label: 'Sans avis' },
];
