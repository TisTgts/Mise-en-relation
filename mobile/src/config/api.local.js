/**
 * Résolution API en développement local uniquement.
 * Importé seulement quand __DEV__ === true (exclu des bundles production par Metro).
 */
import { Platform } from 'react-native';

export function resolveLocalApiBaseUrl(fromEnv, { hostFromMetro, isLocalApiUrl, productionUrl }) {
  if (Platform.OS === 'web') {
    return fromEnv || 'http://127.0.0.1:8000/api';
  }

  const metroHost = hostFromMetro();
  if (metroHost && (!fromEnv || isLocalApiUrl(fromEnv))) {
    return `http://${metroHost}:8000/api`;
  }

  if (fromEnv) return fromEnv;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api';
  return productionUrl;
}
