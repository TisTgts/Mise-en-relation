import { API_ENDPOINTS } from '../config/api';

class DemandesService {
  // Récupérer toutes les demandes
  async getAllDemandes() {
    const token = localStorage.getItem('access_token');
    console.log('demandesService.getAllDemandes - token:', token ? 'exists' : 'none');
    
    // Essayer différents endpoints selon le rôle
    let url = API_ENDPOINTS.SERVICES.DEMANDES;
    
    // Pour les fournisseurs, essayer l'endpoint disponible
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.type_utilisateur === 'fournisseur') {
      url = `${API_ENDPOINTS.SERVICES.DEMANDES}?available=true`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('demandesService.getAllDemandes - response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('demandesService.getAllDemandes - error:', errorText);
      throw new Error(`Failed to fetch demandes: ${response.status} ${errorText}`);
    }
    return await response.json();
  }

  // Récupérer toutes les demandes publiques (pour les fournisseurs)
  async getAllPublicDemandes() {
    try {
      console.log('demandesService.getAllPublicDemandes - Début du chargement');
      
      // Utiliser l'endpoint public pour voir toutes les demandes ouvertes
      const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}public/`);
      console.log('demandesService.getAllPublicDemandes - response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('demandesService.getAllPublicDemandes - error:', errorText);
        throw new Error(`Failed to fetch public demandes: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('demandesService.getAllPublicDemandes - data received:', data);
      
      return data.results || data;
    } catch (error) {
      console.error('demandesService.getAllPublicDemandes - error:', error);
      throw error;
    }
  }

  // Récupérer une demande par ID
  async getDemandeById(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch demande');
    }
    return await response.json();
  }

  // Créer une nouvelle demande
  async createDemande(demandeData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.DEMANDES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(demandeData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create demande');
    }
    
    return await response.json();
  }

  // Mettre à jour une demande
  async updateDemande(id, demandeData) {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('demandesService.updateDemande - token:', token ? 'exists' : 'none');
    console.log('demandesService.updateDemande - user:', user);
    console.log('demandesService.updateDemande - user type:', user.type_utilisateur);
    console.log('demandesService.updateDemande - demande id:', id);
    console.log('demandesService.updateDemande - demande data:', demandeData);
    console.log('demandesService.updateDemande - endpoint:', `${API_ENDPOINTS.SERVICES.DEMANDES}${id}/`);
    
    const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(demandeData),
    });
    
    console.log('demandesService.updateDemande - response status:', response.status);
    console.log('demandesService.updateDemande - response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('demandesService.updateDemande - error response:', response);
      console.error('demandesService.updateDemande - error text:', errorText);
      throw new Error(`Failed to update demande: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('demandesService.updateDemande - response data:', data);
    return data;
  }

  // Supprimer une demande
  async deleteDemande(id) {
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('demandesService.deleteDemande - token:', token ? 'exists' : 'none');
    console.log('demandesService.deleteDemande - user:', user);
    console.log('demandesService.deleteDemande - user type:', user.type_utilisateur);
    console.log('demandesService.deleteDemande - demande id:', id);
    console.log('demandesService.deleteDemande - endpoint:', `${API_ENDPOINTS.SERVICES.DEMANDES}${id}/`);
    
    const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('demandesService.deleteDemande - response status:', response.status);
    console.log('demandesService.deleteDemande - response headers:', response.headers);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('demandesService.deleteDemande - error response:', response);
      console.error('demandesService.deleteDemande - error text:', errorText);
      throw new Error(`Failed to delete demande: ${response.status} ${errorText}`);
    }
    
    console.log('demandesService.deleteDemande - demande ${id} supprimée avec succès');
    return true;
  }

  // Récupérer les demandes du client connecté
  async getMyDemandes() {
    const token = localStorage.getItem('access_token');
    console.log('demandesService.getMyDemandes - token:', token ? 'exists' : 'none');
    
    const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}?my=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('demandesService.getMyDemandes - response status:', response.status);
    
    if (!response.ok) {
      console.error('demandesService.getMyDemandes - error response:', response);
      throw new Error('Failed to fetch my demandes');
    }
    
    const data = await response.json();
    console.log('demandesService.getMyDemandes - response data:', data);
    return data;
  }

  // Récupérer les demandes par catégorie
  async getDemandesByCategory(categorieId) {
    const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}?categorie=${categorieId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch demandes by category');
    }
    return await response.json();
  }

  // Rechercher des demandes
  async searchDemandes(query) {
    const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}?search=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search demandes');
    }
    return await response.json();
  }

  // Récupérer les demandes urgentes
  async getDemandesUrgentes() {
    const response = await fetch(`${API_ENDPOINTS.SERVICES.DEMANDES}?urgence=haute`);
    if (!response.ok) {
      throw new Error('Failed to fetch demandes urgentes');
    }
    return await response.json();
  }
}

const demandesService = new DemandesService();
export default demandesService;
