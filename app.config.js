const fs = require('fs');
const path = require('path');

function resolveOptionalFile(...candidates) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const resolvedPath = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(__dirname, candidate);

    if (fs.existsSync(resolvedPath)) {
      return candidate;
    }
  }

  return undefined;
}

const androidGoogleServicesFile = resolveOptionalFile(
  process.env.GOOGLE_SERVICES_JSON,
  './google-services.json',
);

const iosGoogleServicesFile = resolveOptionalFile(
  process.env.GOOGLE_SERVICE_INFO_PLIST,
  './GoogleService-Info.plist',
);

module.exports = {
  expo: {
    name: 'Receta Bebesh',
    slug: 'receta-bebesh',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.driza.recetabebesh',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      ...(iosGoogleServicesFile
        ? { googleServicesFile: iosGoogleServicesFile }
        : {}),
    },
    android: {
      package: 'com.driza.recetabebesh',
      ...(androidGoogleServicesFile
        ? { googleServicesFile: androidGoogleServicesFile }
        : {}),
      adaptiveIcon: {
        backgroundColor: '#FFF9F5',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'fa366d8f-95d8-4576-bdc0-7343ecae41f6',
      },
    },
    scheme: 'com.driza.recetabebesh',
    plugins: [
      'expo-localization',
      '@react-native-community/datetimepicker',
    ],
  },
};
