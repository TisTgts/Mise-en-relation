import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

const CountryContext = createContext({
  country: null,
  cities: [],
  loading: true,
  error: null,
  refresh: async () => {},
});

export function CountryProvider({ children }) {
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const { data } = await apiClient.get(API_ENDPOINTS.CONFIG.COUNTRY);
      setCountry(data.country || data);
    } catch (e) {
      setError(e?.message || 'Config pays indisponible');
      setCountry(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    [country, cities, loading, error]
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
