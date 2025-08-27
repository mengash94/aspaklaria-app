// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// האובייקט שהעתקת
const firebaseConfig = {
  apiKey: "AIzaSyBGpmQUWYJvQOgPJ35uY4TbCJIS06rpE0s",
  authDomain: "aspaklaria-app.firebaseapp.com",
  projectId: "aspaklaria-app",
  storageBucket: "aspaklaria-app.appspot.com",
  messagingSenderId: "513718941532",
  appId: "1:513718941532:web:cfe185ce599caaf3027399",
  measurementId: "G-RLKWQ5G5XQ"
};

// אתחול והגדרת השירותים
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ייצוא השירותים לשימוש בשאר האפליקציה
export { db, auth };