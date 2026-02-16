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
  const [debugMsg, setDebugMsg] = useState("Initializing...");
  
  const audioRef = useRef(null);
  const lastPendingCount = useRef(null);

  // အသံမြည်စေရန် Function (Fallback ပါဝင်သည်)
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Audio Play Error:", err);
        // အသံဖိုင်ဖွင့်မရပါက Browser Beep အသံလုပ်ရန် ကြိုးစားခြင်း
        try {
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = context.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, context.currentTime);
          oscillator.connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.5);
        } catch (e) { console.log("Beep failed"); }
      });
    }
  };

  // ၁။ အသံနှင့် Notification ကို စတင်ဖွင့်လှစ်ခြင်း
  const activateServices = async () => {
    // Browser Notification Permission တောင်းခြင်း
    if ("Notification" in window) {
      await Notification.requestPermission();
    }

    // Audio Activation
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsServiceActive(true);
        setDebugMsg("System Active ✅");
        
        if (Notification.permission === "granted") {
          new Notification("🔔 စနစ်စတင်ပါပြီ", { body: "အော်ဒါအသစ်ဝင်လာပါက အသိပေးပါမည်။" });
        }
      }).catch(err => {
        console.error("Activation Error:", err);
        alert("အသံဖွင့်ရန် အခက်အခဲရှိနေပါသည်။ အသံဖိုင်လမ်းကြောင်း မှားနေခြင်း သို့မဟုတ် Browser က ပိတ်ထားခြင်း ဖြစ်နိုင်ပါသည်။");
      });
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("isAdAuthed") === "true") setIsAuthorized(true);

    // အသံဖိုင်လမ်းကြောင်းကို သေချာစစ်ဆေးပါ (Public folder ထဲက ဖိုင်အမည်အတိအကျ ဖြစ်ရပါမယ်)
    // အောက်ပါအမည်သည် သင်ပေးထားသော attachment ထဲမှ အမည်ဖြစ်သည်
    const soundFileName = '/soundreality-အသိပေးချက်-၃-၁၅၈၁၈၉.mp3';
    audioRef.current = new Audio(soundFileName);
    audioRef.current.load();

    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDebugMsg(`Live Syncing... ${new Date().toLocaleTimeString()}`);
      
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

      // New Order Detection
      if (lastPendingCount.current !== null && pend > lastPendingCount.current) {
        playNotificationSound();
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🔔 Order အသစ်တစ်ခု ရောက်ရှိ!", {
            body: `လက်ရှိ Pending Order ${pend} ခု ရှိနေပါသည်။`,
            icon: "/icon-192.png"
          });
        }
      }

      lastPendingCount.current = pend;
      setStats({ revenue: rev, orders: ordToday, customers: customerSet.size, pending: pend });
    }, (error) => setDebugMsg("Connection Lost ❌"));

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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC' }}>
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
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>YNS Admin</h1>
          <span style={{ fontSize: '11px', color: '#8E8E93' }}>{debugMsg}</span>
        </div>
        <button onClick={() => {sessionStorage.removeItem("isAdAuthed"); setIsAuthorized(false);}} style={{ border: 'none', background: '#FFF1F0', color: '#FF3B30', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold' }}>Logout</button>
      </div>

      {!isServiceActive && (
        <button onClick={activateServices} style={{ width: '100%', padding: '15px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
          🔔 အသံနှင့် Notification စတင်ရန် နှိပ်ပါ
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
