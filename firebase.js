// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
