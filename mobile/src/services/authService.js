import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { isNetworkError, NETWORK_USER_MSG, sanitizeErrorMessage } from '../utils/secureError';
import { fieldErrorsFromPayload, messageFromPayload, translateMessage } from '../utils/errorMessages';
import { clearSession, getRefreshToken, saveSession } from './tokenStorage';

function extractErrorMessage(errOrData, fallback = 'Une erreur est survenue. Réessayez.') {
  if (errOrData && typeof errOrData === 'object' && errOrData.isAxiosError) {
    if (isNetworkError(errOrData)) {
      return NETWORK_USER_MSG;
    }
    if (!errOrData.response) {
      return sanitizeErrorMessage(errOrData.message, NETWORK_USER_MSG);
    }
    const { data, status } = errOrData.response;
    return sanitizeErrorMessage(messageFromPayload(data, status, fallback), fallback);
  }

  if (errOrData instanceof Error) {
    // TypeError, ReferenceError… : bug interne, rien d'utile à montrer à l'utilisateur.
    if (errOrData.name !== 'Error') return fallback;
    return sanitizeErrorMessage(translateMessage(errOrData.message), fallback);
  }
  if (!errOrData) return fallback;
  return sanitizeErrorMessage(messageFromPayload(errOrData, 0, fallback), fallback);
}

/** Mappe les erreurs DRF champ → { field: message } pour validation inline. */
function extractFieldErrors(err) {
  const data = err?.isAxiosError ? err.response?.data : err;
  if (err?.isAxiosError && (err.response?.status || 0) >= 500) return {};
  return fieldErrorsFromPayload(data);
}

export async function login(email, password) {
  const { data } = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    email: email.trim(),
    password,
  });

  await saveSession({
    access: data.access,
    refresh: data.refresh,
    typeUtilisateur: data.user?.type_utilisateur,
  });

  return data;
}

export async function register(payload) {
  const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);

  if (data.access) {
    await saveSession({
      access: data.access,
      refresh: data.refresh,
      typeUtilisateur: data.user?.type_utilisateur,
    });
  }

  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get(API_ENDPOINTS.USER.ME);
  return data;
}

export async function logout() {
  try {
    const refresh = await getRefreshToken();
    let pushToken = null;
    try {
      const { getStoredPushToken } = require('./pushNotifications');
      pushToken = await getStoredPushToken();
    } catch {
      /* ignore */
    }
    if (refresh) {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
        refresh,
        ...(pushToken ? { push_token: pushToken } : {}),
      });
    }
  } catch {
    // ignore
  } finally {
    await clearSession();
  }
}

/** Révoque toutes les sessions JWT + tokens push côté serveur. */
export async function logoutAll() {
  try {
    const refresh = await getRefreshToken();
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT_ALL, {
      ...(refresh ? { refresh } : {}),
    });
  } catch {
    // ignore — on nettoie quand même le local
  } finally {
    await clearSession();
  }
}

/** Anonymise / désactive le compte (confirmation: SUPPRIMER). */
export async function deleteAccount() {
  const refresh = await getRefreshToken();
  await apiClient.post(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, {
    confirmation: 'SUPPRIMER',
    ...(refresh ? { refresh } : {}),
  });
  await clearSession();
}

export async function requestPasswordReset(email) {
  const { data } = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
    email: email.trim(),
  });
  return data;
}

export async function confirmPasswordReset(email, code, password) {
  const { data } = await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
    email: email.trim(),
    code: String(code).trim(),
    password,
  });
  return data;
}

export async function registerPushToken(token, platform) {
  if (!token) return null;
  const { data } = await apiClient.post(API_ENDPOINTS.AUTH.PUSH_TOKEN, {
    token,
    platform: platform || '',
  });
  return data;
}

export async function unregisterPushToken(token) {
  if (!token) return null;
  try {
    await apiClient.delete(API_ENDPOINTS.AUTH.PUSH_TOKEN, { data: { token } });
  } catch {
    /* ignore */
  }
  return null;
}

export { extractErrorMessage, extractFieldErrors, isNetworkError };
