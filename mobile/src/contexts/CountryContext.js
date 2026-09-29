import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';

const MAX_ATTEMPTS = 3;

const CountryContext = createContext({
  country: null,
  cities: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function CountryProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inFlight = useRef(null);

  const load = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      setLoading(true);
      setError(null);
      let lastError = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        try {
          const { data } = await apiClient.get(API_ENDPOINTS.CONFIG.COUNTRY, { skipAuth: true });
          setCountry(data.country || data);
          setLoading(false);
          return;
        } catch (e) {
          lastError = e;
          if (attempt < MAX_ATTEMPTS - 1) await wait(1000 * (attempt + 1));
        }
      }
      setError(lastError?.message || 'Config pays indisponible');
      setLoading(false);
    })().finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAuthenticated && !(country?.cities || []).length) load();
  }, [isAuthenticated, country, load]);

  const cities = useMemo(() => {
    const list = country?.cities || [];
    return [...list].sort((a, b) => {
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
      return String(a.name).localeCompare(String(b.name), 'fr');
    });
  }, [country]);

  const value = useMemo(
    () => ({
      country,
      cities,
      copy: country?.copy || {},
      loading,
      error,
      refresh: load,
    }),
    [country, cities, loading, error, load]
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    throw new Error('useCountry doit être utilisé dans CountryProvider');
  }
  return ctx;
}

export default CountryContext;
