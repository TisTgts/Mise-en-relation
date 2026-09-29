import { API_ENDPOINTS } from '../config/api';
import { apiErrorFromResponse, apiFetch } from '../utils/apiErrors';

class AuthService {
  // Login
  async login(email, password) {
    const response = await apiFetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-App': 'toghinis-web',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw await apiErrorFromResponse(response, 'Connexion impossible. Vérifiez votre e-mail et votre mot de passe.');
    }
    
    const data = await response.json();
    
    // Stocker les tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  }
  
  // Register
  async register(userData) {
    const response = await apiFetch(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-App': 'toghinis-web',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw await apiErrorFromResponse(response, "L'inscription n'a pas abouti. Vérifiez le formulaire puis réessayez.");
    }
    
    return response.json();
  }
  
  // Logout
  async logout() {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'X-Client-App': 'toghinis-web',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Nettoyer le stockage local
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
  
  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  // Get token
  getToken() {
    return localStorage.getItem('access_token');
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }
  
  // Get auth headers
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'X-Client-App': 'toghinis-web',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }
  
  // Refresh token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-App': 'toghinis-web',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      throw await apiErrorFromResponse(response, 'Votre session a expiré. Reconnectez-vous pour continuer.');
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    
    return data.access;
  }

  async requestPasswordReset(email) {
    const response = await apiFetch(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-App': 'toghinis-web' },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (!response.ok) {
      throw await apiErrorFromResponse(response, "La demande n'a pas pu être envoyée. Vérifiez l'e-mail saisi puis réessayez.");
    }
    return response.json().catch(() => ({}));
  }

  async confirmPasswordReset(email, code, password) {
    const response = await apiFetch(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-App': 'toghinis-web' },
      body: JSON.stringify({
        email: email.trim(),
        code: String(code).trim(),
        password,
      }),
    });
    if (!response.ok) {
      throw await apiErrorFromResponse(response, 'Réinitialisation impossible. Vérifiez le code reçu par e-mail puis réessayez.');
    }
    return response.json().catch(() => ({}));
  }

  async deleteAccount() {
    const refresh = localStorage.getItem('refresh_token');
    const response = await apiFetch(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        confirmation: 'SUPPRIMER',
        ...(refresh ? { refresh } : {}),
      }),
    });
    if (!response.ok) {
      throw await apiErrorFromResponse(response, "Le compte n'a pas pu être supprimé. Réessayez ou contactez le support.");
    }
    const data = await response.json().catch(() => ({}));
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('type_utilisateur');
    return data;
  }
}

const authService = new AuthService();

export default authService;
