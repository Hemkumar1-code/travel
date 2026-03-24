import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZU8Qnk6t7tdqx8BfRdD4QjYEooq74UKI",
  authDomain: "track-6562a.firebaseapp.com",
  databaseURL: "https://track-6562a-default-rtdb.firebaseio.com",
  projectId: "track-6562a",
  storageBucket: "track-6562a.firebasestorage.app",
  messagingSenderId: "591628677387",
  appId: "1:591628677387:web:4569f93b4066916125b20e",
  measurementId: "G-EG678NB4WM"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
