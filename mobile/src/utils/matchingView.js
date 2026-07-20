/** Normalise une correspondance matching API → affichage mobile. */
export function normalizeMatchItem(item) {
  if (!item || typeof item !== 'object') return item;

  const details = item.prestation_details || item.prestation || {};
  const zones =
    item.zones_intervention ||
    details.service_areas ||
    details.zones_intervention ||
    [];

  return {
    ...item,
    prestation_id: item.prestation_id || details.id || item.id,
    fournisseur_nom:
      item.fournisseur_nom ||
      details.provider ||
      details.fournisseur_nom ||
      details.fournisseur?.username,
    ville:
      item.ville ||
      details.ville ||
      details.emplacement?.ville ||
      (Array.isArray(zones) ? zones[0] : null),
    zones_intervention: Array.isArray(zones) ? zones : [],
    tarif_min:
      item.tarif_min ??
      details.price_range_min ??
      details.tarif_min ??
      item.prestation?.tarif_min,
    note_moyenne:
      item.note_moyenne ??
      details.note_moyenne ??
      details.rating ??
      null,
    score: item.score ?? item.score_total ?? item.matching_score,
  };
}

export function normalizeMatches(payload) {
  if (!payload) return [];
  let list = [];
  if (Array.isArray(payload)) list = payload;
  else if (Array.isArray(payload.correspondances)) list = payload.correspondances;
  else if (Array.isArray(payload.matches)) list = payload.matches;
  else if (Array.isArray(payload.results)) list = payload.results;
  else if (Array.isArray(payload.data)) list = payload.data;
  return list.map(normalizeMatchItem);
}
