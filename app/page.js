"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, orderBy, onSnapshot, getDocs, limit } from "firebase/firestore";
import { signInWithRedirect, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [menuSearch, setMenuSearch] = useState("");
  const [searchResultItems, setSearchResultItems] = useState([]);
  
  const [trackID, setTrackID] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [currentDate, setCurrentDate] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }));

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Index error မတက်အောင် orderBy ကို ခေတ္တဖယ်ထားနိုင်သည် သို့မဟုတ် Firebase Console တွင် Index ဆောက်ပေးပါ
        const q = query(collection(db, "orders"), where("email", "==", u.email));
        const unsubOrders = onSnapshot(q, (snap) => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Client side sorting
          list.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
          setOrders(list);
        });
        return () => unsubOrders();
      }
    });

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { unsub(); document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const handleMenuSearch = async (e) => {
    const term = e.target.value;
    setMenuSearch(term);
    if (term.trim().length > 0) {
      const qM = query(collection(db, "menu"));
      const mSnap = await getDocs(qM);
      const filtered = mSnap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(m => m.name.toLowerCase().includes(term.toLowerCase()));
      setSearchResultItems(filtered);
    } else {
      setSearchResultItems([]);
    }
  };

  const handleTrackOrder = async () => {
    if (!trackID.trim()) return;
    setSearchLoading(true);
    setHasSearched(true);

    // ID Format ညှိခြင်း (ဥပမာ- 1234 လို့ရိုက်ရင် ORD-1234 ဖြစ်အောင်လုပ်ပေးခြင်း)
    let finalID = trackID.trim().toUpperCase();
    if (!finalID.startsWith('ORD-')) {
        finalID = 'ORD-' + finalID;
    }

    try {
        const q = query(collection(db, "orders"), where("orderId", "==", finalID), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            setSearchedOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
            setSearchedOrder(null);
            alert("Order ID မမှန်ကန်ပါ သို့မဟုတ် မရှိပါ!");
        }
    } catch (error) {
        console.error("Tracking Error:", error);
    } finally {
        setSearchLoading(false);
    }
  };

  const clearTrack = () => { setTrackID(""); setHasSearched(false); setSearchedOrder(null); };
  const clearMenuSearch = () => { setMenuSearch(""); setSearchResultItems([]); };

  if (loading) return <div style={{padding: '50px', textAlign: 'center', color: '#007AFF', fontWeight: 'bold'}}>YNS Premium Loading...</div>;

  return (
    <div className="main-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        :root { --p: #007AFF; --bg: #F2F5F9; --card: #ffffff; --text: #1C1C1E; --gray: #8E8E93; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); margin: 0; }
        .main-wrapper { padding: 25px 20px; max-width: 500px; margin: 0 auto; overflow-x: hidden; }
        
        .premium-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .date-chip { background: #fff; padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 800; color: var(--p); box-shadow: 0 4px 12px rgba(0,122,255,0.12); }
        
        .search-box { background: #fff; display: flex; align-items: center; padding: 14px 20px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); margin-bottom: 30px; position: relative; border: 1px solid rgba(0,0,0,0.02); }
        .search-box input { border: none; outline: none; margin-left: 12px; font-weight: 600; width: 80%; color: var(--text); background: transparent; }
        .clear-btn { position: absolute; right: 18px; color: #D1D1D6; cursor: pointer; font-size: 18px; }

        /* Order Tracker Card - BIG & GRADIENT & ANIMATED */
        .tracker-card { 
            background: linear-gradient(135deg, #00C6FB 0%, #005BEA 100%); 
            border-radius: 40px; padding: 30px; color: #fff; 
            min-height: 320px; margin-bottom: 45px; 
            box-shadow: 0 25px 50px -12px rgba(0, 91, 234, 0.3);
            position: relative;
            overflow: hidden;
            animation: floating 5s ease-in-out infinite;
        }

        @keyframes floating {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
        }

        .inner-search { background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: flex; border-radius: 20px; padding: 12px 18px; margin-bottom: 25px; align-items: center; border: 1px solid rgba(255,255,255,0.3); }
        .inner-search input { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-size: 15px; font-weight: 600; }
        .inner-search input::placeholder { color: rgba(255,255,255,0.7); }

        .progress-line { height: 10px; background: rgba(255,255,255,0.2); border-radius: 20px; margin: 20px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: #fff; border-radius: 20px; box-shadow: 0 0 15px #fff; transition: width 1s ease-in-out; }
        
        .details-box { background: rgba(255,255,255,0.15); padding: 15px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.1); margin-top: 10px; }

        /* 3D Menu Cards */
        .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 25px; }
        .action-card { 
            background: #fff; padding: 25px; border-radius: 30px; 
            text-decoration: none; color: inherit; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.06);
            transition: 0.4s; display: flex; flex-direction: column; align-items: center;
            border-bottom: 4px solid #F2F2F7;
        }
        .action-card:hover { transform: translateY(-10px); box-shadow: 0 25px 45px rgba(0,0,0,0.1); border-bottom-color: var(--p); }
        .icon-box { width: 55px; height: 55px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 24px; }
      `}</style>

      {/* Header */}
      <div className="premium-header">
        <div>
          <span className="date-chip">{currentDate}</span>
          <h2 style={{margin: '10px 0 0', fontSize: '26px'}}>Hello, {user ? user.displayName.split(' ')[0] : 'Guest'}!</h2>
        </div>
        <div ref={dropdownRef} style={{position: 'relative'}}>
            {user ? (
                <img src={user.photoURL} style={{width: 55, height: 55, borderRadius: 20, border: '4px solid #fff', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} onClick={() => setShowDropdown(!showDropdown)} />
            ) : (
                <button onClick={() => signInWithRedirect(auth, provider)} className="date-chip" style={{border: 'none'}}>Login</button>
            )}
            {showDropdown && (
                <div style={{position:'absolute', right:0, top:70, background:'#fff', padding:18, borderRadius:24, boxShadow:'0 15px 40px rgba(0,0,0,0.1)', zIndex:100, width:180}}>
                    <Link href="/history" style={{display:'block', textDecoration:'none', color:'#333', marginBottom:12, fontWeight:700}}>Order History</Link>
                    <div onClick={() => signOut(auth)} style={{color:'red', fontWeight:700, cursor:'pointer'}}>Logout</div>
                </div>
            )}
        </div>
      </div>

      {/* Menu Search */}
      <div className="search-box">
        <i className="fas fa-search" style={{color: 'var(--p)'}}></i>
        <input type="text" placeholder="ဟင်းပွဲရှာရန်..." value={menuSearch} onChange={handleMenuSearch} />
        {menuSearch && <i className="fas fa-times" className="clear-btn" onClick={clearMenuSearch}></i>}
      </div>

      {/* Tracker Card (Big & Gradient) */}
      <div className="tracker-card">
        <div className="inner-search">
            <i className="fas fa-truck-loading" style={{marginRight: 12}}></i>
            <input 
              type="text" 
              placeholder="Order ID ရိုက်ထည့်ပါ (ဥပမာ- 1234)" 
              value={trackID} 
              onChange={(e) => setTrackID(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
            />
            {trackID && <i className="fas fa-times-circle" onClick={clearTrack} style={{marginLeft:10, cursor:'pointer'}}></i>}
        </div>

        {searchLoading ? (
            <div style={{textAlign:'center', padding:40}}>ရှာဖွေနေပါသည်...</div>
        ) : hasSearched && searchedOrder ? (
            <div onClick={() => router.push('/history')} style={{cursor:'pointer'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontSize: 12, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: 12}}>STATUS: {searchedOrder.status.toUpperCase()}</span>
                    <span style={{fontSize: 12, opacity: 0.8}}>#{searchedOrder.orderId}</span>
                </div>
                
                <h2 style={{fontSize: 34, margin: '15px 0 5px'}}>
                    {searchedOrder.status === 'New' ? 'Received 📝' : 
                     searchedOrder.status === 'Cooking' ? 'Cooking 👨‍🍳' : 
                     searchedOrder.status === 'Ready' ? 'Ready 🥡' : 'Success ✅'}
                </h2>

                <div className="progress-line">
                    <div className="progress-fill" style={{ width: 
                        searchedOrder.status === 'New' ? '25%' : 
                        searchedOrder.status === 'Cooking' ? '55%' : 
                        searchedOrder.status === 'Ready' ? '85%' : '100%' 
                    }}></div>
                </div>

                <div className="details-box">
                    <b style={{fontSize: 13, display:'block', marginBottom:8}}>Order Details:</b>
                    {searchedOrder.items?.map((item, i) => (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4, opacity: 0.9}}>
                            <span>{item.name} x {item.quantity}</span>
                            <span>{item.price * item.quantity} Ks</span>
                        </div>
                    ))}
                    <div style={{borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:10, paddingTop:8, textAlign:'right', fontWeight:800, fontSize: 16}}>
                        Total: {searchedOrder.totalPrice} Ks
                    </div>
                </div>
            </div>
        ) : orders.length > 0 && !hasSearched ? (
            <div className="order-slider">
                {orders.slice(0, 1).map(order => (
                    <div key={order.id} onClick={() => router.push('/history')} style={{width:'100%'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <b style={{fontSize: 14}}>နောက်ဆုံးမှာယူမှု</b>
                            <span style={{opacity: 0.7}}>#{order.orderId}</span>
                        </div>
                        <h2 style={{fontSize: 30, margin: '10px 0'}}>{order.status} ✨</h2>
                        <div className="details-box">
                            {order.items?.slice(0, 2).map((item, ix) => (
                                <div key={ix} style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4}}>
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>{item.price * item.quantity} Ks</span>
                                </div>
                            ))}
                            <div style={{textAlign:'right', fontWeight:800, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8}}>
                                Total: {order.totalPrice} Ks
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div style={{textAlign:'center', padding: '20px 0'}}>
                <div style={{fontSize: 60, marginBottom: 15}}>🥘</div>
                <h3>ဗိုက်ဆာနေပြီလား?</h3>
                <p style={{fontSize: 14, opacity: 0.8, marginBottom: 20}}>အရသာရှိတဲ့ ဟင်းပွဲတွေကို အခုပဲ မှာယူလိုက်ပါ။</p>
                <Link href="/customer_menu" style={{background: '#fff', color: '#005BEA', padding: '12px 30px', borderRadius: 15, textDecoration: 'none', fontWeight: 800}}>Order Now</Link>
            </div>
        )}
      </div>

      {/* 3D Action Cards */}
      <div className="action-grid">
        <Link href="/customer_menu" className="action-card">
          <div className="icon-box" style={{background: '#E1F5FE', color: '#03A9F4'}}>
            <i className="fas fa-utensils"></i>
          </div>
          <b style={{fontSize: 16}}>Browse Menu</b>
          <span style={{fontSize: 11, color: '#8E8E93', marginTop: 5}}>ဟင်းပွဲများ ကြည့်မည်</span>
        </Link>
        <Link href="/history" className="action-card">
          <div className="icon-box" style={{background: '#F3E5F5', color: '#9C27B0'}}>
            <i className="fas fa-receipt"></i>
          </div>
          <b style={{fontSize: 16}}>My Orders</b>
          <span style={{fontSize: 11, color: '#8E8E93', marginTop: 5}}>မှာယူမှုမှတ်တမ်း</span>
        </Link>
      </div>
    </div>
  );
        }
              
