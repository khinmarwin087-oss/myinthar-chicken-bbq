import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging"; 

const firebaseConfig = {
  // အသစ်ရလာတဲ့ API Key အမှန် (စာလုံးပေါင်း သေချာစစ်ထားပါသည်)
  apiKey: "AIzaSyB3SaXUOzDh9_DVbuupon7BsCgZfw5UzZ4", 
  authDomain: "myrestaurantapp-a14d4.firebaseapp.com",
  databaseURL: "https://myrestaurantapp-a14d4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "myrestaurantapp-a14d4",
  storageBucket: "myrestaurantapp-a14d4.firebasestorage.app",
  messagingSenderId: "123788707874",
  appId: "1:123788707874:web:6593b827b284cc7cb9a27b",
  measurementId: "G-E8X5BR4NKP"
};

// Initialize App (Duplicate မဖြစ်အောင် စစ်ဆေးပြီး Initialize လုပ်ခြင်း)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Messaging Logic (အရင် Code ထဲက အတိုင်း Browser supported ဖြစ်မဖြစ် စစ်ဆေးခြင်း)
const messaging = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
  }
  return null;
};

// အပြင်မှာ ပြန်သုံးမယ့် Variable များကို Export ထုတ်ခြင်း
export { auth, db, provider, messaging };
