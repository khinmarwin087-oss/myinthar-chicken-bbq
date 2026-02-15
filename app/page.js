"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { signInWithRedirect, onAuthStateChanged, signOut } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Search state နှစ်ခုခွဲလိုက်ပါတယ်
  const [menuSearch, setMenuSearch] = useState("");
  const [searchResultItems, setSearchResultItems] = useState([]);
  
  const [trackID, setTrackID] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [currentDate, setCurrentDate] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }));

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        const q = query(collection(db, "orders"), where("email", "==", u.email), orderBy("orderDate", "desc"));
        const unsubOrders = onSnapshot(q, (snap) => {
          setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

  // ဟင်းပွဲရှာရန် Function
  const handleMenuSearch = async (e) => {
    const term = e.target.value;
    setMenuSearch(term);
    if (term.trim().length > 0) {
      const qM = query(collection(db, "menu"));
      const mSnap = await getDocs(qM);
      const filtered = mSnap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .filter(m => m.name.toLowerCase().includes(term.toLowerCase()) || m.category?.toLowerCase().includes(term.toLowerCase()));
      setSearchResultItems(filtered);
    } else {
      setSearchResultItems([]);
    }
  };

  // Order ID Track လုပ်ရန် Function
  const handleTrackOrder = async () => {
    if (!trackID.trim()) return;
    setHasSearched(true);
    const searchID = trackID.toUpperCase().startsWith('ORD-') ? trackID.toUpperCase() : "ORD-" + trackID.toUpperCase();
    
    const q = query(collection(db, "orders"), where("orderId", "==", searchID));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setSearchedOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
    } else {
      setSearchedOrder(null);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Logout ထွက်မှာ သေချာပါသလား?")) {
      await signOut(auth);
      setShowDropdown(false);
    }
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>YNS Premium Loading...</div>;

  return (
    <div className="main-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        :root { --p: #007AFF; --bg: #F8F9FB; --card: #ffffff; --text: #1C1C1E; --gray: #8E8E93; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); margin: 0; }
        .main-wrapper { padding: 25px 20px; max-width: 500px; margin: 0 auto; }
        
        .premium-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .date-chip { background: #fff; padding: 5px 15px; border-radius: 50px; font-size: 11px; font-weight: 800; color: var(--p); box-shadow: 0 4px 10px rgba(0,122,255,0.1); }
        
        .search-box { background: #fff; display: flex; align-items: center; padding: 15px 20px; border-radius: 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 20px; }
        .search-box input { border: none; outline: none; margin-left: 12px; font-weight: 600; width: 100%; color: var(--text); }

        .tracker-card { background: #1C1C1E; border-radius: 32px; padding: 25px; color: #fff; min-height: 180px; margin-bottom: 25px; }
        
        .inner-search { background: rgba(255,255,255,0.1); display: flex; border-radius: 15px; padding: 8px 15px; margin-bottom: 20px; }
        .inner-search input { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-size: 13px; }
        .inner-search button { background: var(--p); border: none; color: #fff; padding: 5px 12px; border-radius: 10px; font-size: 11px; font-weight: bold; cursor: pointer; }

        .order-slider { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 20px; scrollbar-width: none; }
        .order-slider::-webkit-scrollbar { display: none; }
        .order-item { min-width: 100%; scroll-snap-align: start; }
        
        .progress-line { height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 15px 0; position: relative; }
        .progress-fill { height: 100%; background: var(--p); border-radius: 10px; transition: 1s ease; }
        
        .menu-grid-mini { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px; }
        .mini-item { background: #fff; border: 1px solid #eee; border-radius: 18px; padding: 10px; text-align: center; text-decoration: none; color: inherit; }

        .profile-container { position: relative; }
        .pfp-btn { width: 48px; height: 48px; border-radius: 16px; border: 3px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.1); cursor: pointer; }
        
        .dropdown-menu { 
          position: absolute; top: 60px; right: 0; width: 240px; 
          background: #fff; border-radius: 24px; padding: 20px; 
          box-shadow: 0 20px 50px rgba(0,0,0,0.15); z-index: 100; 
        }
      `}</style>

      {/* Header */}
      <div className="premium-header">
        <div>
          <span className="date-chip">{currentDate}</span>
          <h2 style={{margin: '8px 0 0', fontSize: '24px'}}>Hey, {user ? user.displayName.split(' ')[0] : 'Guest'} 👋</h2>
        </div>
        <div className="profile-container" ref={dropdownRef}>
          {user ? (
            <img src={user.photoURL} className="pfp-btn" onClick={() => setShowDropdown(!showDropdown)} alt="User" />
          ) : (
            <button onClick={() => signInWithRedirect(auth, provider)} className="date-chip" style={{border: 'none', cursor: 'pointer'}}>Login</button>
          )}
          {showDropdown && (
            <div className="dropdown-menu">
              <div style={{textAlign:'center', marginBottom:15}}>
                <img src={user.photoURL} style={{width:50, borderRadius:'50%'}} />
                <h4 style={{margin:'5px 0'}}>{user.displayName}</h4>
              </div>
              <Link href="/history" style={{textDecoration:'none', color:'#333', display:'block', padding:'10px 0'}}>Order History</Link>
              <div onClick={handleLogout} style={{color:'red', cursor:'pointer', paddingTop:10}}>Log Out</div>
            </div>
          )}
        </div>
      </div>

      {/* 1. Main Menu Search Bar */}
      <div className="search-box">
        <i className="fas fa-utensils" style={{color: 'var(--p)'}}></i>
        <input type="text" placeholder="ဟင်းပွဲအမည်ဖြင့် ရှာဖွေပါ..." value={menuSearch} onChange={handleMenuSearch} />
      </div>

      {/* Menu Search Results (Show outside tracker card) */}
      {menuSearch && (
        <div style={{marginBottom: 20}}>
            <h4 style={{margin: '0 0 10px'}}>Search Results:</h4>
            {searchResultItems.length > 0 ? (
                <div className="menu-grid-mini">
                    {searchResultItems.map(item => (
                        <Link href="/customer_menu" key={item.id} className="mini-item">
                            <img src={item.image || 'https://via.placeholder.com/100'} style={{width:'100%', height:'70px', borderRadius:'12px', objectFit:'cover'}} alt={item.name} />
                            <div style={{fontSize:'12px', fontWeight:'bold', marginTop:5}}>{item.name}</div>
                            <div style={{fontSize:'11px', color:'var(--p)'}}>{item.price} Ks</div>
                        </Link>
                    ))}
                </div>
            ) : <p style={{fontSize: 13, color: '#888'}}>ဟင်းပွဲမတွေ့ပါ</p>}
        </div>
      )}

      {/* Tracker Card */}
      <div className="tracker-card">
        {/* 2. Order ID Search Bar (Inside Tracker) */}
        <div className="inner-search">
            <input 
              type="text" 
              placeholder="Order ID (ဥပမာ- 1234)" 
              value={trackID} 
              onChange={(e) => {
                setTrackID(e.target.value);
                if(!e.target.value) { setHasSearched(false); setSearchedOrder(null); }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
            />
            <button onClick={handleTrackOrder}>Track</button>
        </div>

        {/* Track Result Display */}
        {hasSearched ? (
            searchedOrder ? (
                <div className="order-item">
                    <span style={{background: 'var(--p)', padding: '4px 10px', borderRadius: '10px', fontSize: '10px'}}>TRACKING ID: {searchedOrder.orderId}</span>
                    <h2 style={{margin: '10px 0'}}>
                        {searchedOrder.status === 'New' && 'လက်ခံရရှိပြီ 📝'}
                        {searchedOrder.status === 'Cooking' && 'ချက်ပြုတ်နေဆဲ 👨‍🍳'}
                        {searchedOrder.status === 'Ready' && 'အဆင်သင့်ဖြစ်ပြီ 🥡'}
                        {searchedOrder.status === 'Success' && 'ပို့ဆောင်ပြီးပြီ ✅'}
                    </h2>
                    <div className="progress-line">
                        <div className="progress-fill" style={{ width: 
                            searchedOrder.status === 'New' ? '25%' : 
                            searchedOrder.status === 'Cooking' ? '50%' : 
                            searchedOrder.status === 'Ready' ? '75%' : '100%' 
                        }}></div>
                    </div>
                </div>
            ) : (
                <div style={{textAlign:'center', padding: '10px 0'}}>
                    <p style={{fontSize: 13, opacity: 0.7}}>ID မတွေ့ပါ၊ ပြန်စစ်ပေးပါ</p>
                    <button onClick={() => setHasSearched(false)} style={{background:'none', border:'1px solid #555', color:'#fff', padding:'5px 15px', borderRadius:10, fontSize:11}}>Back</button>
                </div>
            )
        ) : (
            /* Recent Orders Slider (Only show when not searching) */
            orders.length > 0 ? (
                <div className="order-slider">
                    {orders.map(order => (
                        <div key={order.id} className="order-item">
                            <div style={{display:'flex', justifyContent:'space-between', fontSize: '12px'}}>
                                <b>{order.status}</b>
                                <span style={{opacity: 0.6}}>#{order.orderId}</span>
                            </div>
                            <h2 style={{margin: '15px 0'}}>
                                {order.status === 'New' ? 'Order Received' : 'Now Cooking'}
                            </h2>
                            <div className="progress-line">
                                <div className="progress-fill" style={{ width: 
                                    order.status === 'New' ? '25%' : 
                                    order.status === 'Cooking' ? '50%' : 
                                    order.status === 'Ready' ? '75%' : '100%' 
                                }}></div>
                            </div>
                            <p style={{fontSize: '11px', opacity: 0.5}}>Slide to see more orders →</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{textAlign: 'center', padding: '10px'}}>
                    <div style={{fontSize: '30px', marginBottom: '5px'}}>🍕</div>
                    <h4 style={{margin: 0}}>ဗိုက်ဆာနေပြီလား?</h4>
                    <Link href="/customer_menu" style={{color: 'var(--p)', fontSize: '13px', textDecoration:'none'}}>ဟင်းပွဲများမှာယူရန် နှိပ်ပါ</Link>
                </div>
            )
        )}
      </div>

      {/* Action Buttons */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
        <Link href="/customer_menu" style={{background: '#fff', padding: '20px', borderRadius: '25px', textDecoration: 'none', color: 'inherit', boxShadow: '0 5px 15px rgba(0,0,0,0.02)'}}>
          <div style={{width: '40px', height: '40px', background: '#E6F2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px'}}>🛒</div>
          <b style={{fontSize: '14px'}}>Menu သို့သွားရန်</b>
        </Link>
        <Link href="https://m.me/yourpage" style={{background: '#fff', padding: '20px', borderRadius: '25px', textDecoration: 'none', color: 'inherit', boxShadow: '0 5px 15px rgba(0,0,0,0.02)'}}>
          <div style={{width: '40px', height: '40px', background: '#FFF2F2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px'}}>💬</div>
          <b style={{fontSize: '14px'}}>အကူအညီရယူရန်</b>
        </Link>
      </div>
    </div>
  );
}
