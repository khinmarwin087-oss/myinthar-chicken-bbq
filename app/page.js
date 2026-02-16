"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, provider, db } from "../lib/firebase"; 
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [trackID, setTrackID] = useState("");
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [lastActiveOrder, setLastActiveOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }));
    
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        // နောက်ဆုံးမှာထားတဲ့ မပြီးသေးတဲ့ Order ကို အလိုအလျောက် ရှာပေးခြင်း
        const q = query(
          collection(db, "orders"), 
          where("email", "==", u.email),
          limit(10) // နောက်ဆုံး ၁၀ ခုထဲက စစ်မယ်
        );
        
        const unsubOrders = onSnapshot(q, (snap) => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Server-side createdAt မပါသေးရင် orderDate နဲ့ sort လုပ်မယ်
          list.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
          
          // မပြီးသေးတဲ့ (Cooking/Pending/Ready) အော်ဒါကို ယူမယ်
          const active = list.find(o => ['pending', 'New', 'Cooking', 'Ready'].includes(o.status));
          setLastActiveOrder(active || null);
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

  // Order Details ကို ပြတဲ့ Card (Search အတွက်ရော Auto-show အတွက်ရော သုံးရန်)
  const OrderView = ({ order, title }) => (
    <div>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:800}}>
            <span>{title || `STATUS: ${order.status.toUpperCase()}`}</span>
            <span>#{order.orderId}</span>
        </div>
        <h2 style={{fontSize: 28, margin: '12px 0'}}>
            {['New', 'pending'].includes(order.status) ? 'Received 📝' : 
             order.status === 'Cooking' ? 'Cooking 👨‍🍳' : 
             order.status === 'Ready' ? 'Ready 🥡' : 'Success ✅'}
        </h2>
        
        <div className="progress-line">
            <div className="progress-fill" style={{ width: 
                ['New', 'pending'].includes(order.status) ? '25%' : 
                order.status === 'Cooking' ? '55%' : 
                order.status === 'Ready' ? '85%' : '100%' 
            }}></div>
        </div>

        <div className="details-box">
            {order.items?.map((item, i) => {
                const qty = item.quantity || item.qty || 1;
                const price = item.price || 0;
                return (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 14, marginBottom: 6, fontWeight: 700}}>
                        <span>{item.name || item.itemName || "Item"} x {qty}</span>
                        <span>{(price * qty).toLocaleString()} Ks</span>
                    </div>
                );
            })}
            <div style={{textAlign:'right', borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:10, paddingTop:8, fontWeight:800, fontSize:18}}>
                Total: {Number(order.totalPrice).toLocaleString()} Ks
            </div>
        </div>
    </div>
  );

  if (loading) return <div style={{padding: '50px', textAlign: 'center', color: '#005BEA', fontWeight: 'bold'}}>YNS Kitchen Loading...</div>;

  return (
    <div className="main-wrapper">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <style>{`
        :root { --p: #005BEA; --bg: #F8FAFC; }
        body { background: var(--bg); font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; color: #1C1C1E; }
        .main-wrapper { padding: 25px 20px; max-width: 500px; margin: 0 auto; }
        
        .tracker-card { 
            background: linear-gradient(135deg, #00C6FB 0%, #005BEA 100%); 
            border-radius: 40px; padding: 30px; color: #fff; 
            min-height: 280px; margin-bottom: 40px; 
            box-shadow: 0 25px 50px -12px rgba(0, 91, 234, 0.4);
            position: relative; overflow: hidden;
        }

        .inner-search { 
            background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); 
            display: flex; border-radius: 22px; padding: 14px 20px; 
            margin-bottom: 25px; align-items: center; border: 1px solid rgba(255,255,255,0.3); 
        }
        .inner-search input { background: transparent; border: none; color: #fff; outline: none; width: 100%; font-size: 16px; font-weight: 700; }
        .inner-search input::placeholder { color: rgba(255,255,255,0.7); }

        .details-box { background: rgba(255,255,255,0.15); padding: 15px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); margin-top: 15px; }
        .progress-line { height: 8px; background: rgba(255,255,255,0.2); border-radius: 20px; margin: 15px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: #fff; box-shadow: 0 0 10px #fff; transition: width 1s ease; }

        .food-anim { font-size: 50px; animation: floatFood 3s ease-in-out infinite; display: inline-block; }
        @keyframes floatFood {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-20px) rotate(10deg); }
        }

        .action-card { 
            background: #fff; padding: 25px; border-radius: 32px; text-decoration: none; color: #1C1C1E; 
            box-shadow: 0 15px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; align-items: center;
            transition: 0.3s; border-bottom: 5px solid #F2F2F7;
        }
        .action-card:hover { transform: translateY(-8px); border-bottom-color: var(--p); }
      `}</style>

      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
        <div>
          <span className="date-chip" style={{background:'#fff', padding:'6px 15px', borderRadius:50, fontSize:11, fontWeight:800, color:'var(--p)'}}>{currentDate}</span>
          <h2 style={{margin:'10px 0 0', fontSize:26}}>YNS Kitchen</h2>
        </div>
        {user?.photoURL && <img src={user.photoURL} style={{width:50, height:50, borderRadius:18, border:'3px solid #fff'}} />}
      </div>

      {/* Track Card */}
      <div className="tracker-card">
        <div className="inner-search">
            <i className="fas fa-search" style={{marginRight: 12}}></i>
            <input 
              type="text" 
              inputMode="search"
              placeholder="Search Order ID..." 
              value={trackID} 
              onChange={(e) => setTrackID(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
            />
            {trackID && <i className="fas fa-times-circle" onClick={clearTrack} style={{cursor:'pointer'}}></i>}
        </div>

        {searchLoading ? (
            <div style={{textAlign:'center', padding:40}}><i className="fas fa-spinner fa-spin"></i> ခဏစောင့်ပါ...</div>
        ) : hasSearched ? (
            searchedOrder ? (
                <OrderView order={searchedOrder} title="SEARCH RESULT" />
            ) : (
                <div style={{textAlign:'center', padding:30}}>
                    <div style={{fontSize:40, marginBottom:10}}>🔍❌</div>
                    <p>အော်ဒါရှာမတွေ့ပါ <br/> ID ပြန်စစ်ပေးပါ</p>
                </div>
            )
        ) : lastActiveOrder ? (
            /* ရှာမထားရင် နောက်ဆုံးမှာထားတဲ့ အော်ဒါကို ပြခြင်း */
            <OrderView order={lastActiveOrder} title="LATEST ACTIVE ORDER" />
        ) : (
            /* မှာထားတာမရှိရင် စားချင်စဖွယ် Animation ပြခြင်း */
            <div style={{textAlign:'center', padding:10}}>
                <div style={{display:'flex', justifyContent:'center', gap:20, marginBottom:15}}>
                    <span className="food-anim">🍕</span>
                    <span className="food-anim" style={{animationDelay:'0.5s'}}>🍱</span>
                    <span className="food-anim" style={{animationDelay:'1s'}}>🥤</span>
                </div>
                <h3 style={{margin:0}}>ဗိုက်ဆာနေပြီလား?</h3>
                <p style={{fontSize:13, opacity:0.8, marginTop:10}}>အရသာရှိတဲ့ ဟင်းပွဲတွေကို <br/> အခုပဲ မှာယူလိုက်ပါ။</p>
            </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
        <Link href="/customer_menu" className="action-card">
            <div style={{width:55, height:55, background:'#E3F2FD', color:'#2196F3', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:12}}>
                <i className="fas fa-utensils"></i>
            </div>
            <b style={{fontSize:16}}>Menu</b>
            <span style={{fontSize:11, color:'#8E8E93', marginTop:5}}>မှာယူရန်</span>
        </Link>
        <Link href="/history" className="action-card">
            <div style={{width:55, height:55, background:'#F3E5F5', color:'#9C27B0', borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:12}}>
                <i className="fas fa-history"></i>
            </div>
            <b style={{fontSize:16}}>History</b>
            <span style={{fontSize:11, color:'#8E8E93', marginTop:5}}>မှတ်တမ်း</span>
        </Link>
      </div>
    </div>
  );
        }
          
