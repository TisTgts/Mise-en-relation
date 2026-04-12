const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const API_ENDPOINTS = {
  // Authentification
  AUTH: {
    LOGIN: `${API_BASE_URL}/accounts/login/`,
    REGISTER: `${API_BASE_URL}/accounts/register/`,
    REFRESH: `${API_BASE_URL}/accounts/refresh/`,
    LOGOUT: `${API_BASE_URL}/accounts/logout/`,
  },
  
  // Users et profils
  USER: {
    PROFILE: `${API_BASE_URL}/accounts/profile/`,
    ME: `${API_BASE_URL}/accounts/me/`,
  },
  
  // Services
  SERVICES: {
    CATEGORIES: `${API_BASE_URL}/services/categories/`,
    PRESTATIONS: `${API_BASE_URL}/services/prestations/`,
    BESOINS: `${API_BASE_URL}/services/besoins/`,
    /** @deprecated utiliser BESOINS */
    DEMANDES: `${API_BASE_URL}/services/besoins/`,
    TRANSACTIONS: `${API_BASE_URL}/services/transactions/`,
    MESSAGES: `${API_BASE_URL}/services/messages/`,
    STATISTICS: `${API_BASE_URL}/services/statistics/`,
    STATISTICS_ADMIN: `${API_BASE_URL}/services/statistics/admin/`,
  },
  
  // Matching
  MATCHING: {
    FIND_MATCHES_FOR_NEED: (needId) => `${API_BASE_URL}/matching/find-matches-for-need/${needId}/`,
    FIND_MATCHES_FOR_OFFER: (offerId) => `${API_BASE_URL}/matching/find-matches-for-offer/${offerId}/`,
    SCORES: `${API_BASE_URL}/matching/scores/`,
  }
};

export default API_BASE_URL;
