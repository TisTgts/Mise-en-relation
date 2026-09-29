import { API_ENDPOINTS } from '../config/api';
import { apiErrorFromResponse, apiFetch } from '../utils/apiErrors';

const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json', 'X-Client-App': 'toghinis-web' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const send = async (url, { method = 'GET', body, fallback } = {}) => {
  const response = await apiFetch(url, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw await apiErrorFromResponse(response, fallback);
  return response.json();
};

const RETRY_HINT = 'Actualisez la page puis réessayez.';

class TransactionsService {
  // Récupérer toutes les transactions de l'utilisateur
  async getMyTransactions() {
    const data = await send(API_ENDPOINTS.SERVICES.TRANSACTIONS, {
      fallback: `Impossible de charger vos collaborations. ${RETRY_HINT}`,
    });
    const transactionsList = data.results || data;
    // Le backend renvoie déjà uniquement les transactions de l'utilisateur connecté.
    return Array.isArray(transactionsList) ? transactionsList : [];
  }

  // Récupérer une transaction par ID
  async getTransactionById(id) {
    return send(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      fallback: 'Impossible de charger cette collaboration. Revenez à la liste et réessayez.',
    });
  }

  // Mettre à jour le statut d'une transaction
  async updateTransactionStatus(id, status) {
    return send(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      body: { statut: status },
      fallback: `Le statut n'a pas pu être mis à jour. ${RETRY_HINT}`,
    });
  }

  // Confirmer le début d'une transaction
  async confirmStart(id, startTime) {
    return send(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      body: { debut_confirme: true, heure_debut: startTime },
      fallback: `Le démarrage n'a pas pu être confirmé. ${RETRY_HINT}`,
    });
  }

  // Confirmer la fin d'une transaction
  async confirmEnd(id, endTime) {
    return send(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      body: { fin_confirmee: true, heure_fin: endTime, statut: 'terminee' },
      fallback: `La fin n'a pas pu être confirmée. ${RETRY_HINT}`,
    });
  }

  // Ajouter des notes à une transaction
  async addNotes(id, notes) {
    return send(`${API_ENDPOINTS.SERVICES.TRANSACTIONS}${id}/`, {
      method: 'PATCH',
      body: { notes },
      fallback: `La note n'a pas pu être enregistrée. ${RETRY_HINT}`,
    });
  }

  // Le fournisseur déclare le travail effectué
  async fournisseurWorkDone(id) {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_FOURNISSEUR_WORK_DONE(id), {
      method: 'POST',
      fallback: `Le travail n'a pas pu être déclaré terminé. ${RETRY_HINT}`,
    });
  }

  // Le client vérifie le travail effectué
  async clientVerifyWork(id, approved = true) {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_VERIFY(id), {
      method: 'POST',
      body: { approved },
      fallback: `Votre vérification n'a pas pu être enregistrée. ${RETRY_HINT}`,
    });
  }

  // Le client confirme la transaction
  async clientConfirmTransaction(id) {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_CONFIRM(id), {
      method: 'POST',
      fallback: `La collaboration n'a pas pu être confirmée. ${RETRY_HINT}`,
    });
  }

  // Client/Fournisseur demande validation admin
  async requestAdminApproval(id) {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_REQUEST_ADMIN_APPROVAL(id), {
      method: 'POST',
      fallback: `La demande de validation n'a pas pu être envoyée. ${RETRY_HINT}`,
    });
  }

  // Le fournisseur propose un devis (montant + description)
  async fournisseurProposeDevis(id, montant, description = '') {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_FOURNISSEUR_PROPOSE_DEVIS(id), {
      method: 'POST',
      body: { montant, description },
      fallback: "Le devis n'a pas pu être envoyé. Vérifiez le montant puis réessayez.",
    });
  }

  // Le client accepte ou rejette un devis fournisseur
  async clientRespondDevis(id, decision) {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_RESPOND_DEVIS(id), {
      method: 'POST',
      body: { decision },
      fallback: `Votre réponse au devis n'a pas pu être enregistrée. ${RETRY_HINT}`,
    });
  }

  // L'admin accepte/rejette une demande de validation
  async adminDecideTransaction(id, decision) {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_ADMIN_DECISION(id), {
      method: 'POST',
      body: { decision },
      fallback: `La décision n'a pas pu être enregistrée. ${RETRY_HINT}`,
    });
  }

  // L'admin clôture la transaction quand les conditions sont remplies
  async adminFinalizeTransaction(id) {
    return send(API_ENDPOINTS.SERVICES.TRANSACTION_ADMIN_FINALIZE(id), {
      method: 'POST',
      fallback: `La collaboration n'a pas pu être clôturée. ${RETRY_HINT}`,
    });
  }
}

const transactionsService = new TransactionsService();
export default transactionsService;
