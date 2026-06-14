/** Libellés et règles tarification (modèle hybride). */

export const MODE_BUDGET_LABELS = {
  budget_fixe: 'Budget fixe',
  sur_devis: 'Sur devis',
};

export const MODE_TARIFICATION_LABELS = {
  fixe: 'Forfait',
  forfait: 'Forfait',
  horaire: 'À l\'heure',
  devis: 'Sur devis',
};

export const DEVIS_STATUT_LABELS = {
  non_requis: 'Sans devis',
  a_proposer: 'Devis à proposer',
  en_attente_client: 'Devis en attente',
  accepte_client: 'Devis accepté',
  rejete_client: 'Devis rejeté',
};

export function labelModeBudget(mode) {
  return MODE_BUDGET_LABELS[mode] || mode || '—';
}

export function labelModeTarification(mode) {
  return MODE_TARIFICATION_LABELS[mode] || mode || '—';
}

export function labelDevisStatut(statut) {
  return DEVIS_STATUT_LABELS[statut] || statut || '—';
}

/** Besoin sur devis ou prestation sur devis → flux devis obligatoire. */
export function matchRequiresQuote(besoin, prestation) {
  return (
    besoin?.mode_budget === 'sur_devis' || prestation?.mode_tarification === 'devis'
  );
}

export function devisStatutPillClass(statut) {
  switch (statut) {
    case 'accepte_client':
      return 'bg-emerald-100 text-emerald-800';
    case 'en_attente_client':
      return 'bg-amber-100 text-amber-800';
    case 'a_proposer':
      return 'bg-violet-100 text-violet-800';
    case 'rejete_client':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
