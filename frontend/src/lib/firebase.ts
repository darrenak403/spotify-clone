import {initializeApp} from "firebase/app";
import {browserLocalPersistence, GoogleAuthProvider, initializeAuth} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// getAuth()'s default persistence auto-detection picks indexedDBLocalPersistence
// when `indexedDB` exists, but that API silently hangs (no error, promise never
// settles) inside Capacitor's WKWebView on iOS — forcing browserLocalPersistence
// (localStorage) skips that broken auto-detection entirely.
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});
export const googleProvider = new GoogleAuthProvider();
