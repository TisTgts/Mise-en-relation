import Constants from 'expo-constants';
import { assertSecureApiUrl, isProductionBuild } from './security';

/** API hébergée (branche deploy/toghinis-com). */
export const PRODUCTION_API_URL = 'https://toghinis.com/api';

function hostFromMetro() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.manifest?.debuggerHost,
    Constants.linkingUri,
  ].filter(Boolean);

  for (const raw of candidates) {
    const cleaned = String(raw)
      .replace(/^exp:\/\//, '')
      .replace(/^https?:\/\//, '')
      .split('/')[0];
    const host = cleaned.split(':')[0];
    if (
      host &&
      host !== 'localhost' &&
      host !== '127.0.0.1' &&
      !host.includes('exp.direct')
    ) {
      return host;
    }
  }
  return null;
}

function isLocalApiUrl(url) {
  if (!url) return true;
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol === 'https:') return false;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '10.0.2.2' ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname)
    );
  } catch {
    return true;
  }
}

/** HTTP local réservé au développement — jamais appelé en build production. */
function resolveApiBaseUrl() {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

  // URL distante (HTTPS ou domaine prod) : ne jamais la remplacer par Metro/LAN
  if (fromEnv && !isLocalApiUrl(fromEnv)) {
    return fromEnv;
  }

  // Build EAS / store / release : HTTPS prod uniquement
  if (isProductionBuild() || !__DEV__) {
    return PRODUCTION_API_URL;
  }

  // Dev uniquement — module séparé pour éviter le HTTP dans le bundle prod
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const { resolveLocalApiBaseUrl } = require('./api.local');
  return resolveLocalApiBaseUrl(fromEnv, {
    hostFromMetro,
    isLocalApiUrl,
    productionUrl: PRODUCTION_API_URL,
  });
}

const resolvedApiBaseUrl = resolveApiBaseUrl();
export const API_BASE_URL = assertSecureApiUrl(resolvedApiBaseUrl);

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/accounts/login/`,
    REGISTER: `${API_BASE_URL}/accounts/register/`,
    REFRESH: `${API_BASE_URL}/accounts/token/refresh/`,
    LOGOUT: `${API_BASE_URL}/accounts/logout/`,
    LOGOUT_ALL: `${API_BASE_URL}/accounts/logout-all/`,
    DELETE_ACCOUNT: `${API_BASE_URL}/accounts/delete-account/`,
    PASSWORD_RESET: `${API_BASE_URL}/accounts/password-reset/`,
    PASSWORD_RESET_CONFIRM: `${API_BASE_URL}/accounts/password-reset/confirm/`,
    PUSH_TOKEN: `${API_BASE_URL}/accounts/push-token/`,
  },
  USER: {
    PROFILE: `${API_BASE_URL}/accounts/profile/`,
    ME: `${API_BASE_URL}/accounts/me/`,
  },
  CONFIG: {
    COUNTRY: `${API_BASE_URL}/config/country/`,
  },
  SERVICES: {
    CATEGORIES_ALL: `${API_BASE_URL}/services/categories/all/`,
    PRESTATIONS: `${API_BASE_URL}/services/prestations/`,
    PRESTATIONS_MY: `${API_BASE_URL}/services/prestations/my/`,
    PRESTATION_DETAIL: (id) => `${API_BASE_URL}/services/prestations/${id}/`,
    BESOINS: `${API_BASE_URL}/services/besoins/`,
    BESOINS_MY: `${API_BASE_URL}/services/besoins/my/`,
    BESOIN_DETAIL: (id) => `${API_BASE_URL}/services/besoins/${id}/`,
    TRANSACTIONS: `${API_BASE_URL}/services/transactions/`,
    TRANSACTION_DETAIL: (id) => `${API_BASE_URL}/services/transactions/${id}/`,
    TRANSACTION_AVIS: (id) => `${API_BASE_URL}/services/transactions/${id}/avis/`,
    TRANSACTION_CREATE: `${API_BASE_URL}/services/transactions/create/`,
    TRANSACTION_PROPOSE_DEVIS: (id) =>
      `${API_BASE_URL}/services/transactions/${id}/fournisseur-propose-devis/`,
    TRANSACTION_RESPOND_DEVIS: (id) =>
      `${API_BASE_URL}/services/transactions/${id}/client-respond-devis/`,
    TRANSACTION_WORK_DONE: (id) =>
      `${API_BASE_URL}/services/transactions/${id}/fournisseur-work-done/`,
    TRANSACTION_CLIENT_VERIFY: (id) =>
      `${API_BASE_URL}/services/transactions/${id}/client-verify/`,
    TRANSACTION_CLIENT_CONFIRM: (id) =>
      `${API_BASE_URL}/services/transactions/${id}/client-confirm/`,
    MESSAGES: `${API_BASE_URL}/services/messages/`,
    MESSAGES_MARK_READ: `${API_BASE_URL}/services/messages/mark-read/`,
  },
  MATCHING: {
    FIND_FOR_BESOIN: (id) =>
      `${API_BASE_URL}/matching/trouver-correspondances/besoin/${id}/`,
    FIND_FOR_PRESTATION: (id) =>
      `${API_BASE_URL}/matching/trouver-correspondances/prestation/${id}/`,
    CLIENT_CONFIRMER: `${API_BASE_URL}/matching/client/confirmer-match/`,
    CLIENT_FOURNISSEUR_PROFIL: (id) =>
      `${API_BASE_URL}/matching/client/fournisseurs/${id}/profil/`,
  },
};

export default API_BASE_URL;
