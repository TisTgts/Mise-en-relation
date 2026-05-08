import { fetchAllPaginated as apiFetchAllPaginated } from '../../services/apiClient';

export function parseListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

export async function fetchAllPaginated(initialUrl, headers) {
  // Délégation vers le client API unifié (pagination + parsing erreurs).
  return apiFetchAllPaginated(initialUrl, { headers });
}

export function truncateText(text, max = 56) {
  if (text == null || text === '') return '—';
  const s = String(text);
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

export function prestationStatutLabel(statut) {
  const map = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'En attente',
    en_cours: 'En cours',
    terminee: 'Terminée',
    annulee: 'Annulée',
  };
  return map[statut] || statut || '—';
}

export function prestationStatutPillClass(statut) {
  switch (statut) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800';
    case 'inactive':
      return 'bg-slate-100 text-slate-700';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'en_cours':
      return 'bg-blue-100 text-blue-800';
    case 'terminee':
      return 'bg-violet-100 text-violet-800';
    case 'annulee':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function transactionStatutLabel(statut) {
  const map = {
    en_attente: 'En attente',
    acceptee: 'Acceptée',
    en_cours: 'En cours',
    terminee: 'Terminée',
    annulee: 'Annulée',
  };
  return map[statut] || statut || '—';
}

export function transactionStatutPillClass(statut) {
  switch (statut) {
    case 'en_attente':
      return 'bg-amber-100 text-amber-900';
    case 'acceptee':
    case 'en_cours':
      return 'bg-blue-100 text-blue-800';
    case 'terminee':
      return 'bg-emerald-100 text-emerald-800';
    case 'annulee':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function formatMoneyFcfa(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

export function formatDateShort(iso) {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? '—' : new Date(iso).toLocaleDateString('fr-FR');
}
