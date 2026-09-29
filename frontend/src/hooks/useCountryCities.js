import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import COUNTRY from '../pays';

const sortCities = (list) =>
  [...list].sort((a, b) => {
    if (a.primary && !b.primary) return -1;
    if (!a.primary && b.primary) return 1;
    return String(a.name).localeCompare(String(b.name), 'fr');
  });

const FALLBACK = sortCities(COUNTRY.cities || []).map((c) => c.name);

let cache = null;

/** Villes du pays actif (serveur), avec la config embarquée en secours. */
export default function useCountryCities() {
  const [cities, setCities] = useState(cache || FALLBACK);

  useEffect(() => {
    if (cache) return undefined;
    let cancelled = false;
    fetch(API_ENDPOINTS.CONFIG.COUNTRY)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = data?.country?.cities || [];
        if (!list.length) return;
        cache = sortCities(list).map((c) => c.name).filter(Boolean);
        if (!cancelled) setCities(cache);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return cities;
}
