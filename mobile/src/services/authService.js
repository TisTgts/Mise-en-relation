import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { sanitizeErrorMessage } from '../utils/secureError';
import { clearSession, getRefreshToken, saveSession } from './tokenStorage';

function extractErrorMessage(errOrData, fallback) {
  if (errOrData && typeof errOrData === 'object' && errOrData.isAxiosError) {
    if (!errOrData.response) {
      return sanitizeErrorMessage(
        errOrData.message,
        'Connexion impossible. Vérifiez votre réseau et réessayez.'
      );
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
    if (refresh) {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refresh });
    }
  } catch {
    // ignore
  } finally {
    await clearSession();
  }
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

export { extractErrorMessage };
