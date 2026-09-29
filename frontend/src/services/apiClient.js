// Client API front unifié : ajout JWT + parsing erreurs + pagination standard.
import { apiErrorFromResponse, apiFetch } from '../utils/apiErrors';

const getAccessToken = () => localStorage.getItem('access_token');

const getAuthHeaders = () => {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export async function request(url, options = {}) {
  const tokenHeaders = getAuthHeaders();
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-App': 'toghinis-web',
    ...(tokenHeaders || {}),
    ...(options.headers || {}),
  };

  const res = await apiFetch(url, { ...options, headers });

  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }

  return res;
}

export async function requestJson(url, options = {}) {
  const res = await request(url, options);
  return res.json();
}

export async function fetchAllPaginated(initialUrl, { headers = {}, maxPages = 200 } = {}) {
  let nextUrl = initialUrl;
  const all = [];
  let pages = 0;

  while (nextUrl) {
    pages += 1;
    if (pages > maxPages) break;

    const tokenHeaders = getAuthHeaders();
    const res = await apiFetch(nextUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(tokenHeaders || {}),
        ...(headers || {}),
      },
    });

    if (!res.ok) {
      throw await apiErrorFromResponse(res);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      all.push(...data);
      break;
    }
    if (data && Array.isArray(data.results)) {
      all.push(...data.results);
      nextUrl = data.next || null;
      continue;
    }

    // Si le format inattendu arrive, on stoppe.
    break;
  }

  return all;
}

