import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import * as authService from '../services/authService';
import { clearSession, getAccessToken } from '../services/tokenStorage';
import { clearPushTokenOnLogout, syncPushTokenWithBackend } from '../services/pushNotifications';

const AUTH_ACTIONS = {
  BOOTSTRAP_START: 'BOOTSTRAP_START',
  BOOTSTRAP_DONE: 'BOOTSTRAP_DONE',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

const initialState = {
  user: null,
  token: null,
  type_utilisateur: null,
  isAuthenticated: false,
  bootstrapping: true,
  loading: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.BOOTSTRAP_START:
      return { ...state, bootstrapping: true };
    case AUTH_ACTIONS.BOOTSTRAP_DONE:
      return { ...state, bootstrapping: false };
    case AUTH_ACTIONS.LOGIN_START:
      return { ...state, loading: true, error: null };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        bootstrapping: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        type_utilisateur: action.payload.user?.type_utilisateur || null,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        type_utilisateur: null,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        bootstrapping: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      dispatch({ type: AUTH_ACTIONS.BOOTSTRAP_START });
      try {
        const token = await getAccessToken();
        if (!token) {
          if (!cancelled) dispatch({ type: AUTH_ACTIONS.BOOTSTRAP_DONE });
          return;
        }
        const user = await authService.fetchMe();
        if (!cancelled) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user, token },
          });
          syncPushTokenWithBackend();
        }
      } catch {
        await clearSession();
        if (!cancelled) dispatch({ type: AUTH_ACTIONS.LOGOUT });
      } finally {
        if (!cancelled) dispatch({ type: AUTH_ACTIONS.BOOTSTRAP_DONE });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const data = await authService.login(email, password);
      const role = data.user?.type_utilisateur;
      if (role !== 'client' && role !== 'fournisseur') {
        await clearSession();
        const msg = 'Cette application est réservée aux clients et fournisseurs.';
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: msg });
        return { success: false, error: msg };
      }
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: data.user, token: data.access },
      });
      syncPushTokenWithBackend();
      return { success: true, user: data.user };
    } catch (err) {
      const msg = authService.extractErrorMessage(
        err,
        'Email ou mot de passe incorrect'
      );
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: msg });
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (payload) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const data = await authService.register(payload);
      if (data.access && data.user) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.access },
        });
        syncPushTokenWithBackend();
      } else {
        dispatch({ type: AUTH_ACTIONS.BOOTSTRAP_DONE });
      }
      return { success: true, user: data.user };
    } catch (err) {
      const msg = authService.extractErrorMessage(
        err,
        "Erreur d'inscription"
      );
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: msg });
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    await clearPushTokenOnLogout();
    await authService.logout();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateUser,
      clearError,
    }),
    [state, login, register, logout, updateUser, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return ctx;
}

export default AuthContext;
