"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { auth, provider } from "../lib/firebase"; 
import { 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

export default function Home() {
  const [currentDate, setCurrentDate] = useState("Loading date...");
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false); // Menu ပွင့်/ပိတ် အတွက်
  const menuRef = useRef(null); // အပြင်ကနေနှိပ်ရင် Menu ပိတ်ဖို့

  useEffect(() => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setUser(result.user);
          localStorage.setItem('myDeviceUID', result.user.uid);
        }
      } catch (error) { console.error("Redirect Error:", error); }
    };
    checkRedirect();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('myDeviceUID', currentUser.uid);
      } else {
        setUser(null);
      }
    });

    // Menu ပွင့်နေတုန်း အပြင်ကနေနှိပ်ရင် Menu ကို ပြန်ပိတ်ပေးမယ့် Logic
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loginWithGoogle = async () => {
    try { await signInWithRedirect(auth, provider); } 
    catch (error) { alert("Error: " + error.code); }
  };

  const handleLogout = async () => {
    if (window.confirm("Logout ထွက်မှာ သေချာပါသလား?")) {
      try {
        await signOut(auth);
        setUser(null);
        setShowMenu(false);
      } catch (error) { console.error("Logout failed:", error); }
    }
  };

  return (
    <>
      <style jsx global>{`
        :root { 
          --pearl: #ffffff; --bg: #F2F2F7; --primary: #007AFF; 
          --text: #1C1C1E; --gray: #8E8E93; --accent: #AF52DE; --orange: #FF9500; 
        }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
        
        /* Header & Chip */
        .welcome-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding: 10px 5px; position: relative; }
        .welcome-header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .welcome-header p { margin: 5px 0 0; color: var(--gray); font-size: 14px; text-transform: capitalize; }
        .user-chip { background: white; padding: 5px 12px; border-radius: 50px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: 0.2s; }
        .user-chip:active { transform: scale(0.95); }

        /* Premium Profile Menu */
        .profile-menu { 
          position: absolute; top: 55px; right: 0; width: 220px; 
          background: white; border-radius: 20px; padding: 15px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000;
          animation: slideIn 0.3s ease-out;
          border: 1px solid rgba(0,0,0,0.05);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .menu-user-info { text-align: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #f2f2f7; }
        .menu-user-info img { width: 45px; height: 45px; border-radius: 50%; margin-bottom: 8px; border: 2px solid var(--primary); }
        .menu-user-info b { display: block; font-size: 14px; color: var(--text); }
        .menu-user-info span { font-size: 11px; color: var(--gray); }

        .menu-item { 
          display: flex; align-items: center; gap: 12px; padding: 12px; 
          border-radius: 12px; text-decoration: none; color: var(--text); 
          font-size: 13px; font-weight: 600; transition: 0.2s;
        }
        .menu-item:active { background: #f2f2f7; }
        .menu-item i { width: 18px; text-align: center; font-size: 14px; }
        .logout-btn { color: #FF3B30; margin-top: 5px; cursor: pointer; }

        /* Existing Grid & Cards */
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
        
        <div ref={menuRef}>
          {user ? (
            <>
              <button className="user-chip" onClick={() => setShowMenu(!showMenu)}>
                <img src={user.photoURL} alt="pfp" style={{ width: '24px', borderRadius: '50%' }} />
                <span>{user.displayName.split(' ')[0]}</span>
                <i className={`fas fa-chevron-${showMenu ? 'up' : 'down'}`} style={{fontSize: '10px', color: '#ccc'}}></i>
              </button>

              {/* Profile Menu Dropdown */}
              {showMenu && (
                <div className="profile-menu">
                  <div className="menu-user-info">
                    <img src={user.photoURL} alt="pfp" />
                    <b>{user.displayName}</b>
                    <span>{user.email}</span>
                  </div>
                  
                  <Link href="/profile" className="menu-item">
                    <i className="fas fa-user-circle" style={{color: 'var(--accent)'}}></i>
                    Edit Profile
                  </Link>
                  
                  <Link href="/history" className="menu-item">
                    <i className="fas fa-clock-rotate-left" style={{color: 'var(--orange)'}}></i>
                    Order History
                  </Link>

                  <div className="menu-item logout-btn" onClick={handleLogout}>
                    <i className="fas fa-right-from-bracket"></i>
                    Logout
                  </div>
                </div>
              )}
            </>
          ) : (
            <button className="user-chip" onClick={loginWithGoogle}>
              <i className="fab fa-google" style={{ color: '#4285F4' }}></i>
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner */}
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
        {/* Profile Card ကို Grid ထဲမှာ မထားချင်တော့ရင် ဒီကနေ ဖြုတ်နိုင်ပါတယ် (Menu ထဲမှာ ပါပြီးသားမို့လို့ပါ) */}
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

      {/* History Card ကိုလည်း Menu ထဲမှာ ပါပြီးသားဖြစ်လို့ ဒီမှာ ထားချင်သေးရင် ထားနိုင်ပါတယ် */}
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
                
