import { API_ENDPOINTS } from '../config/api';
import { apiErrorFromResponse, apiFetch } from '../utils/apiErrors';

const buildAuthHeaders = (extra = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = { 'X-Client-App': 'toghinis-web', ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const ensureOk = async (response, fallback) => {
  if (!response.ok) throw await apiErrorFromResponse(response, fallback);
  return response;
};

class DemandesService {
  // Récupérer toutes les demandes
  async getAllDemandes() {
    let url = API_ENDPOINTS.SERVICES.BESOINS;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.type_utilisateur === 'fournisseur') {
      url = `${API_ENDPOINTS.SERVICES.BESOINS}?available=true`;
    }
    const response = await apiFetch(url, { headers: buildAuthHeaders() });
    await ensureOk(response, 'Impossible de charger les besoins. Actualisez la page.');
    return response.json();
  }

  // Récupérer toutes les demandes publiques (pour les fournisseurs)
  async getAllPublicDemandes() {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}public/`);
    await ensureOk(response, 'Impossible de charger les besoins publiés. Actualisez la page.');
    const data = await response.json();
    return data.results || data;
  }

  // Récupérer une demande par ID
  async getDemandeById(id) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}${id}/`, {
      headers: buildAuthHeaders(),
    });
    await ensureOk(response, 'Impossible de charger ce besoin. Revenez à la liste et réessayez.');
    return response.json();
  }

  // Créer une nouvelle demande
  async createDemande(demandeData) {
    const response = await apiFetch(API_ENDPOINTS.SERVICES.BESOINS, {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(demandeData),
    });
    await ensureOk(response, "Le besoin n'a pas pu être publié. Vérifiez le formulaire puis réessayez.");
    return response.json();
  }

  // Mettre à jour une demande
  async updateDemande(id, demandeData) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}${id}/`, {
      method: 'PATCH',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(demandeData),
    });
    await ensureOk(response, "Les modifications n'ont pas pu être enregistrées. Vérifiez le formulaire puis réessayez.");
    return response.json();
  }

  // Supprimer une demande
  async deleteDemande(id) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}${id}/`, {
      method: 'DELETE',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    });
    await ensureOk(response, "Le besoin n'a pas pu être supprimé. Réessayez dans un instant.");
    return true;
  }

  // Récupérer les besoins du client connecté (endpoint dédié backend)
  async getMyDemandes() {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}my/`, {
      headers: buildAuthHeaders(),
    });
    await ensureOk(response, 'Impossible de charger vos besoins. Actualisez la page.');
    return response.json();
  }

  // Récupérer les demandes par catégorie
  async getDemandesByCategory(categorieId) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}?categorie=${categorieId}`);
    await ensureOk(response, 'Impossible de charger les besoins de cette catégorie.');
    return response.json();
  }

  // Rechercher des demandes
  async searchDemandes(query) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}?search=${encodeURIComponent(query)}`);
    await ensureOk(response, 'La recherche a échoué. Réessayez.');
    return response.json();
  }

  // Récupérer les demandes urgentes
  async getDemandesUrgentes() {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.BESOINS}?urgence=haute`);
    await ensureOk(response, 'Impossible de charger les besoins urgents.');
    return response.json();
  }
}

const demandesService = new DemandesService();
export default demandesService;
