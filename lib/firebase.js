import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Auth ထည့်ရန်

const firebaseConfig = {
  apiKey: "AIzaSyB3SaXUOzDh9_DVbuupon7BsCgZfw5UzZ4",
  authDomain: "myrestaurantapp-a14d4.firebaseapp.com",
  projectId: "myrestaurantapp-a14d4",
  storageBucket: "myrestaurantapp-a14d4.firebasestorage.app",
  messagingSenderId: "123788707874",
  appId: "1:123788707874:web:6593b827b284cc7cb9a27b"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // auth ကို သတ်မှတ်ပါ

export { db, auth }; // နှစ်ခုလုံးကို export ထုတ်ပါ
