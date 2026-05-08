/** Utilitaires partagés pour l’espace client (cohérence visuelle et données). */

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

export function besoinStatutPillClass(statut) {
  switch (statut) {
    case 'ouverte':
      return 'bg-emerald-100 text-emerald-800';
    case 'en_cours':
      return 'bg-blue-100 text-blue-800';
    case 'pourvue':
      return 'bg-violet-100 text-violet-800';
    case 'annulee':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function besoinStatutLabel(statut) {
  const m = {
    ouverte: 'Ouvert',
    en_cours: 'En cours',
    pourvue: 'Pourvu',
    annulee: 'Annulé',
  };
  return m[statut] || statut || '—';
}

/** Étapes du cycle de vie du besoin (pour timeline détail / tableau). */
export function besoinStepsFromStatut(statut) {
  const isCancelled = statut === 'annulee';
  const rank =
    {
      ouverte: 0,
      en_cours: 1,
      pourvue: 2,
    }[statut] ?? 0;

  const steps = [
    { key: 'ouverte', label: 'Besoin publié' },
    { key: 'en_cours', label: 'Mise en relation' },
    { key: 'pourvue', label: 'Besoin pourvu' },
  ];

  return steps.map((step, index) => {
    const done = !isCancelled && index < rank;
    const current = !isCancelled && index === rank;
    return { ...step, done, current, blocked: isCancelled && index > 0 };
  });
}

export function urgencePillClass(u) {
  switch (u) {
    case 'urgente':
      return 'bg-red-100 text-red-800';
    case 'haute':
      return 'bg-orange-100 text-orange-800';
    case 'normale':
      return 'bg-amber-100 text-amber-800';
    case 'basse':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function urgenceLabel(u) {
  const m = { basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' };
  return m[u] || u || '—';
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

export function transactionStatutLabel(statut) {
  const m = {
    en_attente: 'En attente',
    acceptee: 'Acceptée',
    en_cours: 'En cours',
    terminee: 'Terminée',
    annulee: 'Annulée',
  };
  return m[statut] || statut || '—';
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
