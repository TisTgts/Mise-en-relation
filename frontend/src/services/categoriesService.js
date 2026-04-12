import { API_ENDPOINTS } from '../config/api';

class CategoriesService {
  // Récupérer toutes les catégories
  async getAllCategories() {
    try {
      console.log('Fetching categories from:', API_ENDPOINTS.SERVICES.CATEGORIES);
      
      // Utiliser fetch simple car les catégories sont publiques
      const response = await fetch(API_ENDPOINTS.SERVICES.CATEGORIES);
      console.log('Categories response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Categories error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Categories data received:', data);
      
      // Gérer la pagination - retourner results si disponible, sinon data
      return data.results || data;
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      throw error;
    }
  }

  // Récupérer une catégorie par ID
  async getCategorieById(id) {
    try {
      const response = await fetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}${id}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in getCategorieById:', error);
      throw error;
    }
  }

  // Récupérer les catégories actives
  async getCategoriesActives() {
    try {
      console.log('Fetching active categories from:', `${API_ENDPOINTS.SERVICES.CATEGORIES}?est_active=true`);
      
      const response = await fetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}?est_active=true`);
      console.log('Active categories response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Active categories data received:', data);
      
      // Gérer la pagination - retourner results si disponible, sinon data
      return data.results || data;
    } catch (error) {
      console.error('Error in getCategoriesActives:', error);
      throw error;
    }
  }

  // Récupérer les sous-catégories
  async getSousCategories(parentId) {
    try {
      const response = await fetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}?parent=${parentId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Gérer la pagination - retourner results si disponible, sinon data
      return data.results || data;
    } catch (error) {
      console.error('Error in getSousCategories:', error);
      throw error;
    }
  }

  // Créer une nouvelle catégorie (admin)
  async createCategorie(categorieData) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_ENDPOINTS.SERVICES.CATEGORIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categorieData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in createCategorie:', error);
      throw error;
    }
  }

  // Mettre à jour une catégorie (admin)
  async updateCategorie(id, categorieData) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categorieData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in updateCategorie:', error);
      throw error;
    }
  }

  // Supprimer une catégorie (admin)
  async deleteCategorie(id) {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_ENDPOINTS.SERVICES.CATEGORIES}${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteCategorie:', error);
      throw error;
    }
  }
}

const categoriesService = new CategoriesService();
export default categoriesService;
