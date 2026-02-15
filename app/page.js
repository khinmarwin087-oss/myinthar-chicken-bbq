"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { onAuthStateChanged, signInWithRedirect, signOut } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  
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
    });
    return () => unsub();
  }, []);

  const handleTrackOrder = async () => {
    const rawInput = trackID.trim();
    if (!rawInput) return;

    setSearchLoading(true);
    setHasSearched(true);

    // ID Format Fix: 1234 -> ORD-1234
    let finalID = rawInput.toUpperCase();
    if (!isNaN(rawInput)) {
      finalID = `ORD-${rawInput}`;
    } else if (!finalID.startsWith('ORD-')) {
      finalID = `ORD-${finalID}`;
    }

    try {
      const q = query(collection(db, "orders"), where("orderId", "==", finalID), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setSearchedOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setSearchedOrder(null);
      }
    } catch (error) {
      console.error("Tracking error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearTrack = () => { setTrackID(""); setHasSearched(false); setSearchedOrder(null); };

  if (loading) return <div style={{padding: '50px', textAlign: 'center', color: '#005BEA', fontWeight: 'bold'}}>YNS Kitchen Loading...</div>;

  return (
    <div className="main-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        :root { --p: #005BEA; --bg: #F8FAFC; --text: #1C1C1E; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; color: var(--text); }
        .main-wrapper { padding: 25px 20px; max-width: 500px; margin: 0 auto; }
        
        /* Track Card - Bigger & More Vibrant */
        .tracker-card { 
            background: linear-gradient(135deg, #00C6FB 0%, #005BEA 100%); 
            border-radius: 40px; padding: 30px; color: #fff; 
            min-height: 250px; margin-bottom: 40px; 
            box-shadow: 0 25px 50px -12px rgba(0, 91, 234, 0.4);
            position: relative; overflow: hidden;
            animation: floating 5s ease-in-out infinite;
        }

        @keyframes floating {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
        }

        .inner-search { 
            background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); 
            display: flex; border-radius: 22px; padding: 14px 20px; 
            margin-bottom: 25px; align-items: center; border: 1px solid rgba(255,255,255,0.3); 
        }
        .inner-search input { 
            background: transparent; border: none; color: #fff; outline: none; 
            width: 100%; font-size: 16px; font-weight: 700; 
        }
        .inner-search input::placeholder { color: rgba(255,255,255,0.7); }

        .details-box { background: rgba(255,255,255,0.15); padding: 20px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.1); margin-top: 15px; }
        
        .progress-line { height: 8px; background: rgba(255,255,255,0.2); border-radius: 20px; margin: 15px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: #fff; box-shadow: 0 0 10px #fff; transition: width 1s ease; }

        /* 3D Action Cards */
        .action-card { 
            background: #fff; padding: 25px; border-radius: 32px; 
            text-decoration: none; color: #1C1C1E; 
            box-shadow: 0 15px 30px rgba(0,0,0,0.05);
            display: flex; flex-direction: column; align-items: center;
            transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border-bottom: 5px solid #F2F2F7;
        }
        .action-card:hover { transform: translateY(-12px) scale(1.02); border-bottom-color: var(--p); box-shadow: 0 25px 45px rgba(0,0,0,0.1); }
      `}</style>

      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
        <div>
          <span className="date-chip" style={{background:'#fff', padding:'6px 15px', borderRadius:50, fontSize:11, fontWeight:800, color:'var(--p)', boxShadow:'0 4px 10px rgba(0,0,0,0.05)'}}>{currentDate}</span>
          <h2 style={{margin:'10px 0 0', fontSize:26}}>Hey, {user?.displayName?.split(' ')[0] || 'Guest'} 👋</h2>
        </div>
        <div onClick={() => setShowDropdown(!showDropdown)} style={{cursor:'pointer', position:'relative'}}>
          {user?.photoURL ? (
            <img src={user.photoURL} style={{width:50, height:50, borderRadius:18, border:'3px solid #fff', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}} />
          ) : (
            <div style={{width:50, height:50, borderRadius:18, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-user"></i></div>
          )}
          {showDropdown && (
            <div style={{position:'absolute', right:0, top:60, background:'#fff', padding:15, borderRadius:20, boxShadow:'0 10px 30px rgba(0,0,0,0.1)', zIndex:100, width:150}}>
               <div onClick={() => signOut(auth)} style={{color:'red', fontWeight:800, textAlign:'center'}}>Logout</div>
            </div>
          )}
        </div>
      </div>

      {/* Track Card */}
      <div className="tracker-card">
        <div className="inner-search">
            <i className="fas fa-fingerprint" style={{marginRight: 12}}></i>
            <input 
              type="text" 
              placeholder="Order ID (e.g. 101)" 
              value={trackID} 
              onChange={(e) => setTrackID(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
            />
            {trackID && <i className="fas fa-times-circle" onClick={clearTrack} style={{cursor:'pointer'}}></i>}
        </div>

        {searchLoading ? (
            <div style={{textAlign:'center', padding:40}}><i className="fas fa-spinner fa-spin"></i> Loading Details...</div>
        ) : hasSearched && searchedOrder ? (
            <div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:800}}>
                    <span>ORDER STATUS</span>
                    <span>#{searchedOrder.orderId}</span>
                </div>
                <h2 style={{fontSize: 32, margin: '15px 0'}}>
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
                    <b style={{fontSize: 13, display:'block', marginBottom:10, opacity:0.8}}>Order Items:</b>
                    {searchedOrder.items?.map((item, i) => (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 15, marginBottom: 6, fontWeight: 700}}>
                            {/* item.name ဒါမှမဟုတ် item.itemName ဖြစ်နိုင်လို့ နှစ်ခုလုံးကို ညှိထားပါတယ် */}
                            <span>{item.name || item.itemName} × {item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString()} Ks</span>
                        </div>
                    ))}
                    <div style={{textAlign:'right', borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:12, paddingTop:10, fontWeight:800, fontSize:20}}>
                        Total: {Number(searchedOrder.totalPrice).toLocaleString()} Ks
                    </div>
                </div>
            </div>
        ) : (
            <div style={{textAlign:'center', padding:'20px 0'}}>
                <div style={{fontSize:60, marginBottom:15}}>📦</div>
                <h3 style={{margin:0}}>Track Your Order</h3>
                <p style={{fontSize:14, opacity:0.8, marginTop:10}}>Order ID (နံပါတ်) ကို ရိုက်ထည့်ပြီး <br/> Details များကို ကြည့်ရှုနိုင်ပါသည်။</p>
            </div>
        )}
      </div>

      {/* 3D Action Cards */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:10}}>
        <Link href="/customer_menu" className="action-card">
            <div style={{width:55, height:55, background:'#E3F2FD', color:'#2196F3', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:12}}>
                <i className="fas fa-utensils"></i>
            </div>
            <b style={{fontSize:16}}>Menu</b>
            <span style={{fontSize:11, color:'#8E8E93', marginTop:5}}>ဟင်းပွဲများမှာယူရန်</span>
        </Link>
        <Link href="/history" className="action-card">
            <div style={{width:55, height:55, background:'#F3E5F5', color:'#9C27B0', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:12}}>
                <i className="fas fa-history"></i>
            </div>
            <b style={{fontSize:16}}>History</b>
            <span style={{fontSize:11, color:'#8E8E93', marginTop:5}}>မှာယူမှုမှတ်တမ်း</span>
        </Link>
      </div>

      <p style={{textAlign:'center', fontSize:11, color:'#AEAEB2', marginTop:40}}>© 2024 YNS Kitchen • Premium Quality</p>
    </div>
  );
}
