// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCdr1TdSUUcwHc8cSuTAqoi7J_5TbZRhgA",
  authDomain: "crystal-appchallenge-cb.firebaseapp.com",
  projectId: "crystal-appchallenge-cb",
  storageBucket: "crystal-appchallenge-cb.firebasestorage.app",
  messagingSenderId: "492242577167",
  appId: "1:492242577167:web:92164e18761530c6fec07a",
  measurementId: "G-S6W4D7NJ14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
