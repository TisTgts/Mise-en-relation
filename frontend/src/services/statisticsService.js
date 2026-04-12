import { API_ENDPOINTS } from '../config/api';

class StatisticsService {
  // Récupérer les statistiques administrateur
  async getAdminStatistics() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.STATISTICS_ADMIN, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin statistics');
    }
    
    return await response.json();
  }

  // Récupérer les statistiques pour un prestataire
  async getPrestataireStatistics() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.STATISTICS}provider/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch prestataire statistics');
    }
    
    return await response.json();
  }

  // Récupérer les statistiques pour un fournisseur
  async getFournisseurStatistics() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.STATISTICS}client/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch fournisseur statistics');
    }
    
    return await response.json();
  }
}

const statisticsService = new StatisticsService();
export default statisticsService;
