/** Palette AppName (.net) — bleu contemporain. */
export const colors = {
  primary: '#1D4ED8',
  primaryDark: '#1E3A8A',
  primaryMid: '#3B82F6',
  primarySoft: '#DBEAFE',
  primaryMuted: '#EFF6FF',
  accent: '#0EA5E9',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#059669',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  overlay: 'rgba(15, 23, 42, 0.45)',
  /** Boutons d’action uniquement — tons discrets (Modifier, Supprimer, etc.). */
  button: {
    fill: '#64748B',
    fillDanger: '#B85C5C',
    text: '#FFFFFF',
    secondaryBorder: '#CBD5E1',
    secondaryText: '#475569',
    ghostText: '#64748B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const statusColors = {
  ouverte: { bg: colors.successSoft, fg: colors.success },
  active: { bg: colors.successSoft, fg: colors.success },
  en_cours: { bg: colors.primarySoft, fg: colors.primary },
  en_attente: { bg: colors.warningSoft, fg: colors.warning },
  acceptee: { bg: colors.primarySoft, fg: colors.primaryDark },
  pourvue: { bg: colors.primarySoft, fg: colors.primaryDark },
  terminee: { bg: '#E2E8F0', fg: colors.textMuted },
  annulee: { bg: colors.dangerSoft, fg: colors.danger },
  inactive: { bg: '#E2E8F0', fg: colors.textMuted },
  a_proposer: { bg: colors.warningSoft, fg: colors.warning },
  en_attente_client: { bg: colors.warningSoft, fg: colors.warning },
  accepte_client: { bg: colors.successSoft, fg: colors.success },
  rejete_client: { bg: colors.dangerSoft, fg: colors.danger },
  non_requis: { bg: '#E2E8F0', fg: colors.textMuted },
};

const STATUT_LABELS = {
  ouverte: 'Ouverte',
  active: 'Active',
  inactive: 'Inactive',
  en_cours: 'En cours',
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  pourvue: 'Pourvue',
  terminee: 'Terminée',
  annulee: 'Annulée',
  a_proposer: 'Devis à proposer',
  en_attente_client: 'Devis en attente',
  accepte_client: 'Devis accepté',
  rejete_client: 'Devis rejeté',
  non_requis: 'Sans devis',
};

export function labelStatut(value) {
  if (!value) return '—';
  const key = String(value).toLowerCase();
  return STATUT_LABELS[key] || String(value).replace(/_/g, ' ');
}
