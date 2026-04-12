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
    
    // Filtrer les transactions de l'utilisateur connecté
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return transactionsList.filter(transaction =>
      transaction.fournisseur === user.id ||
      transaction.client === user.id ||
      transaction.fournisseur?.id === user.id ||
      transaction.client?.id === user.id
    );
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
      throw new Error('Failed to update transaction status');
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
}

const transactionsService = new TransactionsService();
export default transactionsService;
