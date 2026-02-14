"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
// Firebase logic များ (လမ်းကြောင်း မှန်ပါစေ)
import { auth } from "../lib/firebase"; 
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [currentDate, setCurrentDate] = useState("Loading date...");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ၁။ ရက်စွဲ ပြသရန်
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));

    // ၂။ Login အခြေအနေကို စစ်ဆေးရန်
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('myDeviceUID', currentUser.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login Function
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // ဒါလေး ထည့်ပေးရင် Popup Window ပိုငြိမ်ပါတယ်
    provider.setCustomParameters({ prompt: 'select_account' }); 

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      // အောက်က alert လေးကို ခဏထည့်ပြီး စမ်းကြည့်ပါ
      // ဒါမှ domain error လား၊ configuration error လားဆိုတာ လူကြီးမင်း သိရမှာပါ
      alert("Login Error: " + error.code); 
    }
  };
  

  // Logout Function
  const handleLogout = () => signOut(auth);

  return (
    <>
      <style jsx global>{`
        :root { 
          --pearl: #ffffff; 
          --bg: #F2F2F7; 
          --primary: #007AFF; 
          --text: #1C1C1E; 
          --gray: #8E8E93; 
          --accent: #AF52DE; 
          --orange: #FF9500; 
        }
        body { 
          font-family: 'Plus Jakarta Sans', sans-serif; 
          background: var(--bg); 
          color: var(--text); 
          margin: 0; 
          padding: 20px; 
        }
        .welcome-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding: 10px 5px; }
        .welcome-header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .welcome-header p { margin: 5px 0 0; color: var(--gray); font-size: 14px; text-transform: capitalize; }
        
        .user-chip { background: white; padding: 5px 12px; border-radius: 50px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 12px; font-weight: 700; border: none; cursor: pointer; }
        
        .grid-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .stat-card { background: var(--pearl); padding: 20px; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-decoration: none; color: inherit; transition: 0.3s; border: 1px solid rgba(0,0,0,0.02); display: block; }
        .stat-card:active { transform: scale(0.95); }
        
        .icon-circle { width: 45px; height: 45px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; font-size: 20px; }
        .bg-blue { background: rgba(0, 122, 255, 0.1); color: var(--primary); }
        .bg-purple { background: rgba(175, 82, 222, 0.1); color: var(--accent); }
        
        .banner-card { background: linear-gradient(135deg, #007AFF, #00C7BE); border-radius: 24px; padding: 25px; color: white; margin-bottom: 25px; position: relative; overflow: hidden; box-shadow: 0 10px 20px rgba(0,122,255,0.2); }
        .banner-card i { position: absolute; right: -20px; bottom: -20px; font-size: 120px; opacity: 0.2; }
        
        .section-title { font-size: 16px; font-weight: 800; margin-bottom: 15px; padding-left: 5px; }
        .action-item { background: var(--pearl); display: flex; align-items: center; padding: 18px; border-radius: 20px; margin-bottom: 12px; text-decoration: none; color: inherit; gap: 15px; border: 1px solid rgba(0,0,0,0.01); }
        .action-item:active { background: #f9f9fb; transform: scale(0.98); }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="welcome-header">
        <div>
          <p>{currentDate}</p>
          <h1>YNS Kitchen 👋</h1>
        </div>
        {user ? (
          <button className="user-chip" onClick={handleLogout}>
            <img src={user.photoURL} alt="pfp" style={{ width: '24px', borderRadius: '50%' }} />
            <span>Logout</span>
          </button>
        ) : (
          <button className="user-chip" onClick={loginWithGoogle}>
            <i className="fab fa-google" style={{ color: '#4285F4' }}></i>
            <span>Login</span>
          </button>
        )}
      </div>

      <div className="banner-card">
        <h2>Special Offer!</h2>
        <p>ယနေ့ မှာယူတဲ့ ဟင်းပွဲတိုင်းအတွက် <br/>10% Discount ရရှိနိုင်ပါတယ်။</p>
        <i className="fas fa-utensils"></i>
      </div>

      <div className="section-title">Main Services</div>
      <div className="grid-menu">
        <Link href="/customer_menu" className="stat-card">
          <div className="icon-circle bg-blue"><i className="fas fa-shopping-basket"></i></div>
          <span>Menu</span>
          <b>ဟင်းပွဲမှာယူရန်</b>
        </Link>
        <Link href="/profile" className="stat-card">
          <div className="icon-circle bg-purple"><i className="fas fa-user-edit"></i></div>
          <span>Profile</span>
          <b>ကိုယ်ရေးအချက်အလက်</b>
        </Link>
      </div>

      <div className="section-title">Support & Feedback</div>
      
      <Link href="/feedback" className="action-item">
        <i className="fas fa-star" style={{ color: '#FFCC00', width: '25px', textAlign: 'center' }}></i>
        <div style={{ flex: 1, fontWeight: 700, fontSize: '14px' }}>Rate our Service</div>
        <i className="fas fa-chevron-right" style={{ color: '#C7C7CC', fontSize: '12px' }}></i>
      </Link>

      <Link href="https://m.me/your_page_link" className="action-item" target="_blank">
        <i className="fab fa-facebook-messenger" style={{ color: '#0084FF', width: '25px', textAlign: 'center' }}></i>
        <div style={{ flex: 1, fontWeight: 700, fontSize: '14px' }}>Contact Support</div>
        <i className="fas fa-external-link-alt" style={{ color: '#C7C7CC', fontSize: '12px' }}></i>
      </Link>

      <Link href="/history" className="action-item">
        <i className="fas fa-history" style={{ color: 'var(--orange)', width: '25px', textAlign: 'center' }}></i>
        <div style={{ flex: 1, fontWeight: 700, fontSize: '14px' }}>Order History</div>
        <i className="fas fa-chevron-right" style={{ color: '#C7C7CC', fontSize: '12px' }}></i>
      </Link>

      <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--gray)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
          YNS KITCHEN • VERSION 2.1.0
      </div>
    </>
  );
}
