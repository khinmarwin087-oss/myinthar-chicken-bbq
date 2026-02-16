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
  const [isSyncing, setIsSyncing] = useState(true); // Syncing state
  
  const [trackID, setTrackID] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [lastActiveOrder, setLastActiveOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }));
    
    // Dropdown ပြင်ပကိုနှိပ်ရင် ပိတ်ဖို့
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
          
          // Recent Orders for Reorder
          setRecentOrders(list.slice(0, 3));

          const active = list.find(o => ['pending', 'New', 'Cooking', 'Ready'].includes(o.status));
          setLastActiveOrder(active || null);

          // ၄ စက္ကန့် Animation ပြပြီးမှ Data ပြမည်
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

  const handleLogin = () => signInWithPopup(auth, provider);
  const handleLogout = () => { signOut(auth); setShowProfileMenu(false); };

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
        {order.status === 'Ready' && <p style={{fontSize:12, fontWeight:'bold', color:'#fff', background:'rgba(255,255,255,0.2)', padding:'5px 10px', borderRadius:10, display:'inline-block'}}>ဆိုင်မှာ လာယူလို့ရပါပြီခင်ဗျာ!</p>}
        
        <div className="progress-line"><div className="progress-fill" style={{ width: ['New', 'pending'].includes(order.status) ? '25%' : order.status === 'Cooking' ? '55%' : order.status === 'Ready' ? '85%' : '100%' }}></div></div>
        
        <div className="details-box">
            {order.items?.map((item, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4}}>
                    <span>{item.name || item.itemName} x {item.quantity || item.qty}</span>
                    <span>{((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()} K</span>
                </div>
            ))}
        </div>
    </div>
  );

  if (loading) return <div className="loader">YNS Kitchen...</div>;

  return (
    <div className="main-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        :root { --p: #007AFF; --bg: #F8F9FA; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; }
        .main-wrapper { padding: 20px; max-width: 500px; margin: 0 auto; position: relative; }
        
        .tracker-card { 
            background: linear-gradient(135deg, #00C6FB 0%, #005BEA 100%); 
            border-radius: 35px; padding: 25px; color: #fff; min-height: 250px; margin-bottom: 25px; 
            box-shadow: 0 20px 40px -10px rgba(0, 91, 234, 0.3); position: relative;
        }

        .dropdown-menu {
            position: absolute; right: 0; top: 55px; background: #fff; border-radius: 20px;
            width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 100;
            padding: 10px; border: 1px solid #eee; overflow: hidden;
        }
        .dropdown-item { padding: 12px 15px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; color: #444; transition: 0.2s; }
        .dropdown-item:hover { background: #F2F2F7; }

        .inner-search { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: flex; border-radius: 18px; padding: 10px 15px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2); }
        .inner-search input { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-weight: 700; font-size: 14px; }
        .inner-search input::placeholder { color: rgba(255,255,255,0.5); }

        .details-box { background: rgba(255,255,255,0.1); padding: 12px; border-radius: 18px; margin-top: 10px; }
        .progress-line { height: 6px; background: rgba(255,255,255,0.2); border-radius: 10px; margin: 15px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: #fff; box-shadow: 0 0 10px #fff; transition: 1s ease; }

        .food-emoji { font-size: 50px; display: inline-block; animation: bounce 2s infinite ease-in-out; }
        @keyframes bounce { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-15px) rotate(8deg); } }
        
        .recent-card { background: #fff; padding: 15px; border-radius: 22px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 5px 15px rgba(0,0,0,0.02); }
        .reorder-btn { background: var(--p); color: #fff; border: none; padding: 8px 15px; border-radius: 12px; font-size: 12px; font-weight: 800; cursor: pointer; }
        
        .loader-dots { display: flex; gap: 5px; justify-content: center; margin-top: 10px; }
        .dot { width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: blink 1.4s infinite both; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
        
        .fade-in { animation: fadeIn 0.6s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {!user ? (
        <div className="login-screen fade-in" style={{textAlign:'center', paddingTop:'100px'}}>
          <div style={{fontSize: 70, marginBottom: 20}}>🥘</div>
          <h1 style={{fontSize: 32, fontWeight: 800, margin: 0}}>YNS Kitchen</h1>
          <p style={{color: '#8E8E93', marginBottom: 30}}>အိမ်ပြန်ရောက်သလို နွေးထွေးတဲ့လက်ရာများ</p>
          <button className="btn-login" onClick={handleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" />
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, position:'relative'}}>
            <div>
              <span style={{fontSize:11, fontWeight:800, color: 'var(--p)'}}>{currentDate}</span>
              <h2 style={{margin:0, fontSize:22, fontWeight: 800}}>Hi, {user.displayName.split(' ')[0]}!</h2>
            </div>
            
            <div ref={dropdownRef}>
                <img 
                    src={user.photoURL} 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    style={{width:45, height:45, borderRadius:15, border: '2px solid #fff', cursor:'pointer', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}} 
                />
                {showProfileMenu && (
                    <div className="dropdown-menu fade-in">
                        <Link href="/history" style={{textDecoration:'none'}}><div className="dropdown-item"><i className="fas fa-history"></i> My Orders</div></Link>
                        <div className="dropdown-item" onClick={handleLogout} style={{color:'#FF3B30'}}><i className="fas fa-sign-out-alt"></i> Logout</div>
                    </div>
                )}
            </div>
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

            {isSyncing ? (
                /* ၄ စက္ကန့်ပြမည့် Syncing Animation */
                <div className="cartoon-box fade-in" style={{paddingTop: 10}}>
                    <div className="food-emoji">🍱</div>
                    <p style={{marginTop: 15, fontWeight: 700, fontSize: 14}}>Syncing your orders...</p>
                    <div className="loader-dots">
                        <div className="dot" style={{animationDelay:'0s'}}></div>
                        <div className="dot" style={{animationDelay:'0.2s'}}></div>
                        <div className="dot" style={{animationDelay:'0.4s'}}></div>
                    </div>
                </div>
            ) : searchLoading ? (
                <div style={{textAlign:'center', padding:40}}><i className="fas fa-spinner fa-spin"></i> ရှာဖွေနေသည်...</div>
            ) : hasSearched ? (
                searchedOrder ? <OrderView order={searchedOrder} title="ORDER SEARCH" /> : 
                <div style={{textAlign:'center', padding:20}}>အော်ဒါရှာမတွေ့ပါ ❌</div>
            ) : lastActiveOrder ? (
                <OrderView order={lastActiveOrder} title="LIVE TRACKING" />
            ) : (
                <div className="cartoon-box fade-in">
                    <div className="food-emoji" style={{animationDelay:'0s'}}>🍕</div>
                    <div className="food-emoji" style={{animationDelay:'0.3s'}}>🥤</div>
                    <h3 style={{marginTop: 15, fontSize:18}}>ဗိုက်ဆာနေပြီလား?</h3>
                    <p style={{fontSize:12, opacity:0.8}}>အခုပဲ တစ်ခုခု မှာလိုက်ရအောင်။</p>
                </div>
            )}
          </div>

          {/* Recent Orders Section */}
          {recentOrders.length > 0 && (
              <div className="fade-in" style={{marginBottom: 30}}>
                  <h4 style={{fontSize: 14, fontWeight: 800, color: '#8E8E93', marginBottom: 15, display:'flex', alignItems:'center', gap:8}}>
                      <i className="fas fa-clock-rotate-left"></i> RECENT ORDERS
                  </h4>
                  {recentOrders.map((order) => (
                      <div key={order.id} className="recent-card">
                          <div style={{display:'flex', alignItems:'center', gap:12}}>
                              <div style={{width:40, height:40, background:'#F2F2F7', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18}}>🍲</div>
                              <div>
                                  <div style={{fontSize:14, fontWeight:700}}>{order.items?.[0]?.name || "Special Dish"}</div>
                                  <div style={{fontSize:11, color:'#8E8E93'}}>{order.totalPrice.toLocaleString()} Ks • {order.status}</div>
                              </div>
                          </div>
                          <button onClick={() => router.push('/customer_menu')} className="reorder-btn">Reorder</button>
                      </div>
                  ))}
              </div>
          )}

          {/* Action Grid */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
            <Link href="/customer_menu" style={{textDecoration:'none'}}>
                <div className="action-card" style={{background:'#fff', padding:20, borderRadius:25, textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.02)'}}>
                    <div style={{fontSize: 24, marginBottom: 8}}>🍱</div>
                    <b style={{fontSize: 14, color:'#000'}}>Go to Menu</b>
                </div>
            </Link>
            <Link href="/history" style={{textDecoration:'none'}}>
                <div className="action-card" style={{background:'#fff', padding:20, borderRadius:25, textAlign:'center', boxShadow:'0 5px 15px rgba(0,0,0,0.02)'}}>
                    <div style={{fontSize: 24, marginBottom: 8}}>📜</div>
                    <b style={{fontSize: 14, color:'#000'}}>View History</b>
                </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
    }
  
