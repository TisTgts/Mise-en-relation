import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { isProductionBuild } from '../config/security';

const KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER_TYPE: 'type_utilisateur',
};

const SECURE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** SecureStore natif ; web = mémoire uniquement en production. */
const memory = new Map();

async function getItem(key) {
  if (Platform.OS === 'web') {
    if (isProductionBuild()) {
      return memory.get(key) ?? null;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      /* ignore */
    }
    return memory.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key, SECURE_OPTIONS);
}

async function setItem(key, value) {
  if (Platform.OS === 'web') {
    if (isProductionBuild()) {
      memory.set(key, value);
      return;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      /* ignore */
    }
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
}

async function deleteItem(key) {
  if (Platform.OS === 'web') {
    if (isProductionBuild()) {
      memory.delete(key);
      return;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch {
      /* ignore */
    }
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
}

export async function getAccessToken() {
  return getItem(KEYS.ACCESS);
}

export async function getRefreshToken() {
  return getItem(KEYS.REFRESH);
}

export async function getUserType() {
  return getItem(KEYS.USER_TYPE);
}

export async function saveSession({ access, refresh, typeUtilisateur }) {
  await setItem(KEYS.ACCESS, access || '');
  await setItem(KEYS.REFRESH, refresh || '');
  if (typeUtilisateur != null) {
    await setItem(KEYS.USER_TYPE, String(typeUtilisateur));
  }
}

export async function clearSession() {
  await Promise.all([
    deleteItem(KEYS.ACCESS),
    deleteItem(KEYS.REFRESH),
    deleteItem(KEYS.USER_TYPE),
  ]);
}
