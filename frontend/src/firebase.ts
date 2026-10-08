import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const env = (value: string | undefined) => value?.trim() ?? '';

const firebaseConfig = {
  apiKey: env(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: env(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: env(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: env(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: env(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: env(import.meta.env.VITE_FIREBASE_APP_ID),
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Localhost cannot complete Firebase's reCAPTCHA app check (auth/invalid-app-credential).
// In dev, skip that check so console test numbers still require their registered OTP.
// Real numbers keep working in a production build, where this stays off.
if (import.meta.env.DEV) {
  auth.settings.appVerificationDisabledForTesting = true;
}