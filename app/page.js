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
  
  const [trackID, setTrackID] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [lastActiveOrder, setLastActiveOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }));
    
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        const q = query(collection(db, "orders"), where("email", "==", u.email));
        const unsubOrders = onSnapshot(q, (snap) => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
          
          const active = list.find(o => ['pending', 'New', 'Cooking', 'Ready'].includes(o.status));

          // Logic: Ready ဖြစ်သွားရင် ၁၀ စက္ကန့်ပဲပြမယ်
          if (active && active.status === 'Ready') {
            setLastActiveOrder(active);
            setTimeout(() => {
              setLastActiveOrder(null);
            }, 10000); // 10 seconds
          } else {
            setLastActiveOrder(active || null);
          }
        });
        return () => unsubOrders();
      }
    });
    return () => unsubAuth();
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

  const handleLogin = () => signInWithPopup(auth, provider);
  const handleLogout = () => { signOut(auth); setShowLogoutConfirm(false); };

  const OrderView = ({ order, title }) => (
    <div className="fade-in">
        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, fontWeight:800, opacity:0.8}}>
            <span>{title || order.status.toUpperCase()}</span>
            <span>#{order.orderId}</span>
        </div>
        <h2 style={{fontSize: 28, margin: '12px 0'}}>
            {['New', 'pending'].includes(order.status) ? 'Received 📝' : 
             order.status === 'Cooking' ? 'Cooking 👨‍🍳' : 
             order.status === 'Ready' ? 'Ready 🥡' : 'Success ✅'}
        </h2>
        <div className="progress-line"><div className="progress-fill" style={{ width: ['New', 'pending'].includes(order.status) ? '25%' : order.status === 'Cooking' ? '55%' : order.status === 'Ready' ? '85%' : '100%' }}></div></div>
        <div className="details-box">
            {order.items?.map((item, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 14, marginBottom: 5}}>
                    <span>{item.name || item.itemName} x {item.quantity || item.qty}</span>
                    <span>{((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()} Ks</span>
                </div>
            ))}
            <div style={{textAlign:'right', borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:10, paddingTop:8, fontWeight:800, fontSize:18}}>
                Total: {Number(order.totalPrice).toLocaleString()} Ks
            </div>
        </div>
    </div>
  );

  if (loading) return <div className="loader">YNS Kitchen...</div>;

  return (
    <div className="main-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        :root { --p: #007AFF; --bg: #F2F2F7; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
        .main-wrapper { padding: 25px 20px; max-width: 500px; margin: 0 auto; position: relative; }
        
        /* Premium Auth UI */
        .login-screen { height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .btn-login { background: #fff; color: #000; padding: 16px 30px; border-radius: 20px; font-weight: 800; border: none; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: 0.3s; }
        .btn-login:active { transform: scale(0.95); }

        .tracker-card { 
            background: linear-gradient(135deg, #00C6FB 0%, #005BEA 100%); 
            border-radius: 40px; padding: 30px; color: #fff; min-height: 280px; margin-bottom: 35px; 
            box-shadow: 0 25px 50px -12px rgba(0, 91, 234, 0.4); transition: 0.5s;
        }

        .inner-search { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: flex; border-radius: 20px; padding: 12px 18px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.2); }
        .inner-search input { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-weight: 700; }
        .inner-search input::placeholder { color: rgba(255,255,255,0.5); }

        .details-box { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 22px; margin-top: 15px; }
        .progress-line { height: 6px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 15px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: #fff; box-shadow: 0 0 10px #fff; transition: 1s ease; }

        /* Cartoon Animations */
        .cartoon-box { text-align: center; padding: 20px; }
        .food-emoji { font-size: 55px; display: inline-block; animation: bounce 2s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(10deg); } }

        /* Logout Confirm Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-card { background: #fff; padding: 30px; border-radius: 30px; width: 100%; maxWidth: 320px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        
        .action-card { background: #fff; padding: 22px; border-radius: 30px; text-decoration: none; color: #000; box-shadow: 0 10px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; align-items: center; border-bottom: 4px solid #E5E5EA; transition: 0.3s; }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {!user ? (
        <div className="login-screen fade-in">
          <div style={{fontSize: 70, marginBottom: 20}}>🍳</div>
          <h1 style={{fontSize: 32, fontWeight: 800, margin: 0}}>YNS Kitchen</h1>
          <p style={{color: '#8E8E93', marginBottom: 30}}>နံပါတ်တစ် အရသာရှိသော လက်ရာများ</p>
          <button className="btn-login" onClick={handleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" />
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:25}}>
            <div>
              <span style={{fontSize:11, fontWeight:800, color: 'var(--p)'}}>{currentDate}</span>
              <h2 style={{margin:0, fontSize:22, fontWeight: 800}}>Hi, {user.displayName.split(' ')[0]}!</h2>
            </div>
            <img 
              src={user.photoURL} 
              onClick={() => setShowLogoutConfirm(true)}
              style={{width:45, height:45, borderRadius:15, border: '2px solid #fff', cursor:'pointer'}} 
            />
          </div>

          {/* Track Card */}
          <div className="tracker-card">
            <div className="inner-search">
                <i className="fas fa-search" style={{marginRight: 10, opacity: 0.5}}></i>
                <input 
                  type="text" 
                  placeholder="Order ID ရိုက်ရှာပါ..." 
                  value={trackID} 
                  onChange={(e) => setTrackID(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
                />
                {trackID && <i className="fas fa-times-circle" onClick={() => { setTrackID(""); setHasSearched(false); }} style={{cursor:'pointer'}}></i>}
            </div>

            {searchLoading ? (
                <div style={{textAlign:'center', padding:40}}><i className="fas fa-spinner fa-spin"></i> ရှာဖွေနေသည်...</div>
            ) : hasSearched ? (
                /* ရှာထားရင် အကြာကြီးပြမယ် */
                searchedOrder ? <OrderView order={searchedOrder} title="ORDER SEARCH" /> : 
                <div style={{textAlign:'center', padding:20}}>အော်ဒါရှာမတွေ့ပါ ❌</div>
            ) : lastActiveOrder ? (
                /* မှာထားတာရှိရင် ပြမယ် (Ready ဆို ၁၀ စက္ကန့်ပဲ) */
                <OrderView order={lastActiveOrder} title="LIVE TRACKING" />
            ) : (
                /* မှာထားတာမရှိရင် Animation ပြမယ် */
                <div className="cartoon-box fade-in">
                    <div className="food-emoji" style={{animationDelay:'0s'}}>🍔</div>
                    <div className="food-emoji" style={{animationDelay:'0.3s'}}>🍟</div>
                    <div className="food-emoji" style={{animationDelay:'0.6s'}}>🍕</div>
                    <h3 style={{marginTop: 20}}>စားချင်တာလေးတွေ မှာလိုက်တော့နော်!</h3>
                </div>
            )}
          </div>

          {/* Action Grid */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
            <Link href="/customer_menu" className="action-card">
                <div style={{fontSize: 24, marginBottom: 8}}>🍱</div>
                <b style={{fontSize: 15}}>Menu</b>
            </Link>
            <Link href="/history" className="action-card">
                <div style={{fontSize: 24, marginBottom: 8}}>📜</div>
                <b style={{fontSize: 15}}>History</b>
            </Link>
          </div>
        </>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
            <div className="modal-card fade-in">
                <div style={{fontSize: 40, marginBottom: 15}}>👋</div>
                <h3 style={{margin: '0 0 10px 0'}}>Logout လုပ်မှာလား?</h3>
                <p style={{fontSize: 13, color: '#8E8E93', marginBottom: 25}}>အကောင့်မှ ထွက်ခွာလိုသည်မှာ သေချာပါသလား။</p>
                <div style={{display:'flex', gap:10}}>
                    <button onClick={() => setShowLogoutConfirm(false)} style={{flex:1, padding:15, borderRadius:15, border:'none', background:'#F2F2F7', fontWeight:700}}>မထွက်သေးဘူး</button>
                    <button onClick={handleLogout} style={{flex:1, padding:15, borderRadius:15, border:'none', background:'#FF3B30', color:'#fff', fontWeight:700}}>ထွက်မယ်</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
    }
            
