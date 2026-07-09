import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase connection details. These are read from environment variables
// (see .env.local and the README) so the config isn't hard-coded in the source.
// The NEXT_PUBLIC_ prefix is what makes Next.js expose them to the browser,
// which is required because Firebase runs client-side here.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase exactly once. Next.js can re-run this module (e.g. during
// hot reload), so we reuse the existing app if one already exists instead of
// creating a duplicate, which Firebase would reject.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Shared service handles used across the app: authentication, the Firestore
// database, and file storage.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
