const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

/** @type {import('expo/config').ExpoConfig} */
const config = {
  owner: 'citizenalert',
  name: 'CitizenAlert',
  slug: 'citizen-alert',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/citizenalert_logo.png',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.citizenalert.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/citizenalert_logo.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    package: 'com.citizenalert.app',
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },
  web: {
    favicon: './assets/citizenalert_logo.png',
  },
  plugins: [
    'expo-router',
    "@sentry/react-native",
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow CitizenAlert to use your location to report and view hazards.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/citizenalert_logo.png',
        color: '#2196F3',
      },
    ],
  ],
  scheme: 'citizenalert',
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: 'ef7eb82d-ddcd-459e-8e53-fb6f22c37057',
    },
  },
};

module.exports = { expo: config };