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
  const [notifications, setNotifications] = useState([]);
  
  const lastPendingCount = useRef(null);
  const audioContextRef = useRef(null);

  // Custom Toast Notification ထည့်ရန်
  const addNotification = (title, body) => {
    const id = Date.now();
    setNotifications(prev => [{ id, title, body }, ...prev]);
    // ၅ စက္ကန့်အကြာတွင် အလိုအလျောက် ပျောက်သွားစေရန်
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Premium Crystal Clear Sound (ပိုမိုကျယ်လောင်ပြီး ကြည်လင်သောအသံ)
  const playPremiumSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      
      const playNote = (freq, start, duration, vol) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle"; // ပိုမိုနူးညံ့ပြီး ကျယ်လောင်သော အသံအတွက် triangle သုံးပါသည်
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Premium Chime Sound (C6 -> G5 -> C5)
      playNote(1046.50, now, 0.6, 0.3); // C6
      playNote(783.99, now + 0.15, 0.6, 0.2); // G5
      playNote(523.25, now + 0.3, 0.8, 0.4); // C5
      
    } catch (e) { console.error("Sound Error", e); }
  };

  const activateServices = async () => {
    if ("Notification" in window) await Notification.requestPermission();
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    await audioContextRef.current.resume();
    setIsServiceActive(true);
    playPremiumSound();
    addNotification("System Active", "Premium Dashboard is ready for orders.");
  };

  useEffect(() => {
    if (sessionStorage.getItem("isAdAuthed") === "true") setIsAuthorized(true);

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
        playPremiumSound();
        addNotification("Order အသစ်ရရှိပါသည်", `လက်ရှိ Pending Order ${pend} ခု ရှိပါသည်။`);
        // System Notification (Notification Bar အတွက်)
        if (Notification.permission === "granted") {
          new Notification("🔔 New Order!", { body: `You have ${pend} pending orders.` });
        }
      }

      lastPendingCount.current = pend;
      setStats({ revenue: rev, orders: ordToday, customers: customerSet.size, pending: pend });
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPass === (localStorage.getItem("adminPin") || "123456")) {
      setIsAuthorized(true);
      sessionStorage.setItem("isAdAuthed", "true");
    } else { alert("PIN မှားယွင်းနေပါသည်။"); }
  };

  if (!isAuthorized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F7' }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '30px', width: '340px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, #007AFF, #00D2FF)', width: '70px', height: '70px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 25px', boxShadow: '0 10px 20px rgba(0,122,255,0.3)' }}>
            <i className="fas fa-shield-alt" style={{fontSize: '30px'}}></i>
          </div>
          <h2 style={{marginBottom: 10, fontWeight: '800', color: '#1C1C1E'}}>Admin Portal</h2>
          <p style={{fontSize: '14px', color: '#8E8E93', marginBottom: 30}}>Enter your secure PIN to access</p>
          <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} style={{ width: '100%', padding: '18px', marginBottom: '20px', borderRadius: '15px', border: '2px solid #E5E5EA', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', outline: 'none', transition: 'border-color 0.3s' }} placeholder="••••••" autoFocus />
          <button type="submit" style={{ width: '100%', padding: '18px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,122,255,0.2)' }}>Unlock Dashboard</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100vh', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      <style jsx global>{`
        .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border-radius: 24px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 8px 32px rgba(0,0,0,0.05); }
        .nav-btn { background: white; border-radius: 22px; padding: 20px; text-decoration: none; color: #1C1C1E; display: flex; flex-direction: column; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .nav-btn:active { transform: scale(0.92); background: #F2F2F7; }
        .toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; width: 90%; max-width: 400px; display: flex; flex-direction: column; gap: 10px; }
        .toast { background: rgba(28, 28, 30, 0.95); color: white; padding: 16px 20px; borderRadius: 20px; backdrop-filter: blur(10px); display: flex; align-items: center; gap: 15px; animation: slideDown 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
        @keyframes slideDown { from { transform: translateY(-100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .pulse-dot { width: 12px; height: 12px; background: #FF3B30; border-radius: 50%; position: absolute; top: 15px; right: 15px; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,59,48,0.4); } 70% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(255,59,48,0); } 100% { transform: scale(1); } }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Custom Toast Notifications */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className="toast">
            <div style={{ background: '#FF3B30', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-bell"></i>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{n.title}</div>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1C1C1E', margin: 0 }}>Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <div style={{ width: '8px', height: '8px', background: '#34C759', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600' }}>Live Syncing</span>
          </div>
        </div>
        <button onClick={() => {sessionStorage.removeItem("isAdAuthed"); setIsAuthorized(false);}} style={{ border: 'none', background: '#FFE5E5', color: '#FF3B30', padding: '10px 20px', borderRadius: '14px', fontWeight: '800', fontSize: '14px' }}>Logout</button>
      </div>

      {/* Activation Button */}
      {!isServiceActive && (
        <button onClick={activateServices} style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #007AFF, #00D2FF)', color: 'white', border: 'none', borderRadius: '22px', marginBottom: '25px', fontWeight: '800', fontSize: '17px', boxShadow: '0 10px 25px rgba(0,122,255,0.3)', cursor: 'pointer' }}>
          <i className="fas fa-bolt" style={{marginRight: '10px'}}></i> Activate Premium Services
        </button>
      )}

      {/* Revenue Card */}
      <div style={{ background: 'linear-gradient(135deg, #1C1C1E, #3A3A3C)', borderRadius: '30px', padding: '35px', color: 'white', marginBottom: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
        <span style={{ fontSize: '14px', opacity: 0.6, fontWeight: '700', letterSpacing: '1px' }}>TODAY'S REVENUE</span>
        <div style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>{stats.revenue.toLocaleString()} <span style={{fontSize: '22px', opacity: 0.8}}>Ks</span></div>
        <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '15px', fontSize: '13px', fontWeight: '600' }}>
                <i className="fas fa-shopping-bag" style={{marginRight: '8px', color: '#007AFF'}}></i> {stats.orders} Orders
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '15px', fontSize: '13px', fontWeight: '600' }}>
                <i className="fas fa-user-friends" style={{marginRight: '8px', color: '#34C759'}}></i> {stats.customers} Customers
            </div>
        </div>
      </div>

      {/* Pending Stats */}
      <div className="glass-card" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: stats.pending > 0 ? '2px solid #FF3B30' : '1px solid rgba(255,255,255,0.3)' }}>
        <div>
          <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '700' }}>PENDING ORDERS</span>
          <span style={{ fontSize: '32px', fontWeight: '900', color: stats.pending > 0 ? '#FF3B30' : '#1C1C1E', display: 'block', marginTop: '5px' }}>{stats.pending}</span>
        </div>
        <div style={{ background: stats.pending > 0 ? '#FF3B30' : '#F2F2F7', width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stats.pending > 0 ? 'white' : '#8E8E93', transition: 'all 0.3s' }}>
          <i className="fas fa-clock" style={{fontSize: '26px'}}></i>
        </div>
      </div>

      {/* Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
        <Link href="/admin/orders" className="nav-btn" style={{position: 'relative'}}>
          {stats.pending > 0 && <div className="pulse-dot"></div>}
          <div style={{ background: '#E5F1FF', width: '55px', height: '55px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF' }}>
            <i className="fas fa-list-ul" style={{fontSize: '22px'}}></i>
          </div>
          <b style={{fontSize: '16px', fontWeight: '700'}}>Orders</b>
        </Link>
        
        <Link href="/admin/manage_menu" className="nav-btn">
          <div style={{ background: '#F2F2F7', width: '55px', height: '55px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5856D6' }}>
            <i className="fas fa-utensils" style={{fontSize: '22px'}}></i>
          </div>
          <b style={{fontSize: '16px', fontWeight: '700'}}>Menus</b>
        </Link>

        <Link href="/admin/history" className="nav-btn">
          <div style={{ background: '#E8F9EE', width: '55px', height: '55px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759' }}>
            <i className="fas fa-history" style={{fontSize: '22px'}}></i>
          </div>
          <b style={{fontSize: '15px', fontWeight: '700'}}>History</b>
        </Link>

        <Link href="/admin/settings" className="nav-btn">
          <div style={{ background: '#F2F2F7', width: '55px', height: '55px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
            <i className="fas fa-cog" style={{fontSize: '22px'}}></i>
          </div>
          <b style={{fontSize: '15px', fontWeight: '700'}}>Settings</b>
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '11px', color: '#AEAEB2', fontWeight: '600', letterSpacing: '1px' }}>
        PREMIUM ADMIN PANEL v3.0
      </div>
    </div>
  );
    }
