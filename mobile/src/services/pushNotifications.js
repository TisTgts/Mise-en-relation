import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { registerPushToken, unregisterPushToken } from './authService';

const PUSH_TOKEN_KEY = 'expo_push_token';

/** Expo Go (SDK 53+) : pas de push distantes. */
export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

/** Build natif (dev client / APK / store) où le push distant est possible. */
export function canUseRemotePush() {
  return !isExpoGo() && Device.isDevice;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
 * Prépare les notifications.
 * - Expo Go : permissions + canal Android seulement (locales OK).
 * - APK / dev build : token Expo Push si projectId EAS présent.
 */
export async function initPushNotifications() {
  if (!Device.isDevice) {
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.DEFAULT,
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
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
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
  try {
    await Notifications.scheduleNotificationAsync({
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
