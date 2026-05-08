// Client API front unifié : ajout JWT + parsing erreurs + pagination standard.

const getAccessToken = () => localStorage.getItem('access_token');

const getAuthHeaders = () => {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const parseErrorMessage = async (res) => {
  const payload = await safeJson(res);
  if (payload) {
    // Cas DRF typiques : { detail: "..."} ou { error: "..."} ou champs de validation { nom: [..] }
    if (payload.detail) return payload.detail;
    if (payload.error) return payload.error;
    if (payload.errors && typeof payload.errors === 'object') {
      const firstKey = Object.keys(payload.errors)[0];
      const firstVal = payload.errors[firstKey];
      if (Array.isArray(firstVal) && firstVal[0]) return String(firstVal[0]);
    }
    if (payload.nom && Array.isArray(payload.nom) && payload.nom[0]) return String(payload.nom[0]);
    if (payload.message) return String(payload.message);
  }
  // fallback
  return `HTTP ${res.status}`;
};

export async function request(url, options = {}) {
  const tokenHeaders = getAuthHeaders();
  const headers = {
    'Content-Type': 'application/json',
    ...(tokenHeaders || {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg);
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
    const res = await fetch(nextUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(tokenHeaders || {}),
        ...(headers || {}),
      },
    });

    if (!res.ok) {
      const msg = await parseErrorMessage(res);
      throw new Error(msg);
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

