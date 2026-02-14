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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultItems, setSearchResultItems] = useState([]);
  const [isTrackSearching, setIsTrackSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // User ရဲ့ Active Orders အကုန်လုံးကို အချိန်နဲ့တပြေးညီ ဆွဲယူမည်
        // Note: Console မှာ Index error တက်ခဲ့ရင် Firebase ကပေးတဲ့ link ကိုနှိပ်ပြီး Index create လုပ်ပေးရပါမယ်
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

  const handleSmartSearch = async (e) => {
    const term = e.target.value.trim();
    setSearchQuery(term);
    
    if (term.length > 0) {
      if (term.toUpperCase().includes('ORD-') || !isNaN(term)) {
        setIsTrackSearching(true);
        const searchID = term.toUpperCase().startsWith('ORD-') ? term.toUpperCase() : "ORD-" + term;
        const q = query(collection(db, "orders"), where("orderId", "==", searchID));
        const snap = await getDocs(q);
        if (!snap.empty) setSearchedOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
        else setSearchedOrder(null);
        setSearchResultItems([]);
      } else {
        setIsTrackSearching(false);
        setSearchedOrder(null);
        const qM = query(collection(db, "menu"));
        const mSnap = await getDocs(qM);
        const filtered = mSnap.docs
          .map(d => ({id: d.id, ...d.data()}))
          .filter(m => m.name.toLowerCase().includes(term.toLowerCase()) || m.category?.toLowerCase().includes(term.toLowerCase()));
        setSearchResultItems(filtered);
      }
    } else {
      setIsTrackSearching(false);
      setSearchedOrder(null);
      setSearchResultItems([]);
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
      {/* FontAwesome Link ထည့်ပေးထားပါတယ် */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style jsx global>{`
        :root { --p: #007AFF; --bg: #F8F9FB; --card: #ffffff; --text: #1C1C1E; --gray: #8E8E93; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text); margin: 0; }
        .main-wrapper { padding: 25px 20px; max-width: 500px; margin: 0 auto; }
        
        .premium-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .date-chip { background: #fff; padding: 5px 15px; border-radius: 50px; font-size: 11px; font-weight: 800; color: var(--p); box-shadow: 0 4px 10px rgba(0,122,255,0.1); }
        
        .search-box { background: #fff; display: flex; align-items: center; padding: 15px 20px; border-radius: 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); margin-bottom: 20px; }
        .search-box input { border: none; outline: none; margin-left: 12px; font-weight: 600; width: 100%; color: var(--text); }

        .tracker-card { background: #1C1C1E; border-radius: 32px; padding: 25px; color: #fff; min-height: 180px; position: relative; overflow: hidden; margin-bottom: 25px; transition: 0.3s ease; }
        
        .order-slider { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 20px; scrollbar-width: none; }
        .order-slider::-webkit-scrollbar { display: none; }
        .order-item { min-width: 100%; scroll-snap-align: start; }
        
        .progress-line { height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 15px 0; position: relative; }
        .progress-fill { height: 100%; background: var(--p); border-radius: 10px; transition: 1s ease; }
        
        .menu-grid-mini { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .mini-item { background: rgba(255,255,255,0.05); border-radius: 18px; padding: 10px; text-align: center; }

        .profile-container { position: relative; }
        .pfp-btn { width: 48px; height: 48px; border-radius: 16px; border: 3px solid #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.1); cursor: pointer; }
        .dropdown-menu { position: absolute; top: 60px; right: 0; width: 200px; background: #fff; border-radius: 20px; padding: 8px; box-shadow: 0 15px 40px rgba(0,0,0,0.12); z-index: 100; border: 1px solid #f0f0f0; }
        .drop-link { display: flex; align-items: center; gap: 10px; padding: 12px; text-decoration: none; color: var(--text); font-weight: 700; font-size: 13px; border-radius: 12px; }
        .drop-link:hover { background: #F8F9FB; }
      `}</style>

      {/* 1. Header */}
      <div className="premium-header">
        <div>
          <span className="date-chip">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</span>
          <h2 style={{margin: '8px 0 0', fontSize: '24px'}}>Hey, {user ? user.displayName.split(' ')[0] : 'Guest'} 👋</h2>
        </div>
        <div className="profile-container" ref={dropdownRef}>
          {user ? (
            <img src={user.photoURL} className="pfp-btn" onClick={() => setShowDropdown(!showDropdown)} />
          ) : (
            <button onClick={() => signInWithRedirect(auth, provider)} className="date-chip" style={{border: 'none', cursor: 'pointer'}}>Login</button>
          )}
          {showDropdown && user && (
            <div className="dropdown-menu">
              <div style={{padding:'10px 12px', fontSize:'12px', color:'#888', borderBottom:'1px solid #eee'}}>{user.displayName}</div>
              <Link href="/history" className="drop-link"><i className="fas fa-history" style={{color: 'orange'}}></i> My Orders</Link>
              <div className="drop-link" onClick={handleLogout} style={{color: '#FF3B30', cursor: 'pointer'}}><i className="fas fa-sign-out-alt"></i> Logout</div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Smart Search */}
      <div className="search-box">
        {/* ဒီနေရာမှာ '' ထည့်ပြီး ပြင်လိုက်ပါပြီ */}
        <i className="fas fa-search" style={{color: 'var(--p)'}}></i>
        <input type="text" placeholder="ID (သို့) ဟင်းပွဲရှာပါ..." value={searchQuery} onChange={handleSmartSearch} />
      </div>

      {/* 3. Dynamic Card Content */}
      <div className="tracker-card" style={{ background: searchQuery && !isTrackSearching ? '#fff' : '#1C1C1E', color: searchQuery && !isTrackSearching ? '#1C1C1E' : '#fff', border: searchQuery && !isTrackSearching ? '1px solid #eee' : 'none' }}>
        
        {/* Case A: Menu Results Search */}
        {searchQuery && searchResultItems.length > 0 && !isTrackSearching && (
          <div>
            <h4 style={{margin: '0 0 15px'}}>ရှာဖွေမှုရလဒ်များ</h4>
            <div className="menu-grid-mini">
              {searchResultItems.map(item => (
                <Link href="/customer_menu" key={item.id} className="mini-item" style={{textDecoration:'none', color:'inherit', background: '#F8F9FB'}}>
                  <img src={item.image || 'https://via.placeholder.com/100'} style={{width:'100%', height:'60px', borderRadius:'12px', objectFit:'cover'}} />
                  <div style={{fontSize:'11px', fontWeight:'bold', marginTop:'5px'}}>{item.name}</div>
                  <div style={{fontSize:'10px', color:'var(--p)'}}>{item.price} Ks</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Case B: ID Track Search */}
        {isTrackSearching && (
          searchedOrder ? (
            <div className="order-item">
               <span style={{background: 'var(--p)', padding: '4px 10px', borderRadius: '10px', fontSize: '10px'}}>SEARCH RESULT</span>
               <h2 style={{margin: '10px 0'}}>
                   {searchedOrder.status === 'New' && 'အော်ဒါလက်ခံရရှိပြီ'}
                   {searchedOrder.status === 'Cooking' && 'ချက်ပြုတ်နေပါပြီ'}
                   {searchedOrder.status === 'Ready' && 'အဆင်သင့်ဖြစ်ပါပြီ'}
                   {searchedOrder.status === 'On the way' && 'ပို့ဆောင်နေပါပြီ'}
               </h2>
               <p style={{fontSize: '12px', opacity: 0.7}}>Order ID: {searchedOrder.orderId}</p>
               <div className="progress-line">
                   <div className="progress-fill" style={{ width: 
                      searchedOrder.status === 'New' ? '25%' : 
                      searchedOrder.status === 'Cooking' ? '50%' : 
                      searchedOrder.status === 'Ready' ? '75%' : '100%' 
                   }}></div>
               </div>
            </div>
          ) : (
            <div style={{textAlign: 'center', paddingTop: '40px'}}>
              <i className="fas fa-search" style={{fontSize: '30px', opacity: 0.2}}></i>
              <p>ID မတွေ့ပါ၊ ပြန်စစ်ပေးပါ</p>
            </div>
          )
        )}

        {/* Case C: Multi-Order Slider (Default) */}
        {!searchQuery && orders.length > 0 && (
          <div className="order-slider">
            {orders.map(order => (
              <div key={order.id} className="order-item">
                <div style={{display:'flex', justifyContent:'space-between', fontSize: '12px'}}>
                   <b>
                       {order.status === 'New' && 'တင်ထားပြီးပါပြီ'}
                       {order.status === 'Cooking' && 'ချက်ပြုတ်နေပါပြီ'}
                       {order.status === 'Ready' && 'အဆင်သင့်ဖြစ်ပါပြီ'}
                   </b>
                   <span style={{opacity: 0.6}}>#{order.orderId}</span>
                </div>
                <h2 style={{margin: '15px 0'}}>
                   {order.status === 'New' ? 'Order Received 📝' : 'Now Cooking 👨‍🍳'}
                </h2>
                <div className="progress-line">
                   <div className="progress-fill" style={{ width: 
                      order.status === 'New' ? '25%' : 
                      order.status === 'Cooking' ? '50%' : 
                      order.status === 'Ready' ? '75%' : '100%' 
                   }}></div>
                </div>
                <p style={{fontSize: '11px', opacity: 0.5}}>ဘေးသို့ဆွဲ၍ အခြားအော်ဒါများကြည့်ပါ →</p>
              </div>
            ))}
          </div>
        )}

        {/* Case D: Empty State */}
        {!searchQuery && orders.length === 0 && (
          <div style={{textAlign: 'center', padding: '20px'}}>
            <div style={{fontSize: '40px', marginBottom: '10px'}}>🍕</div>
            <h3 style={{margin: 0}}>ဗိုက်ဆာနေပြီလား?</h3>
            <p style={{fontSize: '13px', opacity: 0.7}}>YNS ရဲ့ အကောင်းဆုံးလက်ရာများကို <br/> အခုပဲ မှာယူလိုက်ပါ။</p>
            <Link href="/customer_menu" style={{color: 'var(--p)', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px'}}>ဟင်းပွဲများကြည့်မည်</Link>
          </div>
        )}
      </div>

      {/* 4. Action Buttons */}
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
            
