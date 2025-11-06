// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA-sKyoC38WPxWBf57-GWeBCyZj3KJNgCw",
  authDomain: "stand-3cd5c.firebaseapp.com",
  projectId: "stand-3cd5c",
  storageBucket: "stand-3cd5c.appspot.com",
  messagingSenderId: "556381043052",
  appId: "1:556381043052:web:899cd33ce13a6827cf1b49",
  measurementId: "G-CZEDDWZBSP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Analytics is only initialized in browser environments to avoid SSR issues
let analytics = null;
if (typeof window !== 'undefined') {
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch((error) => {
    console.warn('[Firebase] Analytics not available:', error);
  });
}

export { app, analytics, db };
