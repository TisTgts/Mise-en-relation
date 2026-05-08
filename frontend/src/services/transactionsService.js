import { API_ENDPOINTS } from '../config/api';

class TransactionsService {
  // Récupérer toutes les transactions de l'utilisateur
  async getMyTransactions() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTIONS, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    const data = await response.json();
    const transactionsList = data.results || data;
    // Le backend renvoie déjà uniquement les transactions de l'utilisateur connecté.
    return Array.isArray(transactionsList) ? transactionsList : [];
  }

  // Récupérer une transaction par ID
  async getTransactionById(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transaction');
    }
    
    return await response.json();
  }

  // Mettre à jour le statut d'une transaction
  async updateTransactionStatus(id, status) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ statut: status })
    });
    
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || payload.detail || 'Failed to update transaction status');
    }
    
    return await response.json();
  }

  // Confirmer le début d'une transaction
  async confirmStart(id, startTime) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        debut_confirme: true,
        heure_debut: startTime 
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to confirm start');
    }
    
    return await response.json();
  }

  // Confirmer la fin d'une transaction
  async confirmEnd(id, endTime) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        fin_confirmee: true,
        heure_fin: endTime,
        statut: 'terminee'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to confirm end');
    }
    
    return await response.json();
  }

  // Ajouter des notes à une transaction
  async addNotes(id, notes) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add notes');
    }
    
    return await response.json();
  }

  // Le fournisseur déclare le travail effectué
  async fournisseurWorkDone(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_FOURNISSEUR_WORK_DONE(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Failed to mark provider work done');
    }
    return await response.json();
  }

  // Le client vérifie le travail effectué
  async clientVerifyWork(id, approved = true) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_VERIFY(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ approved })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Failed to verify work');
    }
    return await response.json();
  }

  // Le client confirme la transaction
  async clientConfirmTransaction(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_CONFIRM(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Failed to confirm transaction');
    }
    return await response.json();
  }

  // Client/Fournisseur demande validation admin
  async requestAdminApproval(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_REQUEST_ADMIN_APPROVAL(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Failed to request admin approval');
    }
    return await response.json();
  }

  // Le fournisseur propose un devis (montant + description)
  async fournisseurProposeDevis(id, montant, description = '') {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_FOURNISSEUR_PROPOSE_DEVIS(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ montant, description })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Impossible de proposer le devis');
    }
    return await response.json();
  }

  // Le client accepte ou rejette un devis fournisseur
  async clientRespondDevis(id, decision) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_RESPOND_DEVIS(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ decision })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Impossible de répondre au devis');
    }
    return await response.json();
  }

  // L'admin accepte/rejette une demande de validation
  async adminDecideTransaction(id, decision) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_ADMIN_DECISION(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ decision })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Impossible de traiter la décision admin');
    }
    return await response.json();
  }

  // L'admin clôture la transaction quand les conditions sont remplies
  async adminFinalizeTransaction(id) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(API_ENDPOINTS.SERVICES.TRANSACTION_ADMIN_FINALIZE(id), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Impossible de clôturer la transaction');
    }
    return await response.json();
  }
}

const transactionsService = new TransactionsService();
export default transactionsService;
