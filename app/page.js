"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";
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

  const handleTrackOrder = async () => {
    if (!trackID.trim()) return;
    setHasSearched(true);
    const searchID = trackID.toUpperCase().startsWith('ORD-') ? trackID.toUpperCase() : "ORD-" + trackID.toUpperCase();
    const q = query(collection(db, "orders"), where("orderId", "==", searchID));
    const snap = await getDocs(q);
    if (!snap.empty) setSearchedOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
    else setSearchedOrder(null);
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
        
        /* Header */
        .premium-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .date-chip { background: #fff; padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 800; color: var(--p); box-shadow: 0 4px 12px rgba(0,122,255,0.12); }
        
        /* Search Box */
        .search-box { background: #fff; display: flex; align-items: center; padding: 14px 20px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); margin-bottom: 30px; position: relative; border: 1px solid rgba(0,0,0,0.02); }
        .search-box input { border: none; outline: none; margin-left: 12px; font-weight: 600; width: 80%; color: var(--text); background: transparent; }
        .clear-btn { position: absolute; right: 18px; color: #D1D1D6; cursor: pointer; font-size: 18px; transition: 0.3s; }
        .clear-btn:hover { color: #FF3B30; }

        /* Order Tracker Card - Enhanced */
        .tracker-card { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            border-radius: 40px; padding: 30px; color: #fff; 
            min-height: 280px; margin-bottom: 40px; 
            box-shadow: 0 25px 50px -12px rgba(118, 75, 162, 0.35);
            position: relative;
            overflow: hidden;
            animation: floating 6s ease-in-out infinite;
        }

        @keyframes floating {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }

        .tracker-card::before {
            content: ''; position: absolute; top: -50px; right: -50px; width: 150px; height: 150px;
            background: rgba(255,255,255,0.1); border-radius: 50%;
        }
        
        .inner-search { background: rgba(255,255,255,0.18); backdrop-filter: blur(10px); display: flex; border-radius: 20px; padding: 12px 18px; margin-bottom: 25px; align-items: center; border: 1px solid rgba(255,255,255,0.2); }
        .inner-search input { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-size: 15px; font-weight: 500; }
        .inner-search input::placeholder { color: rgba(255,255,255,0.6); }

        .order-slider { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 20px; scrollbar-width: none; }
        .order-slider::-webkit-scrollbar { display: none; }
        .order-item { min-width: 100%; scroll-snap-align: start; cursor: pointer; }
        
        .progress-line { height: 8px; background: rgba(255,255,255,0.15); border-radius: 20px; margin: 20px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: #fff; border-radius: 20px; width: 0%; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px rgba(255,255,255,0.5); }
        
        .mini-card { background: rgba(255,255,255,0.12); padding: 18px; border-radius: 24px; margin-top: 15px; border: 1px solid rgba(255,255,255,0.1); }

        /* 3D Action Cards */
        .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .action-card { 
            background: #fff; padding: 25px; border-radius: 30px; 
            text-decoration: none; color: inherit; 
            box-shadow: 0 15px 35px rgba(0,0,0,0.05);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex; flex-direction: column; align-items: center;
            border-bottom: 4px solid #eee;
        }
        .action-card:hover { transform: translateY(-12px) scale(1.02); box-shadow: 0 25px 45px rgba(0,0,0,0.08); border-bottom-color: var(--p); }
        .icon-box { width: 50px; height: 50px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 22px; }

        /* Menu Result Animation */
        .menu-item-3d { 
            background: #fff; padding: 12px; border-radius: 22px; 
            text-decoration: none; color: inherit; text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            transition: 0.3s; border: 1px solid rgba(0,0,0,0.02);
        }
        .menu-item-3d:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
      `}</style>

      {/* Header */}
      <div className="premium-header">
        <div>
          <span className="date-chip">{currentDate}</span>
          <h2 style={{margin: '10px 0 0', fontSize: '26px', letterSpacing: '-0.5px'}}>Hey, {user ? user.displayName.split(' ')[0] : 'Guest'} 👋</h2>
        </div>
        <div className="profile-container" ref={dropdownRef} style={{position: 'relative'}}>
            {user ? (
                <img src={user.photoURL} style={{width: 50, height: 50, borderRadius: 18, border: '4px solid #fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.1)'}} onClick={() => setShowDropdown(!showDropdown)} />
            ) : (
                <button onClick={() => signInWithRedirect(auth, provider)} className="date-chip" style={{border: 'none', cursor: 'pointer'}}>Login</button>
            )}
            {showDropdown && (
                <div style={{position:'absolute', right:0, top:65, background:'#fff', padding:18, borderRadius:24, boxShadow:'0 15px 40px rgba(0,0,0,0.12)', zIndex:100, width:190, animation: 'slideIn 0.3s ease'}}>
                    <Link href="/history" style={{display:'flex', alignItems: 'center', gap: 10, textDecoration:'none', color:'#333', marginBottom:15, fontWeight:700}}>
                        <i className="fas fa-history" style={{color: '#FF9500'}}></i> History
                    </Link>
                    <div onClick={() => signOut(auth)} style={{display:'flex', alignItems: 'center', gap: 10, color:'red', fontWeight:700, cursor:'pointer'}}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* 1. Menu Search Bar */}
      <div className="search-box">
        <i className="fas fa-utensils" style={{color: 'var(--p)'}}></i>
        <input type="text" placeholder="ဟင်းပွဲနာမည်ဖြင့် ရှာဖွေပါ..." value={menuSearch} onChange={handleMenuSearch} />
        {menuSearch && <i className="fas fa-times-circle clear-btn" onClick={clearMenuSearch}></i>}
      </div>

      {/* Menu Search Results (3D Cards) */}
      {menuSearch && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15, marginBottom:35}}>
            {searchResultItems.map(item => (
                <Link href="/customer_menu" key={item.id} className="menu-item-3d">
                    <img src={item.image} style={{width:'100%', height:85, borderRadius:16, objectFit:'cover'}} />
                    <div style={{fontSize:13, fontWeight:800, marginTop:10}}>{item.name}</div>
                    <div style={{fontSize:12, color: 'var(--p)', fontWeight: 700}}>{item.price} Ks</div>
                </Link>
            ))}
        </div>
      )}

      {/* 2. Order Tracker Card (BIG & GRADIENT) */}
      <div className="tracker-card">
        <div className="inner-search">
            <i className="fas fa-search-location" style={{marginRight: 12, opacity: 0.8}}></i>
            <input 
              type="text" 
              placeholder="Track Order ID (e.g. 1234)" 
              value={trackID} 
              onChange={(e) => setTrackID(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
            />
            {trackID && <i className="fas fa-times-circle" onClick={clearTrack} style={{marginLeft:10, cursor:'pointer', opacity: 0.7}}></i>}
        </div>

        {hasSearched ? (
            /* SEARCH RESULT WITH DETAILS */
            searchedOrder ? (
                <div className="order-item" onClick={() => router.push('/history')}>
                    <span style={{fontSize: 10, background: 'rgba(255,255,255,0.25)', padding: '5px 12px', borderRadius: 10, fontWeight: 800}}>FOUND ORDER</span>
                    <h2 style={{margin: '12px 0 5px', fontSize: 32}}>
                        {searchedOrder.status === 'New' && 'Received 📝'}
                        {searchedOrder.status === 'Cooking' && 'Cooking 👨‍🍳'}
                        {searchedOrder.status === 'Ready' && 'Ready 🥡'}
                        {searchedOrder.status === 'Success' && 'Success ✅'}
                    </h2>
                    <p style={{fontSize: 13, opacity: 0.9, marginBottom: 5}}>ID: {searchedOrder.orderId}</p>
                    
                    <div className="progress-line">
                        <div className="progress-fill" style={{ width: 
                            searchedOrder.status === 'New' ? '25%' : 
                            searchedOrder.status === 'Cooking' ? '50%' : 
                            searchedOrder.status === 'Ready' ? '75%' : '100%' 
                        }}></div>
                    </div>

                    <div className="mini-card" style={{marginTop: 15}}>
                         {searchedOrder.items?.map((item, i) => (
                             <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4}}>
                                 <span>{item.name} x {item.quantity}</span>
                                 <span>{item.price * item.quantity} Ks</span>
                             </div>
                         ))}
                         <div style={{borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:8, paddingTop:8, textAlign:'right', fontWeight:800}}>
                             Total: {searchedOrder.totalPrice} Ks
                         </div>
                    </div>
                </div>
            ) : <div style={{textAlign:'center', paddingTop: 30}}><i className="fas fa-ghost" style={{fontSize: 40, opacity:0.3, marginBottom: 10}}></i><p>အော်ဒါမတွေ့ပါ</p></div>
        ) : (
            /* DEFAULT VIEW (RECENT ORDERS) */
            orders.length > 0 ? (
                <div className="order-slider">
                    {orders.slice(0, 3).map(order => (
                        <div key={order.id} className="order-item" onClick={() => router.push('/history')}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                                <h3 style={{margin: 0, fontSize: 24}}>{order.status} ✨</h3>
                                <span style={{opacity: 0.6, fontSize: 12, fontWeight: 700}}>#{order.orderId}</span>
                            </div>
                            
                            <div className="progress-line">
                                <div className="progress-fill" style={{ width: 
                                    order.status === 'New' ? '25%' : 
                                    order.status === 'Cooking' ? '50%' : 
                                    order.status === 'Ready' ? '75%' : '100%' 
                                }}></div>
                            </div>

                            <div className="mini-card">
                                {order.items?.slice(0, 2).map((item, idx) => (
                                    <div key={idx} style={{display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 4}}>
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>{item.price * item.quantity} Ks</span>
                                    </div>
                                ))}
                                <div style={{marginTop: 8, textAlign:'right', fontWeight:800, fontSize: 15}}>
                                    Total: {order.totalPrice} Ks
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{textAlign:'center', padding: '15px 0'}}>
                    <div style={{fontSize: 55, marginBottom: 15, animation: 'floating 3s infinite'}}>🍕</div>
                    <h3 style={{margin: 0, fontSize: 22}}>Hungry Now?</h3>
                    <p style={{fontSize: 13, opacity: 0.8, margin: '10px 0 20px'}}>အကောင်းဆုံးဟင်းပွဲများကို အခုပဲ မှာယူလိုက်ပါ။</p>
                    <Link href="/customer_menu" style={{background: '#fff', color: '#764ba2', padding: '12px 25px', borderRadius: 15, textDecoration: 'none', fontWeight: 800, boxShadow: '0 10px 20px rgba(0,0,0,0.1)'}}>ဟင်းပွဲများ ကြည့်မည်</Link>
                </div>
            )
        )}
      </div>

      {/* 3. Action Buttons (3D Floating Style) */}
      <div className="action-grid">
        <Link href="/customer_menu" className="action-card">
          <div className="icon-box" style={{background: '#E6F2FF', color: '#007AFF'}}>
            <i className="fas fa-shopping-cart"></i>
          </div>
          <b style={{fontSize: '15px'}}>Order Now</b>
          <span style={{fontSize: '11px', color: '#8E8E93', marginTop: 4}}>ဟင်းပွဲများမှာယူရန်</span>
        </Link>
        
        <Link href="https://m.me/yourpage" className="action-card">
          <div className="icon-box" style={{background: '#FFF2F2', color: '#FF3B30'}}>
            <i className="fas fa-comment-dots"></i>
          </div>
          <b style={{fontSize: '15px'}}>Help Center</b>
          <span style={{fontSize: '11px', color: '#8E8E93', marginTop: 4}}>အကူအညီရယူရန်</span>
        </Link>
      </div>

      <p style={{textAlign:'center', fontSize: 12, color: '#AEAEB2', marginTop: 40, paddingBottom: 20}}>
        © 2024 YNS Premium Kitchen • Quality Food
      </p>
    </div>
  );
              }
                           
