// Utilitaire pour les requêtes API avec authentification

class ApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  // Récupérer le token d'accès
  getToken() {
    return localStorage.getItem('access_token');
  }

  // Récupérer le token de rafraîchissement
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  // Faire une requête avec authentification
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    console.log('API Request:', { url, method: options.method || 'GET' });
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Ajouter le token d'accès si disponible
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Using token:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found');
    }

    try {
      const response = await fetch(url, config);
      console.log('API Response:', { status: response.status, ok: response.ok });
      
      // Si la réponse est 401 (Unauthorized), essayer de rafraîchir le token
      if (response.status === 401 && this.getRefreshToken()) {
        console.log('Token expired, attempting refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Réessayer la requête avec le nouveau token
          config.headers.Authorization = `Bearer ${this.getToken()}`;
          return fetch(url, config);
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Rafraîchir le token d'accès
  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/accounts/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    // Si le rafraîchissement échoue, déconnecter l'utilisateur
    this.logout();
    return false;
  }

  // Déconnexion
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('type_utilisateur');
    window.location.href = '/login';
  }

  // Méthodes HTTP
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient();
export default apiClient;
