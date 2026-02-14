import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging"; // ဒီစာကြောင်း ထည့်ပါ

const firebaseConfig = {
  apiKey: "AIzaSyB3SaXU0zDh9_DVbuupon7BsCgZfw5UzZ4",
  authDomain: "myrestaurantapp-a14d4.firebaseapp.com",
  projectId: "myrestaurantapp-a14d4",
  storageBucket: "myrestaurantapp-a14d4.firebasestorage.app",
  messagingSenderId: "123788707874",
  appId: "1:123788707874:web:6593b827b284cc7cb9a27b"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = typeof window !== "undefined" ? getMessaging(app) : null; // Messaging ထည့်ပါ

export { db, auth, messaging }; // messaging ကိုပါ export ထုတ်ပေးပါ
