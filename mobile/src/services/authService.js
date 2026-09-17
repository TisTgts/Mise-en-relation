import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { isNetworkError, NETWORK_USER_MSG, sanitizeErrorMessage } from '../utils/secureError';
import { clearSession, getRefreshToken, saveSession } from './tokenStorage';

function extractErrorMessage(errOrData, fallback) {
  if (errOrData && typeof errOrData === 'object' && errOrData.isAxiosError) {
    if (isNetworkError(errOrData)) {
      return NETWORK_USER_MSG;
    }
    if (!errOrData.response) {
      return sanitizeErrorMessage(errOrData.message, NETWORK_USER_MSG);
    }
    return extractErrorMessage(errOrData.response.data, fallback);
  }

  const data = errOrData;
  if (!data) return fallback;
  if (typeof data === 'string') return sanitizeErrorMessage(data, fallback);
  if (typeof data.detail === 'string') return sanitizeErrorMessage(data.detail, fallback);
  if (Array.isArray(data.non_field_errors)) {
    return sanitizeErrorMessage(data.non_field_errors.join(' '), fallback);
  }
  if (typeof data.message === 'string') return sanitizeErrorMessage(data.message, fallback);

  const fieldErrors = Object.entries(data)
    .filter(([k]) => k !== 'detail')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
    .join(' | ');

  return sanitizeErrorMessage(fieldErrors, fallback);
}

/** Mappe les erreurs DRF champ → { field: message } pour validation inline. */
function extractFieldErrors(err) {
  const data = err?.isAxiosError ? err.response?.data : err;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'detail' || key === 'non_field_errors' || key === 'message') continue;
    if (Array.isArray(value)) out[key] = value.join(', ');
    else if (typeof value === 'string') out[key] = value;
  }
  return out;
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
