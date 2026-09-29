import { API_ENDPOINTS } from '../config/api';
import { apiErrorFromResponse, apiFetch } from '../utils/apiErrors';

const authHeaders = (extra = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = { 'X-Client-App': 'toghinis-web', ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const ensureOk = async (response, fallback) => {
  if (!response.ok) throw await apiErrorFromResponse(response, fallback);
  return response;
};

class PrestationsService {
  // Récupérer toutes les prestations
  async getAllPrestations() {
    const response = await apiFetch(API_ENDPOINTS.SERVICES.PRESTATIONS, { headers: authHeaders() });
    await ensureOk(response, 'Impossible de charger les prestations. Actualisez la page.');
    return response.json();
  }

  // Récupérer toutes les prestations publiques (pour les clients)
  async getAllPublicPrestations() {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}public/`);
    await ensureOk(response, 'Impossible de charger les prestations publiées. Actualisez la page.');
    const data = await response.json();
    return data.results || data;
  }

  // Récupérer une prestation par ID
  async getPrestationById(id) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/`, {
      headers: authHeaders(),
    });
    await ensureOk(response, 'Impossible de charger cette prestation. Revenez à la liste et réessayez.');
    return response.json();
  }

  // Créer une nouvelle prestation
  async createPrestation(prestationData) {
    const response = await apiFetch(API_ENDPOINTS.SERVICES.PRESTATIONS, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(prestationData),
    });
    await ensureOk(response, "La prestation n'a pas pu être publiée. Vérifiez le formulaire puis réessayez.");
    return response.json();
  }

  // Mettre à jour une prestation
  async updatePrestation(id, prestationData) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(prestationData),
    });
    await ensureOk(response, "Les modifications n'ont pas pu être enregistrées. Vérifiez le formulaire puis réessayez.");
    return response.json();
  }

  // Supprimer une prestation
  async deletePrestation(id) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/delete/`, {
      method: 'DELETE',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
    });
    await ensureOk(response, "La prestation n'a pas pu être supprimée. Réessayez dans un instant.");
    return true;
  }

  // Récupérer les prestations du fournisseur connecté
  async getMyPrestations() {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}my/`, {
      headers: authHeaders({ 'Content-Type': 'application/json' }),
    });
    await ensureOk(response, 'Impossible de charger vos prestations. Actualisez la page.');
    return response.json();
  }

  // Récupérer les prestations par catégorie
  async getPrestationsByCategory(categorieId) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}?categorie=${categorieId}`);
    await ensureOk(response, 'Impossible de charger les prestations de cette catégorie.');
    return response.json();
  }

  // Rechercher des prestations
  async searchPrestations(query) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}?search=${encodeURIComponent(query)}`);
    await ensureOk(response, 'La recherche a échoué. Réessayez.');
    return response.json();
  }
}

const prestationsService = new PrestationsService();
export default prestationsService;
