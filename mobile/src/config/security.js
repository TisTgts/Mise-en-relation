/** Hôtes API autorisés en build de production. */
export const DEFAULT_PRODUCTION_HOSTS = ['toghinis.com', 'www.toghinis.com'];

export function isProductionBuild() {
  return process.env.EXPO_PUBLIC_APP_ENV === 'production';
}

function allowedProductionHosts() {
  const fromEnv = (process.env.EXPO_PUBLIC_API_ALLOWED_HOSTS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_PRODUCTION_HOSTS;
}

export function isHostAllowed(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (!host) return false;
  return allowedProductionHosts().some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

/** Bloque HTTP et hôtes non autorisés en production. */
export function assertSecureApiUrl(url) {
  if (!url) {
    throw new Error('[security] URL API manquante');
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('[security] URL API invalide');
  }

  if (isProductionBuild()) {
    if (parsed.protocol !== 'https:') {
      throw new Error('[security] HTTPS requis en production');
    }
    if (!isHostAllowed(parsed.hostname)) {
      throw new Error('[security] Hôte API non autorisé en production');
    }
  }

  return url.replace(/\/$/, '');
}
