import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || '',
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

  return requiredKeys.filter((key) => !import.meta.env?.[key]);
};

const missingVars = getMissingFirebaseEnvVars();
const isConfigured = missingVars.length === 0;

// Initialize Firebase App safely (singleton pattern)
const app: FirebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(
      isConfigured
        ? firebaseConfig
        : {
            apiKey: 'dummy-api-key',
            authDomain: 'dummy-app.firebaseapp.com',
            projectId: 'dummy-project',
            storageBucket: 'dummy-app.appspot.com',
            messagingSenderId: '000000000000',
            appId: '1:000000000000:web:000000000000',
          }
    );

// Initialize Firebase Modular services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Safe development-only initialization verification
if (import.meta.env?.DEV) {
  if (isConfigured) {
    console.info('[Firebase] Initialized successfully with configured project:', firebaseConfig.projectId);
  } else {
    console.warn(
      `[Firebase] Missing required environment variables: ${missingVars.join(', ')}. Set them in .env to connect to your Firebase project.`
    );
  }
}

export { app, auth, db, isConfigured };
export default app;
