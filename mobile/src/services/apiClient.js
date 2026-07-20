import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { assertSecureApiUrl, isProductionBuild } from '../config/security';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from './tokenStorage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  maxRedirects: isProductionBuild() ? 0 : 5,
});

let refreshPromise = null;

function assertRequestUrl(config) {
  if (!isProductionBuild()) return;
  const base = (config.baseURL || API_BASE_URL).replace(/\/$/, '');
  assertSecureApiUrl(base);
}

apiClient.interceptors.request.use(async (config) => {
  assertRequestUrl(config);

  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refresh = await getRefreshToken();
          if (!refresh) throw new Error('No refresh token');

          const { data } = await axios.post(
            API_ENDPOINTS.AUTH.REFRESH,
            { refresh },
            {
              timeout: 20000,
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            }
          );

          await saveSession({
            access: data.access,
            refresh: data.refresh || refresh,
          });
          return data.access;
        })().finally(() => {
          refreshPromise = null;
        });
      }

      const access = await refreshPromise;
      original.headers.Authorization = `Bearer ${access}`;
      return apiClient(original);
    } catch (refreshError) {
      await clearSession();
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
