// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration.
// IMPORTANT: Replace with your actual config from the Firebase console.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGpmQUWYJvQOgPJ35uY4TbCJIS06rpE0s",
  authDomain: "aspaklaria-app.firebaseapp.com",
  projectId: "aspaklaria-app",
  storageBucket: "aspaklaria-app.firebasestorage.app",
  messagingSenderId: "513718941532",
  appId: "1:513718941532:web:cfe185ce599caaf3027399",
  measurementId: "G-RLKWQ5G5XQ"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the db instance to be used in other parts of your app
export { db };

