/**
 * Synchronisation du pays actif à l'exécution.
 *
 * Le backend fait foi : au démarrage, on interroge /api/config/country/.
 * Si le code renvoyé diffère du pays actuellement appliqué (bundle + cache
 * localStorage), on met à jour le cache et on recharge une seule fois pour que
 * toute l'UI (villes, devise, téléphone, textes…) reflète le nouveau pays,
 * sans recompiler le frontend.
 */
import { API_ENDPOINTS } from '../config/api';
import { COUNTRY_CODE, COUNTRY_STORAGE_KEY, AVAILABLE_COUNTRY_CODES } from './index';

function storeCode(code) {
  try {
    localStorage.setItem(COUNTRY_STORAGE_KEY, code);
  } catch {
    /* localStorage indisponible : on ignore, le défaut du bundle s'applique. */
  }
}

/** Applique immédiatement un code pays (cache + reload). Utilisé après un switch admin. */
export function applyCountryCode(code) {
  const normalized = (code || '').trim().toLowerCase();
  if (!AVAILABLE_COUNTRY_CODES.includes(normalized)) return;
  storeCode(normalized);
  window.location.reload();
}

/** Interroge le backend et aligne l'UI si le pays actif a changé. */
export async function syncCountryFromServer() {
  // Si le pays est verrouillé au build (REACT_APP_COUNTRY), on ne synchronise pas
  // pour éviter toute boucle de rechargement.
  if ((process.env.REACT_APP_COUNTRY || '').trim()) return;
  try {
    const res = await fetch(API_ENDPOINTS.CONFIG.COUNTRY);
    if (!res.ok) return;
    const data = await res.json();
    const serverCode = (data?.code || '').trim().toLowerCase();
    if (!serverCode || !AVAILABLE_COUNTRY_CODES.includes(serverCode)) return;

    if (serverCode !== COUNTRY_CODE) {
      storeCode(serverCode);
      window.location.reload();
    } else {
      // Garde le cache aligné (utile au tout premier chargement).
      storeCode(serverCode);
    }
  } catch {
    /* Hors-ligne / API injoignable : on conserve le pays courant. */
  }
}
