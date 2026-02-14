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
    // Session စစ်ဆေးခြင်း (Page ကူးရင် password ထပ်မတောင်းရန်)
    const sessionAuth = sessionStorage.getItem("isAdAuthed");
    if (sessionAuth === "true") setIsAuthorized(true);

    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0; let totalOrders = 0; let pendingCount = 0;
      let customerSet = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderDate = data.orderDate ? data.orderDate.split('T')[0] : (data.date || "");
        const status = (data.status || "").toLowerCase();

        if (orderDate === today) {
          totalOrders++;
          if (["completed", "done", "success", "ready"].includes(status)) {
            totalRevenue += Number(data.totalPrice || data.total || 0);
          }
          if (data.name || data.phone) customerSet.add(data.name || data.phone);
        }
        if (status === "pending") pendingCount++;
      });

      if (prevPendingRef.current !== -1 && pendingCount > prevPendingRef.current) {
        if (isAudioReady && audioRef.current) audioRef.current.play().catch(() => {});
        if (Notification.permission === "granted") new Notification("🔔 New Order Received!");
      }

      prevPendingRef.current = pendingCount;
      setStats({ revenue: totalRevenue, orders: totalOrders, customers: customerSet.size, pending: pendingCount });
    });

    return () => unsubscribe();
  }, [isAudioReady]);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPass = localStorage.getItem("adminPassword") || "123456";
    if (inputPass === correctPass) {
      setIsAuthorized(true);
      sessionStorage.setItem("isAdAuthed", "true");
    } else {
      alert("Password မှားယွင်းနေပါသည်။");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAdAuthed");
    setIsAuthorized(false);
  };

  // --- Login UI ---
  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', width: '300px' }}>
          <h2 style={{ marginBottom: '20px' }}>Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input type="password" placeholder="••••••" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #DDD', marginBottom: '15px', textAlign: 'center', boxSizing: 'border-box' }} autoFocus />
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Access Panel</button>
          </form>
        </div>
      </div>
    );
  }

  // --- Original Design UI ---
  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        .main-gradient-card {
            background: linear-gradient(135deg, #007AFF, #00D2FF);
            border-radius: 20px; padding: 25px; color: white; position: relative;
            box-shadow: 0 10px 25px rgba(0, 122, 255, 0.2); margin-bottom: 20px;
        }
        .nav-card {
            background: white; border-radius: 18px; padding: 20px; text-decoration: none; color: #1C1C1E;
            box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px;
            position: relative;
        }
        .badge { background: #FF3B30; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; float: right; }
        .red-dot { position: absolute; top: 10px; right: 10px; width: 10px; height: 10px; background: #FF3B30; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#8E8E93', fontWeight: 600 }}>Mingalaba!</p>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>YNS Kitchen</h1>
        </div>
        <button onClick={handleLogout} style={{ border: 'none', background: '#FFF1F0', color: '#FF3B30', padding: '8px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold' }}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>

      {!isAudioReady && (
        <div onClick={() => {setIsAudioReady(true); audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');}} style={{ background: '#007AFF', color: 'white', padding: '10px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
          🔊 အော်ဒါအသံဖွင့်ရန် နှိပ်ပေးပါ
        </div>
      )}

      {/* Revenue Card (Original Style) */}
      <div className="main-gradient-card">
        <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', opacity: 0.9 }}>Today's Revenue</h3>
        <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>Live Update: Today</span>
        <i className="fas fa-chart-line" style={{ position: 'absolute', right: '20px', bottom: '20px', fontSize: '40px', opacity: 0.2 }}></i>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', display: 'block' }}>TOTAL ORDERS</span>
          <span style={{ fontSize: '20px', fontWeight: 800 }}>{stats.orders}</span>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', display: 'block' }}>PENDING</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FF3B30' }}>{stats.pending}</span>
        </div>
      </div>

      <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', marginBottom: '15px' }}>Management</p>

      {/* Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-card">
            {stats.pending > 0 && <div className="red-dot"></div>}
            <div style={{ color: '#007AFF', background: '#F0F7FF', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-shopping-basket"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Orders {stats.pending > 0 && <span className="badge">{stats.pending}</span>}</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Live Orders</span>
            </div>
        </Link>

        <Link href="/admin/manage_menu" className="nav-card">
            <div style={{ color: '#5856D6', background: '#F5F5FF', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-utensils"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Menus</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Edit Dishes</span>
            </div>
        </Link>

        <Link href="/admin/history" className="nav-card">
            <div style={{ color: '#34C759', background: '#F2FFF5', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-history"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>History</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Past Sales</span>
            </div>
        </Link>

        <Link href="/admin/settings" className="nav-card">
            <div style={{ color: '#FF3B30', background: '#FFF2F2', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-cog"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Settings</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>App Config</span>
            </div>
        </Link>
      </div>
    </div>
  );
      }
        
