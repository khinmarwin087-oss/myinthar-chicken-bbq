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
  const isFirstLoad = useRef(true);

  // ၁။ Notification Setup (Browser Notification Permission)
  const setupNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      
      // FCM Setup (Optional - if you have firebase-messaging-sw.js)
      try {
        const messaging = getMessaging();
        const token = await getToken(messaging, { 
          vapidKey: "BPcHRWw8jfHdJwMWiFN3v1PGj3pevV4msLVcbLCip-7jG80WY5EORbsFKLBoKuD1el6GchcP8lwpkStdTHXRsPo" 
        });
        console.log("FCM Token:", token);
        
        onMessage(messaging, (payload) => {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: "/icon-192.png"
          });
        });
      } catch (err) {
        console.log("FCM Setup skipped or error:", err.message);
      }
    }
  };

  // ၂။ Audio Enable (Browser policy အရ user က တစ်ချက်နှိပ်ပေးဖို့လိုပါတယ်)
  const enableAudio = () => {
    setIsAudioReady(true);
    window.isAudioEnabled = true; 
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(e => console.log("Audio Start Error:", e));
    }
    setupNotifications(); // Audio နှိပ်တဲ့အချိန်မှာ Notification permission ပါ တစ်ခါတည်းတောင်းမယ်
  };

  useEffect(() => {
    // Auth Check
    if (sessionStorage.getItem("isAdAuthed") === "true") setIsAuthorized(true);

    // Initial Sound Load
    audioRef.current = new Audio('/order-sound.mp3');
    audioRef.current.load();

    // Firestore Real-time Listener
    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("🔥 Firestore Data Received!");

      const todayStr = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Yangon'});
      let rev = 0; 
      let ordToday = 0; 
      let pend = 0;
      let customerSet = new Set();

      // အော်ဒါအသစ်ဝင်လာတာကို docChanges နဲ့ စစ်မယ် (ဒါက ပိုတိကျပါတယ်)
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isFirstLoad.current) {
          const newData = change.doc.data();
          const status = (newData.status || "").toLowerCase();

          // Pending order အသစ်ဖြစ်မှ အသံမြည်မယ်
          if (status === "pending") {
            console.log("🔔 New Pending Order Detected!");
            
            // ၁။ အသံဖွင့်မယ်
            if (window.isAudioEnabled && audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.log("Sound play error:", e));
            }

            // ၂။ Notification ပြမယ်
            if (Notification.permission === "granted") {
              new Notification("🔔 Order အသစ်တစ်ခု ရောက်ရှိ!", {
                body: `Customer: ${newData.name || 'N/A'}\nTotal: ${newData.totalPrice || 0} Ks`,
                icon: "/icon-192.png",
                tag: change.doc.id // ID တူရင် notification ထပ်မပြအောင်
              });
            }
          }
        }
      });

      // Stats တွက်ချက်ခြင်း
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

      setStats({ revenue: rev, orders: ordToday, customers: customerSet.size, pending: pend });
      
      // ပထမဆုံးအကြိမ် load ပြီးသွားပြီဖြစ်ကြောင်း မှတ်သားမယ်
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }

    }, (error) => {
      console.error("Firestore Sync Error:", error);
      // Network ကျသွားရင် သိနိုင်အောင် alert ပြပေးထားပါတယ်
      // alert("Database ချိတ်ဆက်မှု ပြတ်တောက်သွားပါသည်။ ကျေးဇူးပြု၍ Refresh လုပ်ပေးပါ။");
    });

    return () => unsubscribe();
  }, []);

  // --- UI Rendering အပိုင်း ---
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
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <h2 style={{textAlign: 'center', marginBottom: 20, color: '#1C1C1E'}}>Admin Login</h2>
          <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ddd', textAlign: 'center', fontSize: '16px' }} placeholder="Password" autoFocus />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <style jsx global>{`
        .main-card { background: linear-gradient(135deg, #007AFF, #00D2FF); border-radius: 20px; padding: 25px; color: white; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(0,122,255,0.2); }
        .nav-item { background: white; border-radius: 18px; padding: 20px; text-decoration: none; color: #1C1C1E; display: flex; flex-direction: column; gap: 10px; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s; }
        .nav-item:active { transform: scale(0.95); }
        .red-dot { position: absolute; top: 12px; right: 12px; width: 12px; height: 12px; background: #FF3B30; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1C1C1E', margin: 0 }}>YNS Admin</h1>
        <button onClick={() => {sessionStorage.removeItem("isAdAuthed"); setIsAuthorized(false);}} style={{ border: 'none', background: '#FFF1F0', color: '#FF3B30', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Logout</button>
      </div>

      {!isAudioReady && (
        <button onClick={enableAudio} style={{ width: '100%', padding: '15px', background: '#FF9500', color: 'white', border: 'none', borderRadius: '15px', marginBottom: '20px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,149,0,0.3)' }}>
          🔔 အော်ဒါအသံနှင့် Notification စတင်ရန် နှိပ်ပါ
        </button>
      )}

      <div className="main-card">
        <h3 style={{ margin: 0, fontSize: '12px', opacity: 0.8, letterSpacing: '1px' }}>TODAY'S REVENUE</h3>
        <span style={{ fontSize: '36px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', background: '#34C759', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>Real-time Live Syncing...</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{background:'white', padding:20, borderRadius:20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
          <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, display: 'block', marginBottom: '5px' }}>TODAY ORDERS</span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#1C1C1E' }}>{stats.orders}</span>
        </div>
        <div style={{background:'white', padding:20, borderRadius:20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'}}>
          <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, display: 'block', marginBottom: '5px' }}>PENDING</span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#FF3B30' }}>{stats.pending}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-item">
            {stats.pending > 0 && <div className="red-dot"></div>}
            <i className="fas fa-shopping-basket" style={{fontSize: '20px', color: '#007AFF'}}></i>
            <b style={{ fontSize: '16px' }}>Orders</b>
        </Link>
        <Link href="/admin/manage_menu" className="nav-item">
            <i className="fas fa-utensils" style={{fontSize: '20px', color: '#5856D6'}}></i>
            <b style={{ fontSize: '16px' }}>Menus</b>
        </Link>
        <Link href="/admin/history" className="nav-item">
            <i className="fas fa-history" style={{fontSize: '20px', color: '#34C759'}}></i>
            <b style={{ fontSize: '16px' }}>History</b>
        </Link>
        <Link href="/admin/settings" className="nav-item">
            <i className="fas fa-cog" style={{fontSize: '20px', color: '#8E8E93'}}></i>
            <b style={{ fontSize: '16px' }}>Settings</b>
        </Link>
      </div>
    </div>
  );
            }
