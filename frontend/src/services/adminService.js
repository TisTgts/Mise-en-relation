import { API_ENDPOINTS } from '../config/api';

class AdminService {
  // Gestion des utilisateurs
  async getAllUsers() {
    const token = localStorage.getItem('access_token');
    console.log('adminService.getAllUsers - token:', token ? 'exists' : 'missing');
    
    // URL correcte pour les utilisateurs
    const url = '/api/accounts/users/';
    console.log('adminService.getAllUsers - URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('adminService.getAllUsers - response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('adminService.getAllUsers - error response:', errorText);
      throw new Error('Failed to fetch users');
    }
    
    const data = await response.json();
    console.log('adminService.getAllUsers - success data:', data);
    return data;
  }

  async getUser(userId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/users/${userId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    
    return response.json();
  }

  async updateUser(userId, userData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/users/${userId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    
    return response.json();
  }

  async deleteUser(userId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/users/${userId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    return true;
  }

  async toggleUserStatus(userId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/users/${userId}/toggle-status/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle user status');
    }
    
    return response.json();
  }

  // Gestion des prestations
  async getAllPrestations() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/prestations/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch prestations');
    }
    
    return response.json();
  }

  async deletePrestation(prestationId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS}${prestationId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete prestation');
    }
    
    return true;
  }

  // Gestion des besoins
  async getAllDemandes() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.BESOINS.replace('besoins/', '')}admin/besoins/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch besoins');
    }
    
    return response.json();
  }

  async deleteDemande(demandeId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.BESOINS}${demandeId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete demande');
    }
    
    return true;
  }

  // Gestion des transactions
  async getAllTransactions() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.TRANSACTIONS.replace('transactions/', '')}admin/transactions/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    return response.json();
  }

  // Statistiques détaillées
  async getDetailedStatistics() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.STATISTICS_ADMIN}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }
    
    return response.json();
  }

  // Actions en masse
  async bulkDeleteServices(serviceType, serviceIds) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/bulk-delete/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: serviceType,
        ids: serviceIds
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to bulk delete services');
    }
    
    return response.json();
  }

  // Export de données
  async exportData(exportType, format = 'json') {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/export/?type=${exportType}&format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export data');
    }
    
    return response.json();
  }

  // Validation des données
  async validateUser(userData) {
    const errors = [];
    
    if (!userData.first_name || userData.first_name.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    
    if (!userData.last_name || userData.last_name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('L\'email n\'est pas valide');
    }
    
    if (!userData.type_utilisateur || !['client', 'fournisseur', 'administrateur'].includes(userData.type_utilisateur)) {
      errors.push('Le type d\'utilisateur n\'est pas valide');
    }
    
    return errors;
  }

  async validatePrestation(prestationData) {
    const errors = [];
    
    if (!prestationData.intitule || prestationData.intitule.trim().length < 3) {
      errors.push('L\'intitulé doit contenir au moins 3 caractères');
    }
    
    if (!prestationData.description || prestationData.description.trim().length < 10) {
      errors.push('La description doit contenir au moins 10 caractères');
    }
    
    if (!prestationData.type_prestation) {
      errors.push('Le type de prestation est requis');
    }
    
    if (prestationData.tarif_min && prestationData.tarif_max && prestationData.tarif_min > prestationData.tarif_max) {
      errors.push('Le tarif minimum ne peut pas être supérieur au tarif maximum');
    }
    
    return errors;
  }

  async validateDemande(demandeData) {
    const errors = [];
    
    if (!demandeData.intitule || demandeData.intitule.trim().length < 3) {
      errors.push('L\'intitulé doit contenir au moins 3 caractères');
    }
    
    if (!demandeData.description || demandeData.description.trim().length < 10) {
      errors.push('La description doit contenir au moins 10 caractères');
    }
    
    if (!demandeData.lieu_intervention) {
      errors.push('Le lieu d\'intervention est requis');
    }
    
    if (!demandeData.date_limite) {
      errors.push('La date limite est requise');
    } else {
      const dateLimite = new Date(demandeData.date_limite);
      const aujourdHui = new Date();
      if (dateLimite <= aujourdHui) {
        errors.push('La date limite doit être dans le futur');
      }
    }
    
    return errors;
  }

  // Utilitaires
  formatUserType(type) {
    const types = {
      'fournisseur': 'Fournisseur',
      'client': 'Client',
      'administrateur': 'Administrateur'
    };
    return types[type] || type;
  }

  formatServiceStatus(status) {
    const statuses = {
      'active': 'Active',
      'inactive': 'Inactive',
      'pending': 'En attente',
      'ouverte': 'Ouverte',
      'fermee': 'Fermée',
      'en_cours': 'En cours',
      'terminee': 'Terminée',
      'annulee': 'Annulée'
    };
    return statuses[status] || status;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

const adminService = new AdminService();
export default adminService;
