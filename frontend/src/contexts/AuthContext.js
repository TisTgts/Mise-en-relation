import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Actions pour le reducer
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESTORE_COMPLETE: 'RESTORE_COMPLETE'
};

// État initial
const getInitialState = () => {
  const token = localStorage.getItem('access_token');
  const refresh_token = localStorage.getItem('refresh_token');
  const type_utilisateur = localStorage.getItem('type_utilisateur');
  
  return {
    user: null,
    token,
    refresh_token,
    isAuthenticated: !!token,
    loading: !!token, // Si on a un token, on est en cours de chargement/restauration
    error: null,
    type_utilisateur
  };
};

const initialState = getInitialState();

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refresh_token: action.payload.refresh_token,
        type_utilisateur: action.payload.user.type_utilisateur,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        refresh_token: null,
        type_utilisateur: null,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        refresh_token: null,
        type_utilisateur: null,
        error: null
      };
    
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.RESTORE_COMPLETE:
      return {
        ...state,
        loading: false
      };
    
    default:
      return state;
  }
};

// Création du contexte
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Effet pour restaurer l'utilisateur au chargement
  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem('access_token');
      const typeUtilisateur = localStorage.getItem('type_utilisateur');
      
      console.log('AuthContext - restoreUser - token:', token);
      console.log('AuthContext - restoreUser - typeUtilisateur:', typeUtilisateur);
      
      // Si on a un token mais pas d'utilisateur
      if (token && typeUtilisateur && !state.user) {
        try {
          console.log('AuthContext - Attempting to restore user...');
          // Tenter de restaurer les données utilisateur
          const response = await fetch('/api/accounts/me/', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('AuthContext - User restored successfully:', userData);
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: userData,
                token: token,
                refresh_token: localStorage.getItem('refresh_token')
              }
            });
          } else {
            throw new Error('Token invalide');
          }
        } catch (error) {
          console.error('Erreur de restauration:', error);
          // Nettoyer le localStorage si le token est invalide
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('type_utilisateur');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
      
      // Toujours terminer le chargement
      dispatch({ type: AUTH_ACTIONS.RESTORE_COMPLETE });
    };

    restoreUser();
  }, []); // Exécuter uniquement au montage

  // Effet pour sauvegarder le token dans localStorage
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('access_token', state.token);
      localStorage.setItem('refresh_token', state.refresh_token || '');
      localStorage.setItem('type_utilisateur', state.type_utilisateur || '');
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('type_utilisateur');
    }
  }, [state.token, state.refresh_token, state.type_utilisateur]);

  // Effet pour configurer les headers par défaut pour les requêtes API
  useEffect(() => {
    if (state.token) {
      const originalFetch = window.fetch;
      window.fetch = (url, options = {}) => {
        // Ne pas ajouter de header pour les requêtes d'authentification et locales
        const isAuthRequest = url.includes('/api/accounts/login/') || 
                           url.includes('/api/accounts/register/') ||
                           url.includes('/api/accounts/logout/') ||
                           url.startsWith('http://localhost:8000/api/accounts/');
        
        // Ne pas ajouter de header pour les requêtes vers le backend avec URL absolue
        const isAbsoluteBackendRequest = url.includes('http://localhost:8000');
        
        const headers = {
          ...options.headers,
        };
        
        // Ajouter le header Authorization seulement pour les requêtes relatives et non-auth
        if (!isAuthRequest && !isAbsoluteBackendRequest) {
          headers['Authorization'] = `Bearer ${state.token}`;
        }
        
        return originalFetch(url, { ...options, headers });
      };
    }
  }, [state.token]);

  // Actions
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      console.log('AuthContext.login - Attempting login with:', email);
      
      // Créer un FormData pour envoyer les données comme Django l'attend
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const response = await fetch('http://localhost:8000/api/accounts/login/', {
        method: 'POST',
        body: formData,
        mode: 'cors'
      });

      const data = await response.json();
      console.log('AuthContext.login - Response data:', data);
      console.log('AuthContext.login - Response status:', response.status);

      if (response.ok) {
        console.log('AuthContext.login - Login successful, dispatching success');
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: data.user,
            token: data.access,
            refresh_token: data.refresh,
            type_utilisateur: data.user.type_utilisateur
          }
        });
        console.log('AuthContext.login - Returning success: true');
        return { success: true, user: data.user };
      } else {
        console.log('AuthContext.login - Login failed, dispatching failure');
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: data.detail || data.message || 'Email ou mot de passe incorrect'
        });
        return { success: false, error: data.detail || data.message || 'Email ou mot de passe incorrect' };
      }
    } catch (error) {
      console.error('AuthContext.login - Network error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: 'Erreur réseau. Vérifiez votre connexion.'
      });
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.' };
    }
  };

  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await fetch('http://localhost:8000/api/accounts/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData),
        mode: 'cors'
      });

      const data = await response.json();

      if (response.ok) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS
        });
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: data.message || 'Erreur d\'inscription'
        });
        return { success: false, error: data.message || 'Erreur d\'inscription' };
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: 'Erreur réseau. Vérifiez votre connexion.'
      });
      return { success: false, error: 'Erreur réseau. Vérifiez votre connexion.' };
    }
  };

  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    // Rediriger vers la page d'accueil
    window.location.href = '/';
  };

  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export default AuthContext;
