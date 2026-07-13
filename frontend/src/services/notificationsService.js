import { API_ENDPOINTS } from '../config/api';
import adminService from './adminService';
import { fetchAllPaginated as apiFetchAllPaginated } from './apiClient';

function authHeaders() {
  const token = localStorage.getItem('access_token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchAllPaginated(url, headers) {
  // Délégation vers l'implémentation unifiée.
  return apiFetchAllPaginated(url, { headers });
}

const getUserId = (u) => u?.id ?? u;

function clientTxNotification(tx) {
  if (tx.statut === 'terminee' || tx.statut === 'annulee') return null;
  const base = {
    id: `tx-client-${tx.id}`,
    kind: 'transaction',
    href: `/client/transactions/${tx.id}`,
    sortAt: new Date(tx.updated_at || tx.created_at || 0).getTime(),
  };
  const quoteNeeded =
    tx.besoin_mode_budget === 'sur_devis' || tx.prestation_mode_tarification === 'devis';
  if (quoteNeeded && tx.devis_statut === 'en_attente_client') {
    return {
      ...base,
      title: 'Devis à valider',
      subtitle: tx.besoin_intitule || `Transaction #${tx.id}`,
      dotClass: 'bg-violet-500',
    };
  }
  if (quoteNeeded && tx.statut === 'en_attente' && tx.devis_statut === 'a_proposer') {
    return {
      ...base,
      title: 'Devis en attente fournisseur',
      subtitle: tx.prestation_intitule || `Transaction #${tx.id}`,
      dotClass: 'bg-slate-400',
    };
  }
  if (tx.validation_admin_statut === 'en_attente') {
    return {
      ...base,
      title: 'Validation administrateur',
      subtitle: `Transaction #${tx.id} — décision en attente`,
      dotClass: 'bg-amber-500',
    };
  }
  if (tx.travail_fournisseur_termine && !tx.verification_client_validee) {
    return {
      ...base,
      title: 'Vérifier le travail',
      subtitle: tx.prestation_intitule || tx.besoin_intitule || `Transaction #${tx.id}`,
      dotClass: 'bg-blue-500',
    };
  }
  if (
    tx.verification_client_validee &&
    tx.statut !== 'terminee' &&
    tx.validation_admin_statut !== 'en_attente'
  ) {
    return {
      ...base,
      title: 'Confirmer la transaction',
      subtitle: tx.besoin_intitule || `Transaction #${tx.id}`,
      dotClass: 'bg-emerald-500',
    };
  }
  return null;
}

function fournisseurTxNotification(tx) {
  if (tx.statut === 'terminee' || tx.statut === 'annulee') return null;
  const baseTime = new Date(tx.updated_at || tx.created_at || 0).getTime();
  const quoteNeeded =
    tx.besoin_mode_budget === 'sur_devis' || tx.prestation_mode_tarification === 'devis';
  if (
    quoteNeeded &&
    tx.statut === 'en_attente' &&
    ['a_proposer', 'rejete_client'].includes(tx.devis_statut)
  ) {
    return {
      id: `tx-four-devis-${tx.id}`,
      kind: 'transaction',
      title: 'Proposer un devis',
      subtitle: tx.besoin_intitule || `Transaction #${tx.id}`,
      href: `/fournisseur/transactions/${tx.id}`,
      dotClass: 'bg-violet-500',
      sortAt: baseTime,
    };
  }
  const livraisonPossible = ['acceptee', 'en_cours'].includes(tx.statut);
  if (!livraisonPossible) return null;
  if (!tx.travail_fournisseur_termine) {
    return {
      id: `tx-four-${tx.id}`,
      kind: 'transaction',
      title: 'Travail à déclarer',
      subtitle: tx.besoin_intitule || `Transaction #${tx.id}`,
      href: `/fournisseur/transactions/${tx.id}`,
      dotClass: 'bg-violet-500',
      sortAt: baseTime,
    };
  }
  if (tx.validation_admin_statut === 'en_attente') {
    return {
      id: `tx-four-admin-${tx.id}`,
      kind: 'transaction',
      title: 'Validation administrateur',
      subtitle: `Transaction #${tx.id}`,
      href: `/fournisseur/transactions/${tx.id}`,
      dotClass: 'bg-amber-500',
      sortAt: baseTime,
    };
  }
  return null;
}

export function buildNotificationItems(user, messages, transactions) {
  const items = [];
  const type = user?.type_utilisateur;
  const uid = user?.id;
  if (!type || uid == null) return items;

  const isAdmin = type === 'administrateur' || type === 'super_admin';

  const messagesLink =
    type === 'client'
      ? '/client/messages'
      : type === 'fournisseur'
        ? '/fournisseur/messages'
        : '/admin/messages';

  if (!isAdmin && Array.isArray(messages)) {
    const unread = messages.filter((m) => getUserId(m.destinataire) === uid && !m.lu);
    if (unread.length > 0) {
      const latest = unread.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
      );
      items.push({
        id: 'messages-unread',
        kind: 'messages',
        title: 'Messages non lus',
        subtitle: `${unread.length} message(s) — ${latest.expediteur_nom || 'Contact'}`,
        href: latest.transaction != null ? `${messagesLink}?transaction=${latest.transaction}` : messagesLink,
        dotClass: 'bg-indigo-500',
        sortAt: new Date(latest.created_at).getTime(),
      });
    }
  }

  const txs = Array.isArray(transactions) ? transactions : [];

  if (type === 'client') {
    for (const tx of txs) {
      if (getUserId(tx.client) !== uid) continue;
      const n = clientTxNotification(tx);
      if (n) items.push(n);
    }
  } else if (type === 'fournisseur') {
    for (const tx of txs) {
      if (getUserId(tx.fournisseur) !== uid) continue;
      const n = fournisseurTxNotification(tx);
      if (n) items.push(n);
    }
  } else if (isAdmin) {
    for (const tx of txs) {
      if (tx.validation_admin_statut === 'en_attente') {
        items.push({
          id: `admin-tx-${tx.id}`,
          kind: 'admin_validation',
          title: 'Validation transaction',
          subtitle: `#${tx.id} — ${tx.besoin_intitule || 'Besoin'}`,
          href: '/admin/transactions',
          dotClass: 'bg-rose-500',
          sortAt: new Date(
            tx.demande_validation_admin_date || tx.updated_at || tx.created_at || 0
          ).getTime(),
        });
      }
    }
  }

  items.sort((a, b) => b.sortAt - a.sortAt);
  return items;
}

export async function loadNotificationsData(user) {
  const headers = authHeaders();
  if (!headers.Authorization || !user?.type_utilisateur) {
    return { messages: [], transactions: [] };
  }
  const type = user.type_utilisateur;
  try {
    if (type === 'administrateur' || type === 'super_admin') {
      const transactions = await adminService.getAllTransactions();
      return { messages: [], transactions };
    }
    const [messages, transactions] = await Promise.all([
      fetchAllPaginated(API_ENDPOINTS.SERVICES.MESSAGES, headers),
      fetchAllPaginated(API_ENDPOINTS.SERVICES.TRANSACTIONS, headers),
    ]);
    return { messages, transactions };
  } catch (e) {
    console.warn('[notifications]', e);
    return { messages: [], transactions: [] };
  }
}
