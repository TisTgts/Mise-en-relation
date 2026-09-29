/** @type {import('expo/config').ExpoConfig} */
const IS_PRODUCTION_BUILD = process.env.EXPO_PUBLIC_APP_ENV === 'production';
// Build de dev (expo-dev-client) : identifiant distinct pour cohabiter avec l'APK preview/prod.
const IS_DEV_VARIANT = process.env.APP_VARIANT === 'development';
const APP_ID = IS_DEV_VARIANT ? 'com.toghinis.mobile.dev' : 'com.toghinis.mobile';
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '';

const localNetworkExceptions = {
  localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
  '127.0.0.1': { NSExceptionAllowsInsecureHTTPLoads: true },
};

export default {
  expo: {
    name: IS_DEV_VARIANT ? 'Toghinis Dev' : 'Toghinis',
    slug: 'toghinis-mobile',
    version: '0.2.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'toghinis',
    androidNavigationBar: {
      backgroundColor: '#FFFFFF',
      barStyle: 'dark-content',
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: APP_ID,
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
      package: APP_ID,
      usesCleartextTraffic: !IS_PRODUCTION_BUILD,
      // "pan" : le clavier ne réduit pas la fenêtre — on remonte le composer en JS (fiable sur Samsung).
      softwareKeyboardLayoutMode: 'pan',
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundColor: '#FFFFFF',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
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
        projectId: EAS_PROJECT_ID || '48e21cf7-5750-4bd1-b621-ae788c49253a',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://toghinis.com/api',
      appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
      privacyPolicyUrl: 'https://toghinis.com/confidentialite',
      termsUrl: 'https://toghinis.com/cgu',
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
