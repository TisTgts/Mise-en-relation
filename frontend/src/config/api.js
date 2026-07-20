const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: `${API_BASE_URL}/accounts/login/`,
    REGISTER: `${API_BASE_URL}/accounts/register/`,
    REFRESH: `${API_BASE_URL}/accounts/token/refresh/`,
    LOGOUT: `${API_BASE_URL}/accounts/logout/`,
    PASSWORD_RESET: `${API_BASE_URL}/accounts/password-reset/`,
    PASSWORD_RESET_CONFIRM: `${API_BASE_URL}/accounts/password-reset/confirm/`,
  },
  
  // Users et profils
  USER: {
    PROFILE: `${API_BASE_URL}/accounts/profile/`,
    ME: `${API_BASE_URL}/accounts/me/`,
  },

  // Super administrateur : gestion des comptes d'administration
  SUPERADMIN: {
    ADMINS: `${API_BASE_URL}/accounts/super-admin/admins/`,
    SET_ROLE: (userId) => `${API_BASE_URL}/accounts/super-admin/users/${userId}/set-role/`,
    TOGGLE_STATUS: (userId) => `${API_BASE_URL}/accounts/super-admin/users/${userId}/toggle-status/`,
    COUNTRY: `${API_BASE_URL}/accounts/super-admin/country/`,
    HEALTH: `${API_BASE_URL}/accounts/super-admin/health/`,
  },

  // Configuration publique (pays actif)
  CONFIG: {
    COUNTRY: `${API_BASE_URL}/config/country/`,
    COUNTRIES: `${API_BASE_URL}/config/countries/`,
  },
  
  // Services
  SERVICES: {
    CATEGORIES: `${API_BASE_URL}/services/categories/`,
    /** Liste complète authentifiée (voir backend specific_views.service_categories) */
    CATEGORIES_ALL: `${API_BASE_URL}/services/categories/all/`,
    PRESTATIONS: `${API_BASE_URL}/services/prestations/`,
    BESOINS: `${API_BASE_URL}/services/besoins/`,
    /** @deprecated utiliser BESOINS */
    DEMANDES: `${API_BASE_URL}/services/besoins/`,
    TRANSACTIONS: `${API_BASE_URL}/services/transactions/`,
    TRANSACTION_CREATE: `${API_BASE_URL}/services/transactions/create/`,
    TRANSACTION_FOURNISSEUR_WORK_DONE: (id) => `${API_BASE_URL}/services/transactions/${id}/fournisseur-work-done/`,
    TRANSACTION_CLIENT_VERIFY: (id) => `${API_BASE_URL}/services/transactions/${id}/client-verify/`,
    TRANSACTION_CLIENT_CONFIRM: (id) => `${API_BASE_URL}/services/transactions/${id}/client-confirm/`,
    TRANSACTION_REQUEST_ADMIN_APPROVAL: (id) => `${API_BASE_URL}/services/transactions/${id}/request-admin-approval/`,
    TRANSACTION_ADMIN_DECISION: (id) => `${API_BASE_URL}/services/transactions/${id}/admin-decision/`,
    TRANSACTION_ADMIN_FINALIZE: (id) => `${API_BASE_URL}/services/transactions/${id}/admin-finalize/`,
    TRANSACTION_BESOIN_DETAILS: (id) => `${API_BASE_URL}/services/transactions/${id}/besoin-details/`,
    TRANSACTION_FOURNISSEUR_PROPOSE_DEVIS: (id) => `${API_BASE_URL}/services/transactions/${id}/fournisseur-propose-devis/`,
    TRANSACTION_CLIENT_RESPOND_DEVIS: (id) => `${API_BASE_URL}/services/transactions/${id}/client-respond-devis/`,
    MESSAGES: `${API_BASE_URL}/services/messages/`,
    STATISTICS: `${API_BASE_URL}/services/statistics/`,
    /** Résumé simple (structure { success, data }) */
    STATISTICS_ADMIN: `${API_BASE_URL}/services/statistics/admin/`,
    /** Statistiques détaillées tableau de bord admin (KPI, graphiques, tops) */
    ADMIN_STATISTICS: `${API_BASE_URL}/services/admin/statistics/`,
    ADMIN_MESSAGES: `${API_BASE_URL}/services/admin/messages/`,
    ADMIN_TRANSACTIONS: `${API_BASE_URL}/services/admin/transactions/`,
    ADMIN_CATEGORIES: `${API_BASE_URL}/services/admin/categories/`,
    ADMIN_CATEGORY_DETAIL: (id) => `${API_BASE_URL}/services/admin/categories/${id}/`,
    ADMIN_SUBCATEGORIES: `${API_BASE_URL}/services/admin/sous-categories/`,
    ADMIN_SUBCATEGORY_DETAIL: (id) => `${API_BASE_URL}/services/admin/sous-categories/${id}/`,
  },
  
  // Matching
  MATCHING: {
    FIND_MATCHES_FOR_BESOIN: (besoinId) =>
      `${API_BASE_URL}/matching/trouver-correspondances/besoin/${besoinId}/`,
    FIND_MATCHES_FOR_PRESTATION: (prestationId) =>
      `${API_BASE_URL}/matching/trouver-correspondances/prestation/${prestationId}/`,
    SCORES: `${API_BASE_URL}/matching/scores/`,
    RUN_UNMATCHED_BESOINS: `${API_BASE_URL}/matching/admin/lancer-besoins-sans-matching/`,
    RUN_BESOINS_ADMIN: `${API_BASE_URL}/matching/admin/lancer-besoins/`,
    ADMIN_CORRESPONDANCES: `${API_BASE_URL}/matching/admin/correspondances/`,
    ADMIN_CORRESPONDANCES_PLATES: `${API_BASE_URL}/matching/admin/correspondances/plates/`,
    ADMIN_MATCHING_RUNS: `${API_BASE_URL}/matching/admin/matching-runs/`,
    ADMIN_CORRESPONDANCE_DETAIL: (corrRef) =>
      `${API_BASE_URL}/matching/admin/correspondances/ref/${encodeURIComponent(String(corrRef))}/`,
    ADMIN_CORRESPONDANCE_DELETE: (corrRef) =>
      `${API_BASE_URL}/matching/admin/correspondances/ref/${encodeURIComponent(String(corrRef))}/delete/`,
    ADMIN_CORRESPONDANCES_BESOIN: (besoinId) =>
      `${API_BASE_URL}/matching/admin/correspondances/besoin/${besoinId}/`,
    ADMIN_FOURNISSEUR_PROFIL: (fournisseurId) =>
      `${API_BASE_URL}/matching/admin/fournisseurs/${fournisseurId}/profil/`,
    CLIENT_FOURNISSEUR_PROFIL_MATCHE: (fournisseurId) =>
      `${API_BASE_URL}/matching/client/fournisseurs/${fournisseurId}/profil/`,
    CLIENT_CONFIRMER_MATCH: `${API_BASE_URL}/matching/client/confirmer-match/`,
    SYNC_DEVIS_OPPORTUNITIES: (besoinId) =>
      `${API_BASE_URL}/matching/besoin/${besoinId}/sync-devis-opportunities/`,
    SCORE_DEBUG: (besoinId, prestationId) =>
      `${API_BASE_URL}/matching/score-debug/besoin/${besoinId}/prestation/${prestationId}/`,
    /** @deprecated utiliser FIND_MATCHES_FOR_BESOIN */
    FIND_MATCHES_FOR_NEED: (needId) =>
      `${API_BASE_URL}/matching/trouver-correspondances/besoin/${needId}/`,
    /** @deprecated utiliser FIND_MATCHES_FOR_PRESTATION */
    FIND_MATCHES_FOR_OFFER: (offerId) =>
      `${API_BASE_URL}/matching/trouver-correspondances/prestation/${offerId}/`,
  }
};

export default API_BASE_URL;
