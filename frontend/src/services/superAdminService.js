import { API_ENDPOINTS } from '../config/api';

// Service dédié aux actions réservées au super administrateur :
// gestion des comptes d'administration (liste, création, rôle, activation).

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
});

async function parseError(response, fallback) {
  const data = await response.json().catch(() => ({}));
  return data.error || data.detail || data.username?.[0] || data.email?.[0]
    || data.password?.[0] || fallback;
}

class SuperAdminService {
  async getAdmins() {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.ADMINS, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(await parseError(response, 'Impossible de charger les administrateurs.'));
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  async createAdmin(payload) {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.ADMINS, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await parseError(response, "Impossible de créer le compte."));
    }
    return response.json();
  }

  async setUserRole(userId, typeUtilisateur) {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.SET_ROLE(userId), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ type_utilisateur: typeUtilisateur }),
    });
    if (!response.ok) {
      throw new Error(await parseError(response, "Impossible de modifier le rôle."));
    }
    return response.json();
  }

  async toggleStatus(userId) {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.TOGGLE_STATUS(userId), {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await parseError(response, "Impossible de changer le statut."));
    }
    return response.json();
  }

  async getCountry() {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.COUNTRY, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(await parseError(response, "Impossible de charger les pays."));
    }
    return response.json();
  }

  async setCountry(code) {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.COUNTRY, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      throw new Error(await parseError(response, "Impossible de changer le pays."));
    }
    return response.json();
  }

  async getHealth() {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.HEALTH, { headers: authHeaders() });
    if (!response.ok) {
      throw new Error(await parseError(response, "Impossible de charger l'état de santé."));
    }
    return response.json();
  }

  async resetMetrics() {
    const response = await fetch(API_ENDPOINTS.SUPERADMIN.HEALTH, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new Error(await parseError(response, "Impossible de réinitialiser les compteurs."));
    }
    return response.json();
  }
}

const superAdminService = new SuperAdminService();
export default superAdminService;
