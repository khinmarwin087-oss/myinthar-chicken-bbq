"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
// auth ရော provider ရော ပါအောင် import လုပ်ပါ
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, limit, onSnapshot } from "firebase/firestore";
import { 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [popularItems, setPopularItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [lang, setLang] = useState('MM'); // Language Switcher State

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Active Order Tracking Logic
        const qOrder = query(collection(db, "orders"), where("email", "==", currentUser.email), where("status", "in", ["Pending", "Cooking", "Ready"]), limit(1));
        const unsubOrder = onSnapshot(qOrder, (snap) => {
          if (!snap.empty) setActiveOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
          else setActiveOrder(null);
        });
        return () => unsubOrder();
      }
    });

    // Mock Popular Items (Database မရှိသေးခင် ပြရန်)
    setPopularItems([
      { id: 1, name: "Spicy Chicken", price: "4500", img: "🍗" },
      { id: 2, name: "Pork Salad", price: "3800", img: "🥗" },
      { id: 3, name: "Ice Coffee", price: "2500", img: "🍹" }
    ]);

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    if (window.confirm(lang === 'MM' ? "Logout ထွက်မှာ သေချာပါသလား?" : "Are you sure you want to logout?")) {
      try {
        await signOut(auth);
        setShowProfile(false);
      } catch (error) { console.error(error); }
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div className="app-container">
      <style jsx global>{`
        :root { --p: #007AFF; --bg: #F2F2F7; --card: #ffffff; --text: #1C1C1E; --gray: #8E8E93; }
        @media (prefers-color-scheme: dark) {
          :root { --bg: #000000; --card: #1C1C1E; --text: #FFFFFF; --gray: #8E8E93; }
        }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); margin: 0; transition: 0.3s; }
        .app-container { padding: 20px; max-width: 500px; margin: 0 auto; padding-bottom: 100px; }
        
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .pfp-circle { width: 45px; height: 45px; border-radius: 50%; border: 2px solid var(--p); cursor: pointer; object-fit: cover; }
        
        .widget-card { background: var(--card); border-radius: 24px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 20px; }
        .tracking-widget { background: linear-gradient(135deg, #007AFF, #00C7BE); color: white; }
        
        .h-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 5px 0; scrollbar-width: none; }
        .h-scroll::-webkit-scrollbar { display: none; }
        
        .pop-item { min-width: 130px; background: var(--card); border-radius: 20px; padding: 15px; text-align: center; border: 1px solid rgba(0,0,0,0.05); }
        .pop-icon { font-size: 30px; margin-bottom: 10px; }

        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .cat-btn { background: var(--card); padding: 15px 5px; border-radius: 18px; text-align: center; font-size: 11px; font-weight: bold; border: none; color: var(--text); }
        
        /* Modal Style */
        .full-modal { position: fixed; inset: 0; background: var(--bg); z-index: 3000; padding: 30px 20px; display: ${showProfile ? 'block' : 'none'}; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        
        .menu-item { display: flex; align-items: center; gap: 15px; padding: 18px; background: var(--card); border-radius: 20px; margin-bottom: 12px; font-weight: 700; text-decoration: none; color: var(--text); }
        .logout-text { color: #FF3B30 !important; }
      `}</style>

      {/* 1. Header & Profile Dropdown Area */}
      <div className="header">
        <div>
          <h1 style={{margin:0, fontSize: '24px'}}>{lang === 'MM' ? 'မင်္ဂလာပါ' : 'Hello'}, {user ? user.displayName.split(' ')[0] : 'Guest'}</h1>
          <p style={{margin:0, color: 'var(--gray)', fontSize:'14px'}}>{new Date().toLocaleDateString()}</p>
        </div>
        {user ? (
          <img src={user.photoURL} className="pfp-circle" onClick={() => setShowProfile(true)} />
        ) : (
          <button onClick={loginWithGoogle} className="user-chip" style={{padding:'8px 15px', borderRadius:'20px', border:'none', background:'var(--p)', color:'white', fontWeight:'bold'}}>Login</button>
        )}
      </div>

      {/* 2. Active Tracking Widget */}
      {activeOrder ? (
        <div className="widget-card tracking-widget">
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px'}}>
            <b>LIVE TRACKING</b>
            <span>#{activeOrder.id.slice(0,5)}</span>
          </div>
          <h2 style={{margin:'10px 0'}}>ချက်ပြုတ်နေပါပြီ 🍳</h2>
          <div style={{height:6, background:'rgba(255,255,255,0.3)', borderRadius:10}}>
             <div style={{width:'65%', height:'100%', background:'#fff', borderRadius:10}}></div>
          </div>
        </div>
      ) : (
        <div className="widget-card" style={{background: 'linear-gradient(135deg, #FF9500, #FFCC00)', color: 'white'}}>
          <h3 style={{margin:0}}>{lang === 'MM' ? 'ဗိုက်စာနေပြီလား?' : 'Hungry?'}</h3>
          <p style={{fontSize: '14px'}}>{lang === 'MM' ? 'အခုပဲ မှာယူလိုက်ပါ' : 'Order your favorite food now'}</p>
          <Link href="/customer_menu" style={{display:'inline-block', padding:'8px 20px', background:'white', color:'#FF9500', borderRadius:'12px', textDecoration:'none', fontWeight:'bold', fontSize:'13px'}}>Shop Now</Link>
        </div>
      )}

      {/* 3. Popular Items Scroll */}
      <h3 style={{fontSize:'17px', marginBottom:15}}>{lang === 'MM' ? 'လူကြိုက်အများဆုံး' : 'Popular Now'} 🔥</h3>
      <div className="h-scroll">
        {popularItems.map(item => (
          <div key={item.id} className="pop-item">
            <div className="pop-icon">{item.img}</div>
            <div style={{fontSize:'13px', fontWeight:'bold'}}>{item.name}</div>
            <div style={{color:'var(--p)', fontSize:'12px'}}>{item.price} Ks</div>
          </div>
        ))}
      </div>

      {/* 4. Category Grid */}
      <h3 style={{fontSize:'17px', margin:'25px 0 15px'}}>{lang === 'MM' ? 'အမျိုးအစားများ' : 'Categories'} 📂</h3>
      <div className="cat-grid">
        <button className="cat-btn">🍗<br/>Meat</button>
        <button className="cat-btn">🥗<br/>Salad</button>
        <button className="cat-btn">🍹<br/>Drinks</button>
        <button className="cat-btn">🍜<br/>Noodle</button>
      </div>

      {/* 5. Quick Action Button (အရမ်းကြီးမနေအောင် အောက်မှာပဲထားပါတယ်) */}
      <Link href="/customer_menu" className="menu-item" style={{marginTop:30, border:'2px solid var(--p)'}}>
        <span style={{fontSize:20}}>🛒</span>
        <div style={{flex:1}}>
          <b>{lang === 'MM' ? 'ဟင်းပွဲမှာယူရန်' : 'Go to Menu'}</b>
          <br/><small style={{color:'var(--gray)'}}>Explore 50+ dishes</small>
        </div>
        <i className="fas fa-arrow-right" style={{color:'var(--p)'}}></i>
      </Link>

      {/* Profile Modal (All-in-one Menu) */}
      <div className="full-modal">
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:30}}>
          <button onClick={() => setShowProfile(false)} style={{border:'none', background:'none', fontSize:20}}><i className="fas fa-times"></i></button>
          <button onClick={() => setLang(lang === 'MM' ? 'EN' : 'MM')} style={{background:'var(--p)', color:'white', border:'none', padding:'5px 15px', borderRadius:10, fontWeight:'bold'}}>{lang}</button>
        </div>
        
        {user && (
          <div style={{textAlign:'center', marginBottom:30}}>
            <img src={user.photoURL} style={{width:80, borderRadius:50, marginBottom:10}} />
            <h2 style={{margin:0}}>{user.displayName}</h2>
            <p style={{color:'var(--gray)'}}>{user.email}</p>
          </div>
        )}

        <Link href="/history" className="menu-item"><i className="fas fa-clock-rotate-left" style={{color:'#FF9500'}}></i> {lang === 'MM' ? 'မှာယူခဲ့သည့်မှတ်တမ်း' : 'Order History'}</Link>
        <Link href="/profile" className="menu-item"><i className="fas fa-user-circle" style={{color:'var(--p)'}}></i> {lang === 'MM' ? 'ကိုယ်ရေးအချက်အလက်' : 'My Profile'}</Link>
        <Link href="https://m.me/yourpage" className="menu-item"><i className="fab fa-facebook-messenger" style={{color:'#0084FF'}}></i> {lang === 'MM' ? 'အကူအညီတောင်းရန်' : 'Contact Support'}</Link>
        
        <div className="menu-item logout-text" onClick={handleLogout} style={{cursor:'pointer'}}>
          <i className="fas fa-right-from-bracket"></i> {lang === 'MM' ? 'အကောင့်မှထွက်ရန်' : 'Logout'}
        </div>
      </div>
    </div>
  );

  async function loginWithGoogle() {
    try { await signInWithRedirect(auth, provider); } catch (e) { alert(e.code); }
  }
}

function SkeletonLoader() {
  return (
    <div style={{padding:20}}>
      <div style={{height:40, width:150, background:'#eee', borderRadius:10, marginBottom:20}}></div>
      <div style={{height:180, width:'100%', background:'#eee', borderRadius:24, marginBottom:25}}></div>
      <div style={{display:'flex', gap:15}}>
        <div style={{height:130, width:120, background:'#eee', borderRadius:20}}></div>
        <div style={{height:130, width:120, background:'#eee', borderRadius:20}}></div>
      </div>
    </div>
  );
        }
      
