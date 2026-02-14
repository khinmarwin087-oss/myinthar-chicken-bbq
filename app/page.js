"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, limit, onSnapshot, orderBy } from "firebase/firestore";
import { signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [popularItems, setPopularItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // ၁။ လက်ရှိ အော်ဒါအခြေအနေကို စစ်ဆေးရန် (Active Order Tracking)
        const qOrder = query(collection(db, "orders"), where("email", "==", currentUser.email), where("status", "in", ["Pending", "Cooking", "Ready"]), limit(1));
        onSnapshot(qOrder, (snap) => {
          if (!snap.empty) setActiveOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
          else setActiveOrder(null);
        });

        // ၂။ အရင်မှာဖူးတဲ့ ဟင်းပွဲများ (Quick Re-order)
        const qRecent = query(collection(db, "orders"), where("email", "==", currentUser.email), limit(5));
        onSnapshot(qRecent, (snap) => {
          let items = [];
          snap.docs.forEach(doc => items.push(...doc.data().items));
          setRecentItems(items.slice(0, 4));
        });
      }
    });

    // ၃။ လူကြိုက်အများဆုံး ဟင်းပွဲများ (Popular Items)
    const qPop = query(collection(db, "menu"), limit(5));
    onSnapshot(qPop, (snap) => {
      setPopularItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Logout ထွက်မှာ သေချာပါသလား?")) {
      await signOut(auth);
      setShowProfileModal(false);
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div className="dashboard-container">
      <style jsx global>{`
        :root { --p: #007AFF; --bg: #F8F9FB; --card: #ffffff; --text: #1C1C1E; --gray: #8E8E93; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); margin: 0; }
        .dashboard-container { padding: 20px 20px 40px 20px; max-width: 500px; margin: 0 auto; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .pfp { width: 45px; height: 45px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer; }
        
        /* Active Order Tracking Widget */
        .tracking-card { background: linear-gradient(135deg, #007AFF, #00C7BE); border-radius: 28px; padding: 20px; color: white; margin-bottom: 25px; position: relative; overflow: hidden; }
        .status-badge { background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 50px; font-size: 11px; font-weight: bold; }
        
        /* Horizontal Scroll Sections */
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-weight: 800; font-size: 17px; }
        .h-scroll { display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .h-scroll::-webkit-scrollbar { display: none; }
        
        .pop-card { min-width: 140px; background: var(--card); border-radius: 20px; padding: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .pop-card img { width: 100%; height: 100px; border-radius: 15px; object-fit: cover; }
        
        /* Categories Grid */
        .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
        .cat-item { text-align: center; font-size: 11px; font-weight: 700; }
        .cat-icon { height: 60px; background: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; font-size: 22px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }

        /* Profile Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px); }
        .profile-modal { background: white; width: 100%; max-width: 320px; border-radius: 30px; padding: 25px; position: relative; }
        .modal-item { display: flex; align-items: center; gap: 15px; padding: 15px; border-radius: 15px; text-decoration: none; color: #1c1c1e; font-weight: 700; margin-bottom: 5px; background: #F8F9FB; }
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <h2 style={{margin:0, fontSize:'22px'}}>YNS Kitchen</h2>
          <p style={{margin:0, color:'var(--gray)', fontSize:'13px'}}>{new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', weekday:'short'})}</p>
        </div>
        {user ? (
          <img src={user.photoURL} className="pfp" onClick={() => setShowProfileModal(true)} />
        ) : (
          <button onClick={() => signInWithRedirect(auth, provider)} style={{border:'none', background:'#007AFF', color:'#fff', padding:'10px 20px', borderRadius:'15px', fontWeight:'bold'}}>Login</button>
        )}
      </div>

      {/* 1. Active Order Tracking (မှာထားတာရှိရင် ပေါ်မည်) */}
      {activeOrder && (
        <div className="tracking-card">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
            <span className="status-badge">LIVE TRACKING</span>
            <span style={{fontSize:'12px'}}>{activeOrder.orderId}</span>
          </div>
          <h3 style={{margin:0}}>ဟင်းချက်နေပါပြီ 👨‍🍳</h3>
          <p style={{fontSize:'13px', opacity:0.8}}>နောက် ၁၅ မိနစ်ခန့်တွင် အဆင်သင့်ဖြစ်ပါမည်</p>
          <div style={{height:'6px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', marginTop:'15px'}}>
            <div style={{width:'60%', height:'100%', background:'#fff', borderRadius:'10px'}}></div>
          </div>
        </div>
      )}

      {/* 2. Popular Items (Horizontal Scroll) */}
      <div className="section-header">Popular Items 🔥</div>
      <div className="h-scroll">
        {popularItems.map(item => (
          <div key={item.id} className="pop-card">
            <img src={item.image} />
            <div style={{fontSize:'13px', fontWeight:'bold', marginTop:'8px'}}>{item.name}</div>
            <div style={{color:'var(--p)', fontSize:'12px', fontWeight:'800'}}>{item.price} Ks</div>
          </div>
        ))}
      </div>

      {/* 3. Categories Grid */}
      <div className="section-header" style={{marginTop:'25px'}}>Categories 📂</div>
      <div className="cat-grid">
        <div className="cat-item"><div className="cat-icon" style={{color:'#FF9500'}}>🍗</div>အသားဟင်း</div>
        <div className="cat-item"><div className="cat-icon" style={{color:'#34C759'}}>🥗</div>အသုပ်</div>
        <div className="cat-item"><div className="cat-icon" style={{color:'#5856D6'}}>🍜</div>ခေါက်ဆွဲ</div>
        <div className="cat-item"><div className="cat-icon" style={{color:'#FF2D55'}}>🍹</div>ဖျော်ရည်</div>
      </div>

      {/* 4. Quick Re-order (အရင်မှာဖူးတာရှိရင် ပေါ်မည်) */}
      {recentItems.length > 0 && (
        <>
          <div className="section-header">Quick Re-order 🔄</div>
          <div className="h-scroll">
            {recentItems.map((item, idx) => (
              <div key={idx} className="pop-card" style={{minWidth:'120px', border:'1px dashed #ccc', background:'transparent'}}>
                 <div style={{fontSize:'12px', fontWeight:'bold'}}>{item.name}</div>
                 <button style={{marginTop:'10px', width:'100%', background:'#fff', border:'1px solid #eee', borderRadius:'8px', fontSize:'10px', padding:'5px'}}>Re-order</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 5. Main Buttons (Dashboard ပေါ်မှာပဲ လှလှပပ ဖြန့်ထားခြင်း) */}
      <div style={{marginTop:'30px', display:'grid', gap:'15px'}}>
        <Link href="/customer_menu" className="modal-item" style={{background:'white', border:'1px solid #eee'}}>
           <div style={{width:'40px', height:'40px', background:'#E6F2FF', borderRadius:'12px', display:'flex', alignItems:'center', justifyCenter:'center', fontSize:'20px'}}>🛒</div>
           <div style={{flex:1}}><b>မှာယူရန်သွားမည်</b><br/><small style={{color:'var(--gray)'}}>Explore full menu</small></div>
           <i className="fas fa-chevron-right" style={{color:'#ccc'}}></i>
        </Link>
      </div>

      {/* Profile Modal (All-in-one Menu) */}
      {showProfileModal && user && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <img src={user.photoURL} style={{width:'70px', borderRadius:'50%', border:'4px solid #E6F2FF'}} />
              <h3 style={{margin:'10px 0 0 0'}}>{user.displayName}</h3>
              <p style={{margin:0, color:'var(--gray)', fontSize:'12px'}}>{user.email}</p>
            </div>
            
            <Link href="/history" className="modal-item"><i className="fas fa-history" style={{color:'#FF9500'}}></i> My Orders</Link>
            <Link href="/profile" className="modal-item"><i className="fas fa-user-edit" style={{color:'#007AFF'}}></i> Profile Settings</Link>
            <div className="modal-item"><i className="fas fa-language" style={{color:'#34C759'}}></i> Language (MM/EN)</div>
            <Link href="/support" className="modal-item"><i className="fas fa-headset" style={{color:'#AF52DE'}}></i> Contact Support</Link>
            
            <button onClick={handleLogout} className="modal-item" style={{width:'100%', border:'none', color:'#FF3B30', marginTop:'15px', background:'#FFF2F2'}}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      )}

      <div style={{textAlign:'center', marginTop:'40px', color:'var(--gray)', fontSize:'10px', fontWeight:700}}>YNS KITCHEN • V 2.1.0</div>
    </div>
  );
}

// Skeleton Loader Component
function SkeletonLoader() {
  return (
    <div style={{padding:'20px'}}>
      <div style={{height:'30px', width:'150px', background:'#eee', borderRadius:'10px', marginBottom:'20px'}} className="skeleton"></div>
      <div style={{height:'180px', width:'100%', background:'#eee', borderRadius:'28px', marginBottom:'25px'}} className="skeleton"></div>
      <div style={{display:'flex', gap:'15px'}}>
        <div style={{height:'150px', width:'130px', background:'#eee', borderRadius:'20px'}} className="skeleton"></div>
        <div style={{height:'150px', width:'130px', background:'#eee', borderRadius:'20px'}} className="skeleton"></div>
      </div>
      <style>{`
        .skeleton { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
        }
        
