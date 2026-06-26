import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const rawFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredKeys: Array<keyof typeof rawFirebaseConfig> = [
  'apiKey',
  'authDomain',
  'databaseURL',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

export const missingFirebaseKeys = requiredKeys.filter(
  (key) => !rawFirebaseConfig[key],
);

export const isFirebaseConfigured = missingFirebaseKeys.length === 0;

export function getFirebaseConfigErrorMessage(): string {
  if (isFirebaseConfigured) {
    return '';
  }

  return `Firebase config missing: ${missingFirebaseKeys.join(', ')}`;
}

const firebaseConfig: FirebaseConfig | null = isFirebaseConfigured
  ? {
      apiKey: rawFirebaseConfig.apiKey!,
      authDomain: rawFirebaseConfig.authDomain!,
      databaseURL: rawFirebaseConfig.databaseURL!,
      projectId: rawFirebaseConfig.projectId!,
      storageBucket: rawFirebaseConfig.storageBucket!,
      messagingSenderId: rawFirebaseConfig.messagingSenderId!,
      appId: rawFirebaseConfig.appId!,
      measurementId: rawFirebaseConfig.measurementId,
    }
  : null;

export const firebaseApp: FirebaseApp | null = firebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseDatabase: Database | null = firebaseApp
  ? getDatabase(firebaseApp)
  : null;
