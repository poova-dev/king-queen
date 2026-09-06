import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] || '';
  }
  return '';
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'),
};

// Check if all required credentials are provided
export const getMissingFirebaseEnvVars = (): string[] => {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ] as const;

  return requiredKeys.filter((key) => !getEnvVar(key));
};

const missingVars = getMissingFirebaseEnvVars();
const isConfigured = missingVars.length === 0;

// Initialize Firebase App safely (singleton pattern)
// In production builds, no fallback dummy credentials exist or get bundled.
const app: FirebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(
      import.meta.env?.PROD || isConfigured
        ? firebaseConfig
        : {
            apiKey: 'test-api-key-for-local-node-tests',
            authDomain: 'test-app.firebaseapp.com',
            projectId: 'test-project',
            storageBucket: 'test-app.appspot.com',
            messagingSenderId: '000000000000',
            appId: '1:000000000000:web:000000000000',
          }
    );

// Initialize Firebase Modular services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Safe development-only initialization diagnostic
// Logs only missing variable names (never secret values)
if (import.meta.env?.DEV) {
  if (isConfigured) {
    console.info('[Firebase] Initialized successfully with project ID:', firebaseConfig.projectId);
  } else {
    console.warn(
      `[Firebase] Missing required environment variables: [${missingVars.join(', ')}]. Please configure them in your .env file or hosting provider.`
    );
  }
}

export { app, auth, db, isConfigured };
export default app;
