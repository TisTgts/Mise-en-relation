import { isProductionBuild } from '../config/security';

const NETWORK_HINTS = [
  'network error',
  'timeout',
  'econnrefused',
  'enotfound',
  'socket',
  'failed to fetch',
  'network request failed',
  'err_network',
  'econnaborted',
];

const NETWORK_USER_MSG =
  'Connexion impossible. Vérifiez votre réseau et réessayez.';

function isNetworkMessage(text) {
  const lower = String(text || '').toLowerCase();
  return NETWORK_HINTS.some((hint) => lower.includes(hint));
}

/** True si l’erreur Axios / message évoque un problème réseau. */
export function isNetworkError(err) {
  if (!err) return false;
  if (err.isAxiosError) {
    if (!err.response) return true;
    const code = String(err.code || '').toLowerCase();
    if (code === 'err_network' || code === 'econnaborted' || code === 'etimedout') {
      return true;
    }
  }
  return isNetworkMessage(err.message || err);
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
    return NETWORK_USER_MSG;
  }

  if (/https?:\/\//i.test(text) || /Bearer\s+\S+/i.test(text)) {
    return fallback;
  }

  if (text.length > 180) {
    return fallback;
  }

  return text;
}

export { NETWORK_USER_MSG };
