/**
 * Config pays active pour l'UI.
 * Priorité : REACT_APP_COUNTRY (build) → localStorage (dernier pays connu du
 * serveur, permet le changement à chaud) → pays/active.json → défaut.
 */
import { DEFAULT_COUNTRY_CODE } from './active';
import activeJson from './data/active.json';
import tg from './data/tg.json';
import bf from './data/bf.json';

const CATALOG = {
  tg,
  bf,
};

/** Clé localStorage : cache du code pays fourni par le backend. */
export const COUNTRY_STORAGE_KEY = 'app_country_code';

/** Codes disponibles dans le bundle (les données sont embarquées). */
export const AVAILABLE_COUNTRY_CODES = Object.keys(CATALOG);

function readStoredCode() {
  try {
    return (localStorage.getItem(COUNTRY_STORAGE_KEY) || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

function resolveCountryCode() {
  const fromEnv = (process.env.REACT_APP_COUNTRY || '').trim().toLowerCase();
  if (fromEnv && CATALOG[fromEnv]) return fromEnv;
  const fromStorage = readStoredCode();
  if (fromStorage && CATALOG[fromStorage]) return fromStorage;
  const fromActive = (activeJson?.code || DEFAULT_COUNTRY_CODE).trim().toLowerCase();
  if (CATALOG[fromActive]) return fromActive;
  return DEFAULT_COUNTRY_CODE;
}

export const COUNTRY_CODE = resolveCountryCode();
export const COUNTRY = CATALOG[COUNTRY_CODE] || CATALOG[DEFAULT_COUNTRY_CODE];

export const CITIES = (COUNTRY.cities || []).map((c) => c.name);
export const PRIMARY_CITIES = (COUNTRY.cities || []).filter((c) => c.primary).map((c) => c.name);
export const PHONE_PLACEHOLDER = COUNTRY.phone_placeholder || '';
export const PHONE_PREFIX = COUNTRY.phone_prefix || '';
export const CURRENCY = COUNTRY.currency || 'XOF';
export const CURRENCY_LABEL = COUNTRY.currency_label || 'FCFA';
export const COPY = COUNTRY.copy || {};

/** Première ville principale (coords + nom) pour exemples de formulaires. */
export function getPrimaryCity() {
  const cities = COUNTRY.cities || [];
  return cities.find((c) => c.primary) || cities[0] || { name: '', lat: 0, lng: 0 };
}

export function getEmplacementExample() {
  const city = getPrimaryCity();
  return {
    latitude: city.lat,
    longitude: city.lng,
    adresse: COPY.emplacement_example_adresse || city.name,
  };
}

export function citiesHelpLabel() {
  if (PRIMARY_CITIES.length >= 2) {
    return `${PRIMARY_CITIES[0]} et ${PRIMARY_CITIES[1]}`;
  }
  return PRIMARY_CITIES[0] || '';
}

export default COUNTRY;
