// src/services/firebase.js

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCL6fYcmlPwtW2w5zESlRqE4r8Yiu9pMHE",
  authDomain: "student-budget-tracker-79e9e.firebaseapp.com",
  projectId: "student-budget-tracker-79e9e",
  storageBucket: "student-budget-tracker-79e9e.firebasestorage.app",
  messagingSenderId: "875132454638",
  appId: "1:875132454638:web:50224c13a4dc236495d5ff",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Correct Auth initialization for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore (this part was already correct)
export const db = getFirestore(app);

