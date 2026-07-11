import { API_ENDPOINTS } from '../config/api';
import { fetchAllPaginated as apiFetchAllPaginated } from './apiClient';
import { CURRENCY } from '../pays';

class AdminService {
  async fetchAllPaginated(url, headers) {
    return apiFetchAllPaginated(url, { headers });
  }

  async _parseErrorResponse(response, fallback) {
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data.error || data.detail || data.message || fallback;
    } catch {
      return text || fallback;
    }
  }

  // Gestion des utilisateurs (API admin — inclut statut Premium client)
  async getAllUsers() {
    const token = localStorage.getItem('access_token');
    const base = API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '');
    const url = `${base}admin/users/`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    return this.fetchAllPaginated(url, headers);
  }

  async getAllMatchingScores() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.ADMIN_CORRESPONDANCES_PLATES, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch matching scores');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async getMatchingRuns() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.ADMIN_MATCHING_RUNS, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch matching runs');
    }
    const data = await response.json();
    return data.results || [];
  }

  async getMatchingByNeed() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.ADMIN_CORRESPONDANCES, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch grouped matching data');
    }
    const data = await response.json();
    return data.results || [];
  }

  async getMatchingScoreDetail(scoreId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.ADMIN_CORRESPONDANCE_DETAIL(scoreId), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch matching score detail');
    }
    return response.json();
  }

  async deleteMatchingScore(scoreId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.ADMIN_CORRESPONDANCE_DELETE(scoreId), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete matching score');
    }
    return response.json();
  }

  async getMatchingForNeed(besoinId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.ADMIN_CORRESPONDANCES_BESOIN(besoinId), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch matching list for need');
    }
    return response.json();
  }

  async getProviderProfileForAdmin(fournisseurId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.ADMIN_FOURNISSEUR_PROFIL(fournisseurId), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch provider profile');
    }
    return response.json();
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

  // Gestion des prestations (toutes les pages — PAGE_SIZE backend = 20)
  async getAllPrestations() {
    const token = localStorage.getItem('access_token');
    const url = `${API_ENDPOINTS.SERVICES.PRESTATIONS.replace('prestations/', '')}admin/prestations/`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    return this.fetchAllPaginated(url, headers);
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

  // Gestion des besoins (toutes les pages)
  async getAllDemandes() {
    const token = localStorage.getItem('access_token');
    const url = `${API_ENDPOINTS.SERVICES.BESOINS.replace('besoins/', '')}admin/besoins/`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    return this.fetchAllPaginated(url, headers);
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
  async getAdminMessages() {
    const token = localStorage.getItem('access_token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const data = await this.fetchAllPaginated(API_ENDPOINTS.SERVICES.ADMIN_MESSAGES, headers);
    return Array.isArray(data) ? data : [];
  }

  async getAllCategoriesAll() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.ADMIN_CATEGORIES || `${API_ENDPOINTS.SERVICES.BESOINS.replace('besoins/', '')}admin/categories/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  async createCategory(payload) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.ADMIN_CATEGORIES || `${API_ENDPOINTS.SERVICES.BESOINS.replace('besoins/', '')}admin/categories/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.nom?.[0] || 'Impossible de créer la catégorie');
    }
    return response.json();
  }

  async updateCategory(categoryId, payload) {
    const token = localStorage.getItem('access_token');
    const url = API_ENDPOINTS.SERVICES.ADMIN_CATEGORY_DETAIL
      ? API_ENDPOINTS.SERVICES.ADMIN_CATEGORY_DETAIL(categoryId)
      : `${API_ENDPOINTS.SERVICES.BESOINS.replace('besoins/', '')}admin/categories/${categoryId}/`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.nom?.[0] || 'Impossible de modifier la catégorie');
    }
    return response.json();
  }

  async deleteCategory(categoryId) {
    const token = localStorage.getItem('access_token');
    const url = API_ENDPOINTS.SERVICES.ADMIN_CATEGORY_DETAIL
      ? API_ENDPOINTS.SERVICES.ADMIN_CATEGORY_DETAIL(categoryId)
      : `${API_ENDPOINTS.SERVICES.BESOINS.replace('besoins/', '')}admin/categories/${categoryId}/`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Impossible de supprimer la catégorie');
    }
    return true;
  }

  async getAllSubCategories() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.ADMIN_SUBCATEGORIES, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Impossible de charger les sous-catégories');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  async createSubCategory(payload) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.ADMIN_SUBCATEGORIES, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.nom?.[0] || 'Impossible de créer la sous-catégorie');
    }
    return response.json();
  }

  async updateSubCategory(subCategoryId, payload) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.ADMIN_SUBCATEGORY_DETAIL(subCategoryId), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.nom?.[0] || 'Impossible de modifier la sous-catégorie');
    }
    return response.json();
  }

  async deleteSubCategory(subCategoryId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.ADMIN_SUBCATEGORY_DETAIL(subCategoryId), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Impossible de supprimer la sous-catégorie');
    }
    return true;
  }

  async getAllTransactions() {
    const token = localStorage.getItem('access_token');
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const data = await this.fetchAllPaginated(API_ENDPOINTS.SERVICES.ADMIN_TRANSACTIONS, headers);
    return Array.isArray(data) ? data : [];
  }

  async validateCollaborationFromMatching(besoinId, prestationId) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_CREATE, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offer_id: prestationId,
        need_id: besoinId,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || payload.detail || 'Impossible de valider cette collaboration');
    }
    return response.json();
  }

  // Statistiques détaillées
  async getDetailedStatistics() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.ADMIN_STATISTICS, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  }

  async runMatchingForUnmatchedNeeds(limit = 50) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.RUN_UNMATCHED_BESOINS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ limit })
    });

    if (!response.ok) {
      throw new Error(
        await this._parseErrorResponse(response, 'Échec du matching (besoins non matchés)')
      );
    }

    return response.json();
  }

  async runMatchingForSelectedNeeds(besoinIds = []) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.RUN_BESOINS_ADMIN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ all_open: false, besoin_ids: besoinIds })
    });

    if (!response.ok) {
      throw new Error(
        await this._parseErrorResponse(response, 'Échec du matching (sélection)')
      );
    }

    return response.json();
  }

  async runMatchingForAllOpenNeeds() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.MATCHING.RUN_BESOINS_ADMIN, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ all_open: true })
    });

    if (!response.ok) {
      throw new Error(
        await this._parseErrorResponse(response, 'Échec du matching (besoins ouverts)')
      );
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
      'pourvue': 'Pourvu',
      'en_cours': 'En cours',
      'terminee': 'Terminée',
      'annulee': 'Annulée'
    };
    return statuses[status] || status;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: CURRENCY,
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
