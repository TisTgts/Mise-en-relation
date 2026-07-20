import { isProductionBuild } from '../config/security';

const NETWORK_HINTS = [
  'network error',
  'timeout',
  'econnrefused',
  'enotfound',
  'socket',
  'failed to fetch',
];

function isNetworkMessage(text) {
  const lower = text.toLowerCase();
  return NETWORK_HINTS.some((hint) => lower.includes(hint));
}

/** Messages utilisateur sans fuite d'URL, tokens ou détails internes. */
export function sanitizeErrorMessage(message, fallback = 'Une erreur est survenue') {
  if (!message) return fallback;

  if (__DEV__ && !isProductionBuild()) {
    return String(message);
  }

  const text = String(message).trim();
  if (!text) return fallback;

  if (isNetworkMessage(text)) {
    return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
  }

  if (/https?:\/\//i.test(text) || /Bearer\s+\S+/i.test(text)) {
    return fallback;
  }

  if (text.length > 180) {
    return fallback;
  }

  return text;
}
