"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef(null);
  const prevPendingRef = useRef(-1);

  useEffect(() => {
    // ၁။ Password မှတ်ထားသလား စစ်ဆေးခြင်း
    const savedPass = localStorage.getItem("adminPassword") || "123456";
    const sessionAuth = sessionStorage.getItem("isAdAuthed");
    if (sessionAuth === "true") setIsAuthorized(true);

    // ၂။ ဒေတာဖတ်ခြင်း (Real-time)
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let rev = 0; let ord = 0; let pend = 0;
      let cust = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Date Format ပေါင်းစုံကို စစ်ပါတယ်
        const oDate = data.orderDate ? data.orderDate.split('T')[0] : (data.date || "");
        const status = (data.status || "").toLowerCase();

        if (oDate === today) {
          ord++;
          // Revenue ပေါင်းခြင်း
          if (["success", "done", "completed", "ready"].includes(status)) {
            rev += Number(data.totalPrice || data.total || 0);
          }
          if (data.name || data.phone) cust.add(data.name || data.phone);
        }
        if (status === "pending") pend++;
      });

      // Notification & Sound
      if (prevPendingRef.current !== -1 && pend > prevPendingRef.current) {
        if (isAudioReady && audioRef.current) audioRef.current.play().catch(() => {});
        if (Notification.permission === "granted") new Notification("🔔 New Order!");
      }

      prevPendingRef.current = pend;
      setStats({ revenue: rev, orders: ord, customers: cust.size, pending: pend });
    });

    return () => unsubscribe();
  }, [isAudioReady]);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPass = localStorage.getItem("adminPassword") || "123456";
    if (inputPass === correctPass) {
      setIsAuthorized(true);
      sessionStorage.setItem("isAdAuthed", "true"); // Page ပြန်ထွက်ရင် password ထပ်မတောင်းအောင်
    } else {
      alert("Password မှားယွင်းနေပါသည်။");
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F2F2F7'}}>
        <div style={{background:'#FFF', padding:40, borderRadius:30, textAlign:'center', width:'85%', maxWidth:350, boxShadow:'0 10px 40px rgba(0,0,0,0.05)'}}>
          <h2 style={{margin:'0 0 10px', fontSize:20}}>YNS Kitchen</h2>
          <p style={{fontSize:13, color:'#8E8E93', marginBottom:25}}>Admin Access</p>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Password" value={inputPass} onChange={e => setInputPass(e.target.value)} style={{width:'100%', padding:15, borderRadius:15, border:'1px solid #E5E5EA', marginBottom:15, textAlign:'center', fontSize:18}} />
            <button type="submit" style={{width:'100%', padding:15, borderRadius:15, border:'none', background:'#1C1C1E', color:'#FFF', fontWeight:'bold'}}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#F8F9FA', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <style jsx global>{`
        .stat-card { background: #FFF; padding: 20px; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #FFF; }
        .nav-link { background: #FFF; padding: 20px; border-radius: 20px; text-decoration: none; color: #1C1C1E; display: flex; align-items: center; gap: 15px; margin-bottom: 12px; border: 1px solid #F2F2F7; }
        .red-dot { width: 10px; height: 10px; background: #FF3B30; border-radius: 50%; margin-left: auto; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems:'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>Admin Panel</h1>
        {!isAudioReady && <button onClick={() => {setIsAudioReady(true); audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');}} style={{padding:'8px 15px', borderRadius:20, border:'none', background:'#007AFF', color:'#FFF', fontSize:12, fontWeight:'bold'}}>Enable Audio</button>}
      </div>

      {/* Revenue Section (Cleaner Design) */}
      <div className="stat-card" style={{ background: '#1C1C1E', color: '#FFF', marginBottom: '20px' }}>
        <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 700 }}>TODAY'S TOTAL REVENUE</span>
        <div style={{ fontSize: '32px', fontWeight: '900', margin: '10px 0' }}>{stats.revenue.toLocaleString()} <small style={{fontSize:15}}>Ks</small></div>
        <div style={{display:'flex', gap:20, marginTop:10, fontSize:12, opacity:0.8}}>
           <span>Orders: <b>{stats.orders}</b></span>
           <span>Pending: <b style={{color:'#FF453A'}}>{stats.pending}</b></span>
        </div>
      </div>

      <p style={{fontSize:12, fontWeight:800, color:'#8E8E93', marginBottom:15, textTransform:'uppercase'}}>Management</p>

      {/* Menu Links */}
      <Link href="/admin/orders" className="nav-link">
        <div style={{background:'#F0F7FF', color:'#007AFF', width:45, height:45, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-shopping-bag"></i></div>
        <b style={{fontSize:16}}>Active Orders</b>
        {stats.pending > 0 && <div className="red-dot"></div>}
      </Link>

      <Link href="/admin/manage_menu" className="nav-link">
        <div style={{background:'#FDF0FF', color:'#AF52DE', width:45, height:45, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-utensils"></i></div>
        <b style={{fontSize:16}}>Manage Menus</b>
      </Link>

      <Link href="/admin/history" className="nav-link">
        <div style={{background:'#F2FFF5', color:'#34C759', width:45, height:45, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-history"></i></div>
        <b style={{fontSize:16}}>Reports & History</b>
      </Link>

      <Link href="/admin/settings" className="nav-link">
        <div style={{background:'#F2F2F7', color:'#8E8E93', width:45, height:45, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-cog"></i></div>
        <b style={{fontSize:16}}>Panel Settings</b>
      </Link>
    </div>
  );
        }
          
