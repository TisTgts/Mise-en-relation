/** @type {import('expo/config').ExpoConfig} */
const IS_PRODUCTION_BUILD = process.env.EXPO_PUBLIC_APP_ENV === 'production';
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '';

const localNetworkExceptions = {
  localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
  '127.0.0.1': { NSExceptionAllowsInsecureHTTPLoads: true },
};

export default {
  expo: {
    name: 'Toghinis',
    slug: 'toghinis-mobile',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'toghinis',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.toghinis.mobile',
      infoPlist: IS_PRODUCTION_BUILD
        ? {
            NSAppTransportSecurity: {
              NSAllowsArbitraryLoads: false,
            },
            UIBackgroundModes: ['remote-notification'],
          }
        : {
            NSAppTransportSecurity: {
              NSAllowsArbitraryLoads: true,
              NSExceptionDomains: localNetworkExceptions,
            },
          },
    },
    android: {
      package: 'com.toghinis.mobile',
      versionCode: 1,
      usesCleartextTraffic: !IS_PRODUCTION_BUILD,
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundColor: '#FFFFFF',
      },
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'CAMERA',
        'READ_MEDIA_IMAGES',
        'POST_NOTIFICATIONS',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID || undefined,
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://toghinis.com/api',
      appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    },
    plugins: [
      'expo-secure-store',
      'expo-font',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Autoriser Toghinis à utiliser votre position pour localiser votre profil et vos besoins.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Autoriser Toghinis à accéder à vos photos pour envoyer des pièces jointes.',
          cameraPermission:
            "Autoriser Toghinis à utiliser l'appareil photo pour envoyer des photos.",
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#1D4ED8',
          defaultChannel: 'messages',
        },
      ],
    ],
    updates: {
      fallbackToCacheTimeout: 0,
    },
  },
};
