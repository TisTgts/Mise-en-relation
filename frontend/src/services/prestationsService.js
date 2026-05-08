import { API_ENDPOINTS } from '../config/api';

class PrestationsService {
  // Récupérer toutes les prestations
  async getAllPrestations() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.PRESTATIONS, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch prestations');
    }
    return await response.json();
  }

  // Récupérer toutes les prestations publiques (pour les clients)
  async getAllPublicPrestations() {
    try {
      console.log('prestationsService.getAllPublicPrestations - Début du chargement');
      
      // Utiliser l'endpoint public pour voir toutes les prestations actives
      const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}public/`);
      console.log('prestationsService.getAllPublicPrestations - response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('prestationsService.getAllPublicPrestations - error:', errorText);
        throw new Error(`Failed to fetch public prestations: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('prestationsService.getAllPublicPrestations - data received:', data);
      
      return data.results || data;
    } catch (error) {
      console.error('prestationsService.getAllPublicPrestations - error:', error);
      throw error;
    }
  }

  // Récupérer une prestation par ID
  async getPrestationById(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch prestation');
    }
    return await response.json();
  }

  // Créer une nouvelle prestation
  async createPrestation(prestationData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.PRESTATIONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(prestationData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create prestation');
    }
    
    return await response.json();
  }

  // Mettre à jour une prestation
  async updatePrestation(id, prestationData) {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('prestationsService.updatePrestation - token:', token ? 'exists' : 'none');
    console.log('prestationsService.updatePrestation - user:', user);
    console.log('prestationsService.updatePrestation - user type:', user.type_utilisateur);
    console.log('prestationsService.updatePrestation - prestation id:', id);
    console.log('prestationsService.updatePrestation - prestation data:', prestationData);
    console.log('prestationsService.updatePrestation - endpoint:', `${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/`);
    
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(prestationData),
    });
    
    console.log('prestationsService.updatePrestation - response status:', response.status);
    console.log('prestationsService.updatePrestation - response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const payload = JSON.parse(errorText);
        parsedError =
          payload?.error ||
          payload?.detail ||
          (typeof payload === 'object' ? JSON.stringify(payload) : errorText);
      } catch (_) {
        // Garder le texte brut si ce n'est pas du JSON
      }
      console.error('prestationsService.updatePrestation - error response:', response);
      console.error('prestationsService.updatePrestation - error text:', errorText);
      throw new Error(`Failed to update prestation: ${response.status} ${parsedError}`);
    }
    
    const data = await response.json();
    console.log('prestationsService.updatePrestation - response data:', data);
    return data;
  }

  // Supprimer une prestation
  async deletePrestation(id) {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('prestationsService.deletePrestation - token:', token ? 'exists' : 'none');
    console.log('prestationsService.deletePrestation - user:', user);
    console.log('prestationsService.deletePrestation - user type:', user.type_utilisateur);
    console.log('prestationsService.deletePrestation - prestation id:', id);
    console.log('prestationsService.deletePrestation - endpoint:', `${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/delete/`);
    
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}${id}/delete/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('prestationsService.deletePrestation - response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('prestationsService.deletePrestation - error response:', response);
      console.error('prestationsService.deletePrestation - error text:', errorText);
      throw new Error(`Failed to delete prestation: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('prestationsService.deletePrestation - response data:', data);
    console.log('prestationsService.deletePrestation - deletion successful');
    return true;
  }

  // Récupérer les prestations du fournisseur connecté
  async getMyPrestations() {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('prestationsService.getMyPrestations - token:', token ? 'exists' : 'none');
    console.log('prestationsService.getMyPrestations - user:', user);
    console.log('prestationsService.getMyPrestations - user type:', user.type_utilisateur);
    console.log('prestationsService.getMyPrestations - endpoint:', `${API_ENDPOINTS.SERVICES.PRESTATIONS}my/`);
    
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}my/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('prestationsService.getMyPrestations - response status:', response.status);
    console.log('prestationsService.getMyPrestations - response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('prestationsService.getMyPrestations - error response:', response);
      console.error('prestationsService.getMyPrestations - error text:', errorText);
      throw new Error(`Failed to fetch my prestations: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('prestationsService.getMyPrestations - response data:', data);
    return data;
  }

  // Récupérer les prestations par catégorie
  async getPrestationsByCategory(categorieId) {
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}?categorie=${categorieId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch prestations by category');
    }
    return await response.json();
  }

  // Rechercher des prestations
  async searchPrestations(query) {
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}?search=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search prestations');
    }
    return await response.json();
  }
}

const prestationsService = new PrestationsService();
export default prestationsService;
