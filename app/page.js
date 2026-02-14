"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // ပိုမိုအသေးစိတ်သော Order Tracker (Live Monitoring)
        const qOrder = query(collection(db, "orders"), where("email", "==", currentUser.email), where("status", "in", ["Pending", "Cooking", "Ready", "On the way"]), limit(1));
        onSnapshot(qOrder, (snap) => {
          if (!snap.empty) setActiveOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
          else setActiveOrder(null);
        });
      }
    });

    // အပြင်ကိုနှိပ်ရင် Dropdown ပိတ်ဖို့
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      unsubscribeAuth();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Logout ထွက်မှာ သေချာပါသလား?")) {
      await signOut(auth);
      setShowDropdown(false);
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div className="main-wrapper">
      <style jsx global>{`
        :root { --p: #007AFF; --bg: #F8F9FB; --card: #ffffff; --text: #1C1C1E; --gray: #8E8E93; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); margin: 0; }
        .main-wrapper { padding: 25px 20px; max-width: 500px; margin: 0 auto; }

        /* Premium Minimalist Header */
        .premium-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .user-meta h2 { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .date-chip { background: #fff; padding: 4px 12px; border-radius: 50px; font-size: 11px; font-weight: 800; color: var(--p); box-shadow: 0 4px 10px rgba(0,122,255,0.1); text-transform: uppercase; }

        /* Search Bar Widget */
        .search-box { background: #fff; display: flex; align-items: center; padding: 15px 20px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 25px; border: 1px solid rgba(0,0,0,0.02); }
        .search-box input { border: none; outline: none; margin-left: 12px; font-weight: 600; width: 100%; color: var(--text); }

        /* Detail Order Tracker */
        .live-tracker { background: #1C1C1E; border-radius: 30px; padding: 25px; color: #fff; margin-bottom: 25px; position: relative; overflow: hidden; }
        .tracker-info { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .step-container { display: flex; justify-content: space-between; margin-top: 15px; position: relative; }
        .step { width: 22%; text-align: center; font-size: 9px; opacity: 0.5; transition: 0.3s; }
        .step.active { opacity: 1; font-weight: bold; }
        .progress-line { height: 4px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 10px; position: relative; }
        .progress-fill { height: 100%; background: var(--p); border-radius: 10px; transition: 1s ease; }

        /* Dropdown Menu */
        .profile-container { position: relative; }
        .pfp-btn { width: 48px; height: 48px; border-radius: 16px; border: 3px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.1); cursor: pointer; }
        .dropdown-menu { position: absolute; top: 60px; right: 0; width: 220px; background: #fff; border-radius: 22px; padding: 10px; box-shadow: 0 15px 40px rgba(0,0,0,0.12); z-index: 100; border: 1px solid rgba(0,0,0,0.05); animation: pop 0.2s ease-out; }
        @keyframes pop { from { opacity: 0; transform: scale(0.9) translateY(-10px); } }
        .drop-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 15px; text-decoration: none; color: var(--text); font-size: 13px; font-weight: 700; transition: 0.2s; }
        .drop-item:active { background: var(--bg); }
      `}</style>

      {/* 1. Header Area */}
      <div className="premium-header">
        <div className="user-meta">
          <span className="date-chip">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
          <h2 style={{marginTop: '8px'}}>Hey, {user ? user.displayName.split(' ')[0] : 'Guest'} 👋</h2>
        </div>
        
        <div className="profile-container" ref={dropdownRef}>
          {user ? (
            <img src={user.photoURL} className="pfp-btn" onClick={() => setShowDropdown(!showDropdown)} />
          ) : (
            <button onClick={() => signInWithRedirect(auth, provider)} className="date-chip" style={{border: 'none', cursor: 'pointer'}}>Login</button>
          )}

          {showDropdown && user && (
            <div className="dropdown-menu">
              <div style={{padding: '10px 14px', borderBottom: '1px solid #eee', marginBottom: '5px'}}>
                <b style={{fontSize: '14px'}}>{user.displayName}</b>
                <div style={{fontSize: '11px', color: 'var(--gray)'}}>{user.email}</div>
              </div>
              <Link href="/history" className="drop-item"><i className="fas fa-history" style={{color: 'orange'}}></i> My Orders</Link>
              <Link href="/profile" className="drop-item"><i className="fas fa-user-circle" style={{color: 'var(--p)'}}></i> Profile Settings</Link>
              <div className="drop-item" onClick={handleLogout} style={{color: '#FF3B30'}}><i className="fas fa-sign-out-alt"></i> Logout</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Search Tracker Widget */}
      <div className="search-box">
        <i className="fas fa-search" style={{color: 'var(--gray)'}}></i>
        <input type="text" placeholder="အရသာရှိတာလေးတွေ ရှာကြည့်ပါ..." />
      </div>

      {/* 3. Detailed Live Order Tracker */}
      {activeOrder ? (
        <div className="live-tracker">
          <div className="tracker-info">
            <div>
              <b style={{fontSize: '18px'}}>{activeOrder.status === 'Ready' ? 'ချက်ပြုတ်ပြီးပါပြီ' : 'ချက်ပြုတ်နေပါပြီ'}</b>
              <p style={{margin: '5px 0 0', fontSize: '12px', opacity: 0.7}}>အော်ဒါနံပါတ်: #{activeOrder.id.slice(0, 8)}</p>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontSize: '20px'}}>👨‍🍳</div>
            </div>
          </div>

          <div className="progress-line">
            <div className="progress-fill" style={{ width: 
              activeOrder.status === 'Pending' ? '10%' : 
              activeOrder.status === 'Cooking' ? '40%' : 
              activeOrder.status === 'Ready' ? '75%' : '100%' 
            }}></div>
          </div>

          <div className="step-container">
            <div className={`step ${activeOrder.status === 'Pending' ? 'active' : ''}`}>တင်ပြီး</div>
            <div className={`step ${activeOrder.status === 'Cooking' ? 'active' : ''}`}>ချက်နေ</div>
            <div className={`step ${activeOrder.status === 'Ready' ? 'active' : ''}`}>အဆင်သင့်</div>
            <div className={`step ${activeOrder.status === 'On the way' ? 'active' : ''}`}>ပို့နေပြီ</div>
          </div>
        </div>
      ) : (
        <div className="live-tracker" style={{background: 'linear-gradient(135deg, #007AFF, #00C7BE)'}}>
           <h3>ယနေ့အတွက် ဘာမှာမလဲ?</h3>
           <p style={{fontSize: '13px', opacity: 0.9}}>အရသာအကောင်းဆုံး ဟင်းပွဲများကို အခုပဲ မှာယူလိုက်ပါ။</p>
        </div>
      )}

      {/* 4. Quick Shortcuts (Category နေရာမှာ အစားထိုးခြင်း) */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
        <Link href="/customer_menu" className="action-item" style={{background: '#fff', padding: '20px', borderRadius: '25px', textDecoration: 'none', color: 'inherit'}}>
          <div style={{width: '45px', height: '45px', background: '#E6F2FF', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px'}}>🛒</div>
          <b>Menu သို့သွားရန်</b>
          <p style={{fontSize: '11px', color: 'var(--gray)', margin: '5px 0 0'}}>ဟင်းပွဲ ၅၀ ကျော်ရှိပါသည်</p>
        </Link>

        <Link href="/feedback" className="action-item" style={{background: '#fff', padding: '20px', borderRadius: '25px', textDecoration: 'none', color: 'inherit'}}>
          <div style={{width: '45px', height: '45px', background: '#FFF2F2', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px'}}>⭐</div>
          <b>သုံးသပ်ချက်ပေးရန်</b>
          <p style={{fontSize: '11px', color: 'var(--gray)', margin: '5px 0 0'}}>Rate our service</p>
        </Link>
      </div>

      <div style={{marginTop: '30px'}}>
         <Link href="https://m.me/yourpage" className="search-box" style={{textDecoration: 'none', color: 'inherit'}}>
            <i className="fab fa-facebook-messenger" style={{color: '#0084FF', fontSize: '20px'}}></i>
            <span style={{marginLeft: '15px', fontWeight: 700}}>Contact Support</span>
         </Link>
      </div>

      <div style={{textAlign: 'center', marginTop: '40px', color: 'var(--gray)', fontSize: '10px', fontWeight: 700}}>
          YNS KITCHEN • PREMIUM VERSION 3.0
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return <div style={{padding: '40px', textAlign: 'center'}}>Premium UI Loading...</div>;
        }
