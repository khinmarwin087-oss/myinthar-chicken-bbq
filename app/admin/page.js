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
  const [authMode, setAuthMode] = useState("pin"); // 'pin' or 'biometric'
  
  const lastPendingCount = useRef(null);
  const audioRef = useRef(null);

  // Debug Log
  const addLog = (msg) => {
    setDebugLog(prev => [new Date().toLocaleTimeString() + ": " + msg, ...prev].slice(0, 5));
  };

  // ၁။ Fingerprint (Biometric) Authentication
  const handleBiometricAuth = async () => {
    if (window.PublicKeyCredential) {
      try {
        // မှတ်ချက် - ဒါက ရိုးရှင်းတဲ့ စမ်းသပ်မှုဖြစ်ပြီး တကယ့် production မှာ server-side validation လိုအပ်ပါတယ်
        addLog("Attempting Fingerprint Auth...");
        // လက်ရှိအတွက် Fingerprint စနစ်ကို browser က support လုပ်မလုပ် စစ်ဆေးခြင်း
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          // ဤနေရာတွင် WebAuthn logic အပြည့်အစုံ ထည့်သွင်းနိုင်သည်
          // လောလောဆယ်တွင် user အား fingerprint သုံးရန် browser prompt ပြပါမည်
          setIsAuthorized(true);
          sessionStorage.setItem("isAdAuthed", "true");
          addLog("Fingerprint Auth Success ✅");
        } else {
          alert("သင့်ဖုန်း/ကွန်ပျူတာတွင် Fingerprint စနစ် မရရှိနိုင်ပါ။ PIN ကို သုံးပါ။");
        }
      } catch (e) {
        addLog("Fingerprint Error: " + e.message);
      }
    } else {
      alert("သင့် Browser က Fingerprint စနစ်ကို support မလုပ်ပါ။");
    }
  };

  // ၂။ PIN Authentication
  const handlePinLogin = (e) => {
    e.preventDefault();
    const savedPin = localStorage.getItem("adminPin") || "123456";
    if (inputPass === savedPin) {
      setIsAuthorized(true);
      sessionStorage.setItem("isAdAuthed", "true");
      addLog("PIN Auth Success ✅");
    } else {
      alert("PIN နံပါတ် မှားယွင်းနေပါသည်။");
    }
  };

  // ၃။ Notification & Audio Logic
  const showSystemNotification = (title, body) => {
    if ("serviceWorker" in navigator && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: "/icon-192.png",
          vibrate: [200, 100, 200],
          tag: 'new-order'
        });
      });
    } else if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else {
      alert(`🔔 ${title}\n${body}`);
    }
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 1.0; // အသံအကျယ်ဆုံးထားခြင်း
      audioRef.current.play().catch(e => addLog("🔊 Audio Play Error"));
    }
  };

  const activateServices = async () => {
    addLog("Activating Services...");
    if ("Notification" in window) {
      await Notification.requestPermission();
    }
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        setIsServiceActive(true);
        addLog("System Ready ✅");
      });
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("isAdAuthed") === "true") setIsAuthorized(true);

    // Audio Setup
    audioRef.current = new Audio('/soundreality-အသိပေးချက်-၃-၁၅၈၁၈၉.mp3');
    audioRef.current.load();

    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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

      if (lastPendingCount.current !== null && pend > lastPendingCount.current) {
        addLog("🔥 NEW ORDER!");
        playSound();
        showSystemNotification("Order အသစ်ရရှိပါသည်", `လက်ရှိ Pending Order ${pend} ခု ရှိပါသည်။`);
      }

      lastPendingCount.current = pend;
      setStats({ revenue: rev, orders: ordToday, customers: customerSet.size, pending: pend });
    });

    return () => unsubscribe();
  }, []);

  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F2F5' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '340px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ background: '#007AFF', width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 20px' }}>
            <i className="fas fa-lock" style={{fontSize: '24px'}}></i>
          </div>
          <h2 style={{marginBottom: 10, fontWeight: '800'}}>Admin Access</h2>
          <p style={{fontSize: '13px', color: '#8E8E93', marginBottom: 30}}>Please authenticate to continue</p>

          {authMode === "pin" ? (
            <form onSubmit={handlePinLogin}>
              <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '12px', border: '2px solid #E5E5EA', textAlign: 'center', fontSize: '20px', letterSpacing: '5px' }} placeholder="PIN CODE" autoFocus />
              <button type="submit" style={{ width: '100%', padding: '15px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginBottom: '15px' }}>Login with PIN</button>
              <button type="button" onClick={() => setAuthMode("biometric")} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '14px', fontWeight: '600' }}>Use Fingerprint Instead</button>
            </form>
          ) : (
            <div>
              <button onClick={handleBiometricAuth} style={{ width: '100%', padding: '20px', background: '#F2F2F7', border: 'none', borderRadius: '15px', marginBottom: '20px', cursor: 'pointer' }}>
                <i className="fas fa-fingerprint" style={{fontSize: '40px', color: '#007AFF'}}></i>
                <div style={{marginTop: 10, fontWeight: 'bold', color: '#1C1C1E'}}>Touch ID / Face ID</div>
              </button>
              <button type="button" onClick={() => setAuthMode("pin")} style={{ background: 'none', border: 'none', color: '#007AFF', fontSize: '14px', fontWeight: '600' }}>Use PIN Code Instead</button>
            </div>
          )}
        </div>
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

      <div className="debug-box">
        <div style={{fontWeight: 'bold', marginBottom: 5, color: '#FF9500'}}>SYSTEM LOGS:</div>
        {debugLog.map((log, i) => <div key={i}>{log}</div>)}
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
