import { API_ENDPOINTS } from '../config/api';

class AuthService {
  // Login
  async login(email, password) {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
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
    const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Afficher les erreurs spécifiques du backend
      let errorMessage = 'Registration failed';
      if (data.username) {
        errorMessage = data.username[0];
      } else if (data.email) {
        errorMessage = data.email[0];
      } else if (data.password) {
        errorMessage = data.password[0];
      } else if (data.non_field_errors) {
        errorMessage = data.non_field_errors[0];
      } else if (data.detail) {
        errorMessage = data.detail;
      }
      throw new Error(errorMessage);
    }
    
    return data;
  }
  
  // Logout
  async logout() {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
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
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    
    return data.access;
  }

  async requestPasswordReset(email) {
    const response = await fetch(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.detail || 'Demande impossible');
    }
    return data;
  }

  async confirmPasswordReset(email, code, password) {
    const response = await fetch(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        code: String(code).trim(),
        password,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.detail || 'Réinitialisation impossible');
    }
    return data;
  }
}

const authService = new AuthService();

export default authService;
