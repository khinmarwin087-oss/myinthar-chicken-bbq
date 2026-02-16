"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [debugMsg, setDebugMsg] = useState("Initializing...");
  
  const audioRef = useRef(null);
  const lastOrderCount = useRef(null);

  // ၁။ Audio & Notification Permission
  const startService = async () => {
    // Audio Enable
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioEnabled(true);
        setDebugMsg("Audio & Notifications Active ✅");
      } catch (e) {
        console.error("Audio play failed", e);
        setDebugMsg("Audio Blocked by Browser ❌");
      }
    }

    // Notification Permission
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Notification ခွင့်ပြုချက်မပေးထားပါက အော်ဒါအသစ်တက်လာလျှင် စာပို့ပေးမည်မဟုတ်ပါ။");
      }
    }
  };

  useEffect(() => {
    // Auth Check
    if (sessionStorage.getItem("isAdAuthed") === "true") setIsAuthorized(true);

    // Audio Setup
    audioRef.current = new Audio('/order-sound.mp3');
    audioRef.current.loop = false;

    // Firestore Real-time Listener
    // query ကို ရိုးရှင်းအောင်ထားပြီး အကုန်ဆွဲထုတ်ပါမယ်
    const q = query(collection(db, "orders"));

    setDebugMsg("Connecting to Firestore...");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDebugMsg(`Connected! Last update: ${new Date().toLocaleTimeString()}`);
      
      const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
      let rev = 0; 
      let ordToday = 0; 
      let pend = 0;
      let customerSet = new Set();
      let currentPendingOrders = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const rawDate = data.orderDate || data.date || "";
        const orderDateStr = rawDate.split('T')[0];
        const status = (data.status || "").toLowerCase();

        if (orderDateStr === todayStr) {
          ordToday++;
          if (["completed", "done", "success", "ready"].includes(status)) {
            rev += Number(data.totalPrice || data.total || 0);
          }
          if (data.name || data.customerName) customerSet.add(data.name || data.customerName);
        }
        
        if (status === "pending") {
          pend++;
          currentPendingOrders.push({ id: doc.id, ...data });
        }
      });

      // --- အသံနှင့် Notification Logic ---
      // အရင်ကထက် ပိုရိုးရှင်းအောင် Pending အရေအတွက် တိုးလာတာနဲ့ မြည်အောင်လုပ်ပါမယ်
      if (lastOrderCount.current !== null && pend > lastOrderCount.current) {
        console.log("New Order Detected!");
        
        // ၁။ အသံဖွင့်ခြင်း
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(err => console.log("Audio play error:", err));
        }

        // ၂။ Notification ပြခြင်း
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🔔 Order အသစ်ရရှိပါသည်", {
            body: `Pending Orders: ${pend}`,
            icon: "/icon-192.png"
          });
        }
      }

      // State Update
      lastOrderCount.current = pend;
      setStats({ revenue: rev, orders: ordToday, customers: customerSet.size, pending: pend });

    }, (error) => {
      console.error("Firestore Error:", error);
      setDebugMsg(`Connection Error: ${error.message} ❌`);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPass === (localStorage.getItem("adminPassword") || "123456")) {
      setIsAuthorized(true);
      sessionStorage.setItem("isAdAuthed", "true");
    } else { alert("Password မှားယွင်းနေပါသည်။"); }
  };

  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '320px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <h2 style={{textAlign: 'center', marginBottom: 30, color: '#1C1C1E', fontWeight: '800'}}>Admin Login</h2>
          <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '12px', border: '2px solid #E5E5EA', textAlign: 'center', fontSize: '18px', outline: 'none' }} placeholder="••••••" autoFocus />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, sans-serif' }}>
      <style jsx global>{`
        .card { background: white; border-radius: 24px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .stat-label { font-size: 12px; color: #8E8E93; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 28px; font-weight: 800; color: #1C1C1E; display: block; margin-top: 5px; }
        .nav-btn { background: white; border-radius: 20px; padding: 20px; text-decoration: none; color: #1C1C1E; display: flex; flex-direction: column; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.2s; border: 1px solid transparent; }
        .nav-btn:active { transform: scale(0.95); background: #F2F2F7; }
        .pulse-red { width: 12px; height: 12px; background: #FF3B30; border-radius: 50%; position: absolute; top: 15px; right: 15px; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '12px', color: stats.pending > 0 ? '#FF3B30' : '#8E8E93', margin: '5px 0 0 0', fontWeight: '600' }}>
            {debugMsg}
          </p>
        </div>
        <button onClick={() => {sessionStorage.removeItem("isAdAuthed"); setIsAuthorized(false);}} style={{ border: 'none', background: '#FFE5E5', color: '#FF3B30', padding: '10px 18px', borderRadius: '12px', fontWeight: '700', fontSize: '14px' }}>Logout</button>
      </div>

      {/* Activation Button */}
      {!isAudioEnabled && (
        <button onClick={startService} style={{ width: '100%', padding: '18px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '20px', marginBottom: '25px', fontWeight: '800', fontSize: '16px', boxShadow: '0 8px 20px rgba(0,122,255,0.3)', cursor: 'pointer' }}>
          <i className="fas fa-bell" style={{marginRight: '10px'}}></i> အော်ဒါအသံနှင့် Notification ဖွင့်ရန်နှိပ်ပါ
        </button>
      )}

      {/* Main Stats */}
      <div style={{ background: 'linear-gradient(135deg, #1C1C1E, #3A3A3C)', borderRadius: '28px', padding: '30px', color: 'white', marginBottom: '25px', boxShadow: '0 15px 30px rgba(0,0,0,0.15)' }}>
        <span style={{ fontSize: '13px', opacity: 0.7, fontWeight: '600' }}>TODAY'S REVENUE</span>
        <div style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0' }}>{stats.revenue.toLocaleString()} <span style={{fontSize: '20px'}}>Ks</span></div>
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 15px', borderRadius: '12px', fontSize: '12px' }}>
                <i className="fas fa-shopping-cart" style={{marginRight: '6px'}}></i> {stats.orders} Orders
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 15px', borderRadius: '12px', fontSize: '12px' }}>
                <i className="fas fa-users" style={{marginRight: '6px'}}></i> {stats.customers} Customers
            </div>
        </div>
      </div>

      {/* Pending Highlight */}
      <div className="card" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: stats.pending > 0 ? '2px solid #FF3B30' : '2px solid transparent' }}>
        <div>
          <span className="stat-label">Pending Orders</span>
          <span className="stat-value" style={{ color: stats.pending > 0 ? '#FF3B30' : '#1C1C1E' }}>{stats.pending}</span>
        </div>
        <div style={{ background: stats.pending > 0 ? '#FF3B30' : '#E5E5EA', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <i className="fas fa-clock" style={{fontSize: '20px'}}></i>
        </div>
      </div>

      {/* Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-btn" style={{position: 'relative'}}>
          {stats.pending > 0 && <div className="pulse-red"></div>}
          <div style={{ background: '#E5F1FF', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF' }}>
            <i className="fas fa-list-ul" style={{fontSize: '20px'}}></i>
          </div>
          <b style={{fontSize: '15px'}}>Orders</b>
        </Link>
        
        <Link href="/admin/manage_menu" className="nav-btn">
          <div style={{ background: '#F2F2F7', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5856D6' }}>
            <i className="fas fa-utensils" style={{fontSize: '20px'}}></i>
          </div>
          <b style={{fontSize: '15px'}}>Menus</b>
        </Link>

        <Link href="/admin/history" className="nav-btn">
          <div style={{ background: '#E8F9EE', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759' }}>
            <i className="fas fa-history" style={{fontSize: '20px'}}></i>
          </div>
          <b style={{fontSize: '15px'}}>History</b>
        </Link>

        <Link href="/admin/settings" className="nav-btn">
          <div style={{ background: '#F2F2F7', width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
            <i className="fas fa-cog" style={{fontSize: '20px'}}></i>
          </div>
          <b style={{fontSize: '15px'}}>Settings</b>
        </Link>
      </div>

      {/* Footer Debug Info */}
      <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '10px', color: '#C7C7CC' }}>
        YNS Admin Panel v2.0 • Real-time Engine Active
      </div>
    </div>
  );
    }
