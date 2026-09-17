import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { registerPushToken, unregisterPushToken } from './authService';

const PUSH_TOKEN_KEY = 'expo_push_token';

/** Expo Go (SDK 53+) : pas de push distantes — éviter d’importer le module natif. */
export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

/** Build natif (dev client / APK / store) où le push distant est possible. */
export function canUseRemotePush() {
  return !isExpoGo() && Device.isDevice;
}

/** Local + remote : hors Expo Go uniquement (évite ERROR / WARN Metro). */
export function canUseNotifications() {
  return !isExpoGo() && Device.isDevice;
}

let Notifications = null;
let handlerReady = false;

function getNotifications() {
  if (isExpoGo()) return null;
  if (!Notifications) {
    // Chargement différé : en Expo Go on n’importe jamais le module (plus d’ERROR SDK 53+).
    // eslint-disable-next-line global-require
    Notifications = require('expo-notifications');
  }
  return Notifications;
}

function ensureHandler() {
  const N = getNotifications();
  if (!N || handlerReady) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    handlerReady = true;
  } catch {
    /* ignore */
  }
}

function resolveProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    null
  );
}

export async function getStoredPushToken() {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Prépare les notifications (permissions + canal + token Expo Push).
 * No-op silencieux dans Expo Go.
 */
export async function initPushNotifications() {
  if (!canUseNotifications()) {
    return null;
  }

  const N = getNotifications();
  if (!N) return null;
  ensureHandler();

  try {
    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: N.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch {
    return null;
  }

  if (!canUseRemotePush()) {
    return null;
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return null;
  }

  try {
    const tokenData = await N.getExpoPushTokenAsync({ projectId });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, tokenData.data);
    return tokenData.data;
  } catch {
    return null;
  }
}

export async function syncPushTokenWithBackend() {
  if (!canUseRemotePush()) {
    return null;
  }
  const token = await initPushNotifications();
  if (!token) return null;
  try {
    await registerPushToken(token, Platform.OS);
  } catch {
    /* non bloquant */
  }
  return token;
}

export async function clearPushTokenOnLogout() {
  if (!canUseRemotePush()) return;
  const token = await getStoredPushToken();
  if (token) {
    await unregisterPushToken(token);
  }
}

export async function scheduleLocalNotification({ title, body, data = {} }) {
  if (!canUseNotifications()) {
    return;
  }
  const N = getNotifications();
  if (!N) return;
  ensureHandler();
  try {
    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });
  } catch {
    /* ignore */
  }
}

export function getNotificationData(response) {
  return response?.notification?.request?.content?.data || {};
}

/** Accès lazy pour les listeners (handler push). */
export function getNotificationsModule() {
  if (!canUseNotifications()) return null;
  ensureHandler();
  return getNotifications();
}
