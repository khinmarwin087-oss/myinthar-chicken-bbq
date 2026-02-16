"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [isServiceActive, setIsServiceActive] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  
  const lastPendingCount = useRef(null);

  // Debug Log ထည့်ရန် Function
  const addLog = (msg) => {
    setDebugLog(prev => [new Date().toLocaleTimeString() + ": " + msg, ...prev].slice(0, 5));
  };

  // အသံထွက်ပေးမည့် Function (Speech Synthesis - အသံဖိုင်မလိုပါ)
  const speakNotification = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // မြန်မာစာအတွက် en-US သို့မဟုတ် ရနိုင်သော voice ကိုသုံးပါမည်
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
      addLog("🔊 Speaking: " + text);
    } else {
      addLog("❌ Speech not supported");
    }
  };

  // စနစ်စတင်ရန် Function
  const activateServices = async () => {
    addLog("Attempting to activate...");
    
    // ၁။ Notification Permission
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      addLog("Notification Permission: " + perm);
    }

    // ၂။ Audio Context & Speech Test
    setIsServiceActive(true);
    speakNotification("System Activated. Waiting for orders.");
    
    if (Notification.permission === "granted") {
      new Notification("🔔 System Active", { body: "Ready for new orders!" });
    } else {
      alert("Notification ပိတ်ထားပါသဖြင့် စာသားပေါ်လာမည်မဟုတ်ပါ။");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("isAdAuthed") === "true") setIsAuthorized(true);

    const q = query(collection(db, "orders"));
    addLog("Connecting to Firestore...");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      addLog("Data Received from Firebase");
      
      const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
      let rev = 0, ordToday = 0, pend = 0, customerSet = new Set();

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
        if (status === "pending") pend++;
      });

      // New Order Detection Logic
      if (lastPendingCount.current !== null && pend > lastPendingCount.current) {
        addLog("🔥 NEW ORDER DETECTED!");
        
        // အသံထွက်ခိုင်းခြင်း
        speakNotification("New order received. Please check.");

        // Notification ပြခြင်း
        if (Notification.permission === "granted") {
          try {
            new Notification("🔔 New Order!", { body: `You have ${pend} pending orders.` });
            addLog("✅ Notification Sent");
          } catch (e) {
            addLog("❌ Notification Failed: " + e.message);
          }
        }
      }

      lastPendingCount.current = pend;
      setStats({ revenue: rev, orders: ordToday, customers: customerSet.size, pending: pend });
    }, (error) => addLog("❌ Firebase Error: " + error.message));

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
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '300px' }}>
          <h2 style={{textAlign: 'center', marginBottom: 20}}>Admin Login</h2>
          <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ddd', textAlign: 'center' }} placeholder="Password" autoFocus />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        .card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .nav-item { background: white; border-radius: 18px; padding: 20px; text-decoration: none; color: #1C1C1E; display: flex; flex-direction: column; gap: 10px; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .red-dot { position: absolute; top: 12px; right: 12px; width: 10px; height: 10px; background: #FF3B30; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .debug-box { background: #1C1C1E; color: #34C759; padding: 15px; borderRadius: 15px; font-family: monospace; font-size: 10px; margin-bottom: 20px; }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>YNS Admin</h1>
        <button onClick={() => {sessionStorage.removeItem("isAdAuthed"); setIsAuthorized(false);}} style={{ border: 'none', background: '#FFF1F0', color: '#FF3B30', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold' }}>Logout</button>
      </div>

      {/* Debug Logs - ပြဿနာကို ရှာရန် */}
      <div className="debug-box">
        <div style={{fontWeight: 'bold', marginBottom: 5, color: '#FF9500'}}>SYSTEM LOGS:</div>
        {debugLog.map((log, i) => <div key={i}>{log}</div>)}
      </div>

      {!isServiceActive && (
        <button onClick={activateServices} style={{ width: '100%', padding: '15px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
          🚀 စနစ်စတင်ရန် နှိပ်ပါ (Activate Now)
        </button>
      )}

      <div style={{ background: 'linear-gradient(135deg, #007AFF, #00D2FF)', borderRadius: '20px', padding: '25px', color: 'white', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>TODAY'S REVENUE</h3>
        <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>{stats.orders} Orders Today</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div className="card">
          <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 700 }}>CUSTOMERS</span>
          <span style={{ fontSize: '20px', fontWeight: 800, display: 'block' }}>{stats.customers}</span>
        </div>
        <div className="card" style={{ border: stats.pending > 0 ? '2px solid #FF3B30' : 'none' }}>
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
