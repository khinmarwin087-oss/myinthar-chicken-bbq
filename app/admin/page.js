"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  const audioRef = useRef(null);
  const prevPendingRef = useRef(-1);

  // ၁။ Notification Token ယူခြင်း
  const setupNotifications = async () => {
    try {
      if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
        const messaging = getMessaging();
        const token = await getToken(messaging, { 
          vapidKey: "BPcHRWw8jfHdJwMWiFN3v1PGj3pevV4msLVcbLCip-7jG80WY5EORbsFKLBoKuD1el6GchcP8lwpkStdTHXRsPo" 
        });
        
        if (token) console.log("FCM Token ရပါပြီ");

        onMessage(messaging, (payload) => {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: "/icon-192.png"
          });
        });
      }
    } catch (err) {
      console.error("Notification Setup Error:", err);
    }
  };

  // ၂။ အသံစနစ် Enable လုပ်ခြင်း
  const enableAudio = () => {
    setIsAudioReady(true);
    window.isAudioEnabled = true; // Global flag for the listener
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(e => console.log("Audio Init Error:", e));
    }
  };

  useEffect(() => {
    // Auth စစ်ဆေးခြင်း
    if (sessionStorage.getItem("isAdAuthed") === "true") setIsAuthorized(true);

    // Permission တောင်းခြင်း
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }

    // Service Worker Register
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(() => setupNotifications())
        .catch(err => console.log("SW Register Error:", err));
    }

    // အသံဖိုင် Initialize
    if (!audioRef.current) {
      audioRef.current = new Audio('/order-sound.mp3');
      audioRef.current.load();
    }

    // Firestore Real-time Listener
    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Listener ထဲမှာတင် Date ကို အသစ်ယူမှ နောက်တစ်နေ့ကူးရင် အမှန်ပြမှာပါ
      const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
      
      let rev = 0; 
      let ordToday = 0; 
      let pend = 0;
      let customerSet = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const rawDate = data.orderDate || data.date || "";
        const orderDateStr = rawDate.split('T')[0];
        const status = (data.status || "").toLowerCase();

        // ယနေ့အတွက် စာရင်းတွက်ခြင်း
        if (orderDateStr === todayStr) {
          ordToday++;
          if (["completed", "done", "success", "ready"].includes(status)) {
            rev += Number(data.totalPrice || data.total || 0);
          }
          if (data.name || data.customerName) {
            customerSet.add(data.name || data.customerName);
          }
        }
        
        // Pending status အားလုံးကိုရေတွက် (ယနေ့တင်မက)
        if (status === "pending") {
          pend++;
        }
      });

      // အော်ဒါအသစ်တက်လာလျှင် (Pending အရေအတွက် တိုးလာလျှင်)
      if (prevPendingRef.current !== -1 && pend > prevPendingRef.current) {
        // ၁။ အသံမြည်ရန်
        if (window.isAudioEnabled && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
        
        // ၂။ Push Notification ပြရန်
        if (Notification.permission === "granted") {
          new Notification("🔔 Order အသစ်ရပါပြီ", { 
            body: `ယခု လက်ရှိ Pending order ${pend} ခု ရှိနေပါသည်။`,
            icon: "/icon-192.png" 
          });
        }
      }

      // နောက်ဆုံးအခြေအနေကို သိမ်းထား
      prevPendingRef.current = pend;
      setStats({ revenue: rev, orders: ordToday, customers: customerSet.size, pending: pend });
      
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, []); // Dependency အလွတ်ထားမှ တစ်ခါပဲ Listener တည်ဆောက်မှာပါ

  const handleLogin = (e) => {
    e.preventDefault();
    const savedPass = localStorage.getItem("adminPassword") || "123456";
    if (inputPass === savedPass) {
      setIsAuthorized(true);
      sessionStorage.setItem("isAdAuthed", "true");
    } else { 
      alert("Password မှားယွင်းနေပါသည်။"); 
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', width: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h2 style={{marginBottom: 20}}>Admin Login</h2>
          <input 
            type="password" 
            value={inputPass} 
            onChange={(e) => setInputPass(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ddd', textAlign: 'center' }} 
            placeholder="Password" 
            autoFocus 
          />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        .main-card { background: linear-gradient(135deg, #007AFF, #00D2FF); border-radius: 20px; padding: 25px; color: white; margin-bottom: 20px; }
        .nav-item { background: white; border-radius: 18px; padding: 20px; text-decoration: none; color: #1C1C1E; display: flex; flex-direction: column; gap: 10px; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: 0.2s; }
        .nav-item:active { transform: scale(0.95); }
        .red-dot { position: absolute; top: 12px; right: 12px; width: 10px; height: 10px; background: #FF3B30; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>YNS Admin</h1>
        <button onClick={() => {sessionStorage.removeItem("isAdAuthed"); setIsAuthorized(false);}} style={{ border: 'none', background: '#FFF1F0', color: '#FF3B30', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      {!isAudioReady && (
        <button onClick={enableAudio} style={{ width: '100%', padding: '15px', background: '#34C759', color: 'white', border: 'none', borderRadius: '12px', marginBottom: '20px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)', cursor: 'pointer' }}>
          🔔 အော်ဒါအသံ စတင်ရန် နှိပ်ပါ
        </button>
      )}

      <div className="main-card">
        <h3 style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>TODAY'S REVENUE</h3>
        <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>Live Syncing Active</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{background:'white', padding:15, borderRadius:18, boxShadow: '0 4px 10px rgba(0,0,0,0.02)'}}>
          <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 700 }}>TODAY ORDERS</span>
          <span style={{ fontSize: '20px', fontWeight: 800, display: 'block' }}>{stats.orders}</span>
        </div>
        <div style={{background:'white', padding:15, borderRadius:18, boxShadow: '0 4px 10px rgba(0,0,0,0.02)'}}>
          <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: 700 }}>PENDING</span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#FF3B30', display: 'block' }}>{stats.pending}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-item">
            {stats.pending > 0 && <div className="red-dot"></div>}
            <i className="fas fa-shopping-basket" style={{color: '#007AFF', fontSize: '20px'}}></i>
            <b style={{ fontSize: '15px' }}>Orders</b>
        </Link>
        <Link href="/admin/manage_menu" className="nav-item">
            <i className="fas fa-utensils" style={{color: '#5856D6', fontSize: '20px'}}></i>
            <b style={{ fontSize: '15px' }}>Menus</b>
        </Link>
        <Link href="/admin/history" className="nav-item">
            <i className="fas fa-history" style={{color: '#34C759', fontSize: '20px'}}></i>
            <b style={{ fontSize: '15px' }}>History</b>
        </Link>
        <Link href="/admin/settings" className="nav-item">
            <i className="fas fa-cog" style={{color: '#8E8E93', fontSize: '20px'}}></i>
            <b style={{ fontSize: '15px' }}>Settings</b>
        </Link>
      </div>
    </div>
  );
        }
        
