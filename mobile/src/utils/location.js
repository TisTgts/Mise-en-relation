/** Helpers lieu : ville, quartier, texte API. */

export function formatLieuIntervention({ ville, quartier, adresse } = {}) {
  const parts = [];
  if (ville?.trim()) parts.push(ville.trim());
  if (quartier?.trim()) {
    if (parts.length) {
      return `${parts[0]} — ${quartier.trim()}`;
    }
    parts.push(quartier.trim());
  }
  if (adresse?.trim() && !quartier?.trim()) {
    parts.push(adresse.trim());
  }
  return parts.join(' — ') || '';
}

export function parseLieuIntervention(text) {
  if (!text || typeof text !== 'string') {
    return { ville: '', quartier: '', adresse: '' };
  }
  const parts = text.split('—').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { ville: parts[0], quartier: parts[1], adresse: parts.slice(2).join(' — ') };
  }
  return { ville: parts[0] || '', quartier: '', adresse: '' };
}

export function staticMapUrl(latitude, longitude, width = 600, height = 280) {
  if (latitude == null || longitude == null) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=${width}x${height}&markers=${lat},${lng},lightblue1`;
}

export function openInMaps(latitude, longitude, label = '') {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}
