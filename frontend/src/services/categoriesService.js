import { API_ENDPOINTS } from '../config/api';
import { apiErrorFromResponse, apiFetch } from '../utils/apiErrors';

const LOAD_FALLBACK = 'Impossible de charger les catégories. Actualisez la page.';

const ensureOk = async (response, fallback) => {
  if (!response.ok) throw await apiErrorFromResponse(response, fallback);
  return response;
};

const adminHeaders = (json = true) => {
  const token = localStorage.getItem('access_token');
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
};

class CategoriesService {
  // Récupérer toutes les catégories (publiques)
  async getAllCategories() {
    const response = await apiFetch(API_ENDPOINTS.SERVICES.CATEGORIES);
    await ensureOk(response, LOAD_FALLBACK);
    const data = await response.json();
    return data.results || data;
  }

  // Récupérer une catégorie par ID
  async getCategorieById(id) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}${id}/`);
    await ensureOk(response, LOAD_FALLBACK);
    return response.json();
  }

  // Récupérer les catégories actives
  async getCategoriesActives() {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}?est_active=true`);
    await ensureOk(response, LOAD_FALLBACK);
    const data = await response.json();
    return data.results || data;
  }

  // Récupérer les sous-catégories
  async getSousCategories(parentId) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}?parent=${parentId}`);
    await ensureOk(response, LOAD_FALLBACK);
    const data = await response.json();
    return data.results || data;
  }

  // Créer une nouvelle catégorie (admin)
  async createCategorie(categorieData) {
    const response = await apiFetch(API_ENDPOINTS.SERVICES.CATEGORIES, {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(categorieData),
    });
    await ensureOk(response, "La catégorie n'a pas pu être créée. Vérifiez le formulaire puis réessayez.");
    return response.json();
  }

  // Mettre à jour une catégorie (admin)
  async updateCategorie(id, categorieData) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}${id}/`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify(categorieData),
    });
    await ensureOk(response, "La catégorie n'a pas pu être modifiée. Vérifiez le formulaire puis réessayez.");
    return response.json();
  }

  // Supprimer une catégorie (admin)
  async deleteCategorie(id) {
    const response = await apiFetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}${id}/`, {
      method: 'DELETE',
      headers: adminHeaders(false),
    });
    await ensureOk(response, "La catégorie n'a pas pu être supprimée. Réessayez dans un instant.");
    return true;
  }
}

const categoriesService = new CategoriesService();
export default categoriesService;
