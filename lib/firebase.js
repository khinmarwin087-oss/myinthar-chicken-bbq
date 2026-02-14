import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Provider ထည့်ထားပါတယ်
import { getMessaging, isSupported } from "firebase/messaging"; 

const firebaseConfig = {
  apiKey: "AIzaSyB3SaXU0zDh9_DVbuupon7BsCgZfw5UzZ4",
  authDomain: "myrestaurantapp-a14d4.firebaseapp.com",
  projectId: "myrestaurantapp-a14d4",
  storageBucket: "myrestaurantapp-a14d4.firebasestorage.app",
  messagingSenderId: "123788707874",
  appId: "1:123788707874:web:6593b827b284cc7cb9a27b"
};

// Initialize App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // Google Provider ကို ဒီမှာ ဆောက်ထားပါ

// Messaging (Browser စစ်ဆေးခြင်းအပါအဝင်)
const messaging = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
  }
  return null;
};

export { db, auth, provider, messaging }; 
