"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, getDocs, limit, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true); 
  
  const [trackID, setTrackID] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [lastActiveOrder, setLastActiveOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }));
    
    // Dropdown အပြင်နှိပ်ရင် ပိတ်ရန်
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const q = query(collection(db, "orders"), where("email", "==", u.email));
        const unsubOrders = onSnapshot(q, (snap) => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
          
          setRecentOrders(list.slice(0, 3));
          const active = list.find(o => ['pending', 'New', 'Cooking', 'Ready'].includes(o.status));
          setLastActiveOrder(active || null);
          setTimeout(() => setIsSyncing(false), 4000);
        });
        return () => unsubOrders();
      } else {
        setIsSyncing(false);
      }
    });
    return () => {
      unsubAuth();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTrackOrder = async () => {
    const rawInput = trackID.trim();
    if (!rawInput) return;
    setSearchLoading(true);
    setHasSearched(true);
    let finalID = rawInput.toUpperCase();
    if (/^\d+$/.test(rawInput)) finalID = `ORD-${rawInput}`;
    else if (!finalID.startsWith('ORD-')) finalID = `ORD-${finalID}`;

    try {
      const q = query(collection(db, "orders"), where("orderId", "==", finalID), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) setSearchedOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setSearchedOrder(null);
    } catch (e) { console.error(e); } 
    finally { setSearchLoading(false); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowLogoutConfirm(false);
    setShowProfileMenu(false);
  };

  const OrderView = ({ order, title }) => (
    <div className="fade-in">
        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:800, opacity:0.8}}>
            <span>{title || order.status.toUpperCase()}</span>
            <span>#{order.orderId}</span>
        </div>
        <h2 style={{fontSize: 26, margin: '10px 0'}}>
            {['New', 'pending'].includes(order.status) ? 'Received 📝' : 
             order.status === 'Cooking' ? 'Cooking 👨‍🍳' : 
             order.status === 'Ready' ? 'Ready 🥡' : 'Success ✅'}
        </h2>
        {order.status === 'Ready' && (
            <div style={{background:'#fff', color:'#005BEA', padding:'8px 15px', borderRadius:15, fontSize:12, fontWeight:800, marginBottom:15, textAlign:'center'}}>
                🎉 ဆိုင်မှာ လာယူလို့ရပါပြီခင်ဗျာ။
            </div>
        )}
        <div className="progress-line"><div className="progress-fill" style={{ width: ['New', 'pending'].includes(order.status) ? '25%' : order.status === 'Cooking' ? '55%' : order.status === 'Ready' ? '85%' : '100%' }}></div></div>
        <div className="details-box">
            {order.items?.map((item, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4}}>
                    <span>{item.name || item.itemName} x {item.quantity || item.qty}</span>
                    <span>{((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()} K</span>
                </div>
            ))}
            <div style={{textAlign:'right', borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:10, paddingTop:8, fontWeight:800, fontSize:18}}>
                Total: {Number(order.totalPrice).toLocaleString()} Ks
            </div>
        </div>
    </div>
  );

  if (loading) return <div className="loader">YNS Kitchen Loading...</div>;

  return (
    <div className="main-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{`
        :root { --p: #007AFF; --bg: #F8F9FA; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
        .main-wrapper { padding: 20px; max-width: 500px; margin: 0 auto; }
        .tracker-card { background: linear-gradient(135deg, #00C6FB 0%, #005BEA 100%); border-radius: 35px; padding: 25px; color: #fff; min-height: 250px; margin-bottom: 30px; box-shadow: 0 20px 40px -10px rgba(0, 91, 234, 0.4); }
        .dropdown-menu { position: absolute; right: 0; top: 55px; background: #fff; border-radius: 20px; width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000; padding: 8px; border: 1px solid #eee; }
        .dropdown-item { padding: 12px 15px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: #444; }
        .dropdown-item:hover { background: #F2F2F7; }
        .inner-search { background: rgba(255,255,255,0.2); border-radius: 18px; padding: 10px 15px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; }
        .inner-search input { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-weight: 700; }
        .history-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 30px; }
        .history-item { background: #fff; padding: 15px 10px; border-radius: 20px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.03); }
        .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
        .confirm-card { background: #fff; padding: 25px; border-radius: 28px; width: 100%; max-width: 300px; text-align: center; }
        .food-emoji { font-size: 45px; animation: bounce 2s infinite ease-in-out; display: inline-block; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {!user ? (
        <div className="login-wrap fade-in">
          <style>{`
            .login-wrap { height: 95vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
            .avatar-box { font-size: 60px; margin-bottom: 20px; animation: walkIn 3s ease-out forwards; display: inline-block; }
            @keyframes walkIn { 0% { transform: translateX(-50px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
            .wave { display: inline-block; animation: waveHand 1.5s infinite 3s; transform-origin: 70% 70%; }
            @keyframes waveHand { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(20deg); } }
            .login-card { background: #fff; padding: 40px 25px; border-radius: 30px; width: 100%; max-width: 340px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); text-align: center; }
            .google-btn { width: 100%; background: #1c1c1e; color: #fff; border: none; padding: 16px; border-radius: 18px; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; }
          `}</style>
          <div className="avatar-box">🚶‍♂️<span className="wave">👋</span></div>
          <h1 style={{fontSize:30, fontWeight:800, margin:0}}>YNS Kitchen</h1>
          <p style={{color:'#8e8e93', fontSize:14, marginBottom:40}}>The standard of home-cooked taste</p>
          <div className="login-card">
            <h2 style={{fontSize:19, fontWeight:700, marginBottom:8}}>Welcome back</h2>
            <p style={{fontSize:14, color:'#636366', marginBottom:30}}>Please sign in to continue</p>
            <button className="google-btn" onClick={() => signInWithPopup(auth, provider)}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="g" />
              Continue with Google
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, position:'relative'}}>
            <div>
              <span style={{fontSize:11, fontWeight:800, color: 'var(--p)'}}>{currentDate}</span>
              <h2 style={{margin:0, fontSize:22, fontWeight: 800}}>Hello, {user.displayName?.split(' ')[0]}!</h2>
            </div>
            <div ref={dropdownRef} style={{position:'relative'}}>
                <img src={user.photoURL} onClick={() => setShowProfileMenu(!showProfileMenu)} style={{width:45, height:45, borderRadius:15, border: '2px solid #fff', cursor:'pointer', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}} />
                {showProfileMenu && (
                    <div className="dropdown-menu fade-in">
                        <Link href="/history" style={{textDecoration:'none'}}><div className="dropdown-item"><i className="fas fa-list"></i> My Orders</div></Link>
                        <div className="dropdown-item" onClick={() => setShowLogoutConfirm(true)} style={{color:'#FF3B30'}}><i className="fas fa-sign-out-alt"></i> Logout</div>
                    </div>
                )}
            </div>
          </div>

          <div className="tracker-card">
            <div className="inner-search">
                <i className="fas fa-search" style={{marginRight: 10, opacity: 0.5}}></i>
                <input type="text" placeholder="Track Order ID..." value={trackID} onChange={(e) => setTrackID(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}/>
            </div>
            {isSyncing ? (
                <div style={{textAlign:'center', padding:20}}><div className="food-emoji">🥡</div><p style={{fontWeight: 700, marginTop: 15}}>Syncing Data...</p></div>
            ) : hasSearched ? (
                searchedOrder ? <OrderView order={searchedOrder} title="SEARCH RESULT" /> : <div style={{textAlign:'center', padding:20}}>အော်ဒါရှာမတွေ့ပါ ❌</div>
            ) : lastActiveOrder ? (
                <OrderView order={lastActiveOrder} title="CURRENT ORDER" />
            ) : (
                <div style={{textAlign:'center', padding:10}}><div className="food-emoji">🍱</div><h3 style={{marginTop: 15, fontSize:18}}>No Active Order</h3><p style={{fontSize:12, opacity:0.8}}>စားချင်တာလေးတွေ မှာလိုက်တော့နော်</p></div>
            )}
          </div>

          {recentOrders.length > 0 && (
              <div className="fade-in">
                  <h4 style={{fontSize: 12, fontWeight: 800, color: '#8E8E93', marginBottom: 12}}>RECENT HISTORY</h4>
                  <div className="history-grid">
                      {recentOrders.map((order, idx) => (
                          <div key={idx} className="history-item">
                              <div style={{fontSize:20, marginBottom:5}}>🍲</div>
                              <div style={{fontSize:10, fontWeight:800, color:'#8E8E93'}}>#{order.orderId?.split('-')[1] || order.orderId}</div>
                              <div style={{fontSize:11, fontWeight:700, margin:'4px 0'}}>{Number(order.totalPrice).toLocaleString()} K</div>
                              <div style={{fontSize:9, color: order.status === 'Success' ? '#34C759' : '#007AFF', fontWeight:800}}>{order.status}</div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
            <Link href="/customer_menu" style={{textDecoration:'none', background:'#fff', padding:22, borderRadius:25, textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.02)'}}>
                <div style={{fontSize: 24, marginBottom: 8}}>🛒</div><b style={{fontSize: 14, color:'#000'}}>Order Now</b>
            </Link>
            <Link href="/history" style={{textDecoration:'none', background:'#fff', padding:22, borderRadius:25, textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.02)'}}>
                <div style={{fontSize: 24, marginBottom: 8}}>📋</div><b style={{fontSize: 14, color:'#000'}}>All History</b>
            </Link>
          </div>
        </>
      )}

      {showLogoutConfirm && (
          <div className="confirm-overlay">
              <div className="confirm-card fade-in">
                  <div style={{fontSize:40, marginBottom:15}}>👋</div>
                  <h3>Logout?</h3>
                  <p style={{fontSize:13, color:'#8E8E93', marginBottom:20}}>အကောင့်ထဲမှ ထွက်ခွာမှာ သေချာပါသလား။</p>
                  <div style={{display:'flex', gap:10}}>
                      <button onClick={() => setShowLogoutConfirm(false)} style={{flex:1, padding:15, borderRadius:15, border:'none', background:'#F2F2F7', fontWeight:700}}>မထွက်ဘူး</button>
                      <button onClick={handleLogout} style={{flex:1, padding:15, borderRadius:15, border:'none', background:'#FF3B30', color:'#fff', fontWeight:700}}>ထွက်မယ်</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
          }
                  
