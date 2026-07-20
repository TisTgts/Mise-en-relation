import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { validateAttachment } from '../utils/attachments';
import { unwrapList } from '../utils/format';

export async function fetchCategories() {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.CATEGORIES_ALL);
  return unwrapList(data);
}

export async function fetchMyBesoins() {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.BESOINS_MY);
  return unwrapList(data);
}

export async function fetchBesoin(id) {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.BESOIN_DETAIL(id));
  return data;
}

export async function createBesoin(payload) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.BESOINS, payload);
  return data;
}

export async function updateBesoin(id, payload) {
  const { data } = await apiClient.patch(API_ENDPOINTS.SERVICES.BESOIN_DETAIL(id), payload);
  return data;
}

export async function deleteBesoin(id) {
  await apiClient.delete(API_ENDPOINTS.SERVICES.BESOIN_DETAIL(id));
}

export async function fetchMyPrestations() {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.PRESTATIONS_MY);
  return unwrapList(data);
}

export async function fetchPrestation(id) {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.PRESTATION_DETAIL(id));
  return data;
}

export async function createPrestation(payload) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.PRESTATIONS, payload);
  return data;
}

export async function updatePrestation(id, payload) {
  const { data } = await apiClient.patch(API_ENDPOINTS.SERVICES.PRESTATION_DETAIL(id), payload);
  return data;
}

export async function deletePrestation(id) {
  await apiClient.delete(API_ENDPOINTS.SERVICES.PRESTATION_DETAIL(id));
}

export async function fetchTransactions() {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.TRANSACTIONS);
  return unwrapList(data);
}

export async function fetchTransaction(id) {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.TRANSACTION_DETAIL(id));
  return data;
}

export async function fetchCountryConfig() {
  const { data } = await apiClient.get(API_ENDPOINTS.CONFIG.COUNTRY);
  return data;
}

export async function submitTransactionReview(transactionId, { rating, comment }) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.TRANSACTION_AVIS(transactionId), {
    note: rating,
    commentaire: comment || '',
  });
  return data;
}

export async function proposeDevis(id, { montant, description }) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.TRANSACTION_PROPOSE_DEVIS(id), {
    montant: Number(montant),
    description,
  });
  return data;
}

export async function respondDevis(id, decision) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.TRANSACTION_RESPOND_DEVIS(id), {
    decision,
  });
  return data;
}

export async function markWorkDone(id) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.TRANSACTION_WORK_DONE(id), {});
  return data;
}

export async function clientVerify(id, approved) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_VERIFY(id), {
    approved: !!approved,
  });
  return data;
}

export async function clientConfirm(id) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.TRANSACTION_CLIENT_CONFIRM(id), {});
  return data;
}

export async function findMatchesForBesoin(id) {
  const { data } = await apiClient.post(API_ENDPOINTS.MATCHING.FIND_FOR_BESOIN(id), {});
  return data;
}

export async function findMatchesForPrestation(id) {
  const { data } = await apiClient.post(API_ENDPOINTS.MATCHING.FIND_FOR_PRESTATION(id), {});
  return data;
}

export async function confirmerMatch({ besoin_id, prestation_id, sujet, contenu }) {
  const { data } = await apiClient.post(API_ENDPOINTS.MATCHING.CLIENT_CONFIRMER, {
    besoin_id,
    prestation_id,
    sujet: sujet || 'Collaboration',
    contenu: contenu || 'Bonjour, je souhaite collaborer suite au matching.',
  });
  return data;
}

export async function fetchMessages(params = {}) {
  const { data } = await apiClient.get(API_ENDPOINTS.SERVICES.MESSAGES, { params });
  return unwrapList(data);
}

export async function sendMessage({
  destinataire,
  transaction,
  sujet,
  contenu,
  attachment,
}) {
  if (attachment?.uri) {
    const check = validateAttachment(attachment);
    if (!check.ok) {
      throw new Error(check.error);
    }

    const form = new FormData();
    form.append('destinataire', String(destinataire));
    if (transaction != null) {
      form.append('transaction', String(transaction));
    }
    form.append('sujet', sujet || 'Message');
    form.append('contenu', contenu?.trim() || 'Pièce jointe');
    form.append('piece_jointe', {
      uri: attachment.uri,
      name: attachment.name || 'piece_jointe',
      type: attachment.mimeType || 'application/octet-stream',
    });
    const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.MESSAGES, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.MESSAGES, {
    destinataire,
    transaction,
    sujet: sujet || 'Message',
    contenu,
  });
  return data;
}

export async function markMessagesRead(messageIds) {
  const { data } = await apiClient.post(API_ENDPOINTS.SERVICES.MESSAGES_MARK_READ, {
    message_ids: messageIds,
  });
  return data;
}

export async function fetchMyProfile() {
  const { data } = await apiClient.get(API_ENDPOINTS.USER.PROFILE);
  return data;
}

export async function updateMe(payload) {
  const { data } = await apiClient.patch(API_ENDPOINTS.USER.ME, payload);
  return data;
}

export async function updateProfile(payload) {
  const { data } = await apiClient.patch(API_ENDPOINTS.USER.PROFILE, payload);
  return data;
}
