"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef(null);
  const prevPendingRef = useRef(-1);

  useEffect(() => {
    // ၁။ Auth Session စစ်ဆေးခြင်း
    const sessionAuth = sessionStorage.getItem("isAdAuthed");
    if (sessionAuth === "true") setIsAuthorized(true);

    // ၂။ Service Worker & Notification Setup
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(reg => console.log('Worker Registered!', reg.scope))
        .catch(err => console.log('Worker Error!', err));
    }
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // ၃။ Audio Setup
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

    // ၄။ Real-time Firestore Listener (Refresh မလိုအောင် လုပ်ဆောင်ပေးသည့်အပိုင်း)
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0;
      let totalOrdersToday = 0;
      let pendingCount = 0;
      let customerSet = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const rawDate = data.orderDate || data.date || "";
        const orderDateStr = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        const status = (data.status || "").toLowerCase();

        // ယနေ့အော်ဒါစာရင်းတွက်ချက်ခြင်း
        if (orderDateStr === todayStr) {
          totalOrdersToday++;
          if (["completed", "done", "success", "ready"].includes(status)) {
            totalRevenue += Number(data.totalPrice || data.total || 0);
          }
          if (data.name || data.customerName) customerSet.add(data.name || data.customerName);
        }
        
        // Pending အရေအတွက်
        if (status === "pending") {
          pendingCount++;
        }
      });

      // ၅။ အော်ဒါအသစ်ဝင်လျှင် အသံနှင့် Notification ပေးခြင်း
      if (prevPendingRef.current !== -1 && pendingCount > prevPendingRef.current) {
        if (isAudioReady && audioRef.current) {
          audioRef.current.play().catch(e => console.log("Audio Play Error"));
        }
        new Notification("🔔 Order အသစ်ရပါပြီ", { body: "YNS Kitchen မှာ အော်ဒါအသစ်တစ်ခု ရောက်ရှိလာပါတယ်။" });
      }

      prevPendingRef.current = pendingCount;
      setStats({
        revenue: totalRevenue,
        orders: totalOrdersToday,
        customers: customerSet.size,
        pending: pendingCount
      });
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [isAudioReady]);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPass = localStorage.getItem("adminPassword") || "123456";
    if (inputPass === correctPass) {
      setIsAuthorized(true);
      sessionStorage.setItem("isAdAuthed", "true");
    } else { alert("Password မှားယွင်းနေပါသည်။"); }
  };

  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', width: '300px' }}>
          <h2 style={{marginBottom: 20}}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="Password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #DDD', marginBottom: '15px', textAlign: 'center', boxSizing: 'border-box' }} autoFocus />
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        .main-card { background: linear-gradient(135deg, #007AFF, #00D2FF); border-radius: 20px; padding: 25px; color: white; position: relative; margin-bottom: 20px; }
        .nav-item { background: white; border-radius: 18px; padding: 20px; text-decoration: none; color: #1C1C1E; display: flex; flex-direction: column; gap: 10px; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        .red-dot { position: absolute; top: 12px; right: 12px; width: 10px; height: 10px; background: #FF3B30; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>YNS Admin</h1>
        <button onClick={() => {sessionStorage.removeItem("isAdAuthed"); setIsAuthorized(false);}} style={{ border: 'none', background: '#FFF1F0', color: '#FF3B30', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold' }}>Logout</button>
      </div>

      {!isAudioReady && (
        <div onClick={() => setIsAudioReady(true)} style={{ background: '#007AFF', color: 'white', padding: '12px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
          🔊 အော်ဒါအသံဖွင့်ရန် နှိပ်ပါ
        </div>
      )}

      <div className="main-card">
        <h3 style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>TODAY'S REVENUE</h3>
        <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>Live Syncing...</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{background:'white', padding:15, borderRadius:18}}>
          <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 700 }}>TODAY ORDERS</span>
          <span style={{ fontSize: '20px', fontWeight: 800, display: 'block' }}>{stats.orders}</span>
        </div>
        <div style={{background:'white', padding:15, borderRadius:18}}>
          <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 700 }}>PENDING</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FF3B30', display: 'block' }}>{stats.pending}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-item">
            {stats.pending > 0 && <div className="red-dot"></div>}
            <i className="fas fa-shopping-basket" style={{color: '#007AFF'}}></i>
            <b style={{ fontSize: '15px' }}>Orders</b>
        </Link>
        <Link href="/admin/manage_menu" className="nav-item">
            <i className="fas fa-utensils" style={{color: '#5856D6'}}></i>
            <b style={{ fontSize: '15px' }}>Menus</b>
        </Link>
        <Link href="/admin/history" className="nav-item">
            <i className="fas fa-history" style={{color: '#34C759'}}></i>
            <b style={{ fontSize: '15px' }}>History</b>
        </Link>
        <Link href="/admin/settings" className="nav-item">
            <i className="fas fa-cog" style={{color: '#FF3B30'}}></i>
            <b style={{ fontSize: '15px' }}>Settings</b>
        </Link>
      </div>
    </div>
  );
        }
        
