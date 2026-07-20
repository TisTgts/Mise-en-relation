export function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export function formatMoney(value, suffix = 'FCFA') {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n.toLocaleString('fr-FR')} ${suffix}`;
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

export function pickTitle(item) {
  return item?.intitule || item?.titre || item?.title || item?.sujet || `#${item?.id ?? '?'}`;
}

export function relativeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return formatDate(value);
}
