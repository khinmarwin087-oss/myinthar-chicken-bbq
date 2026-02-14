"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot } from "firebase/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef(null);
  const prevPendingRef = useRef(-1); 

  useEffect(() => {
    // ၁။ အသံဖိုင် Setup
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');
    
    // ၂။ Notification ခွင့်ပြုချက်တောင်းခြင်း
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }

    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let revenue = 0; let ordersToday = 0; let pending = 0;
      let customers = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderDate = data.orderDate ? data.orderDate.split('T')[0] : (data.date || "");
        const status = (data.status || "").toLowerCase();

        // Revenue & Today Stats Logic
        if (orderDate === today) {
          ordersToday++;
          if (["success", "ready", "done", "completed"].includes(status)) {
            revenue += Number(data.totalPrice || data.total || 0);
          }
          if (data.name || data.phone) customers.add(data.name || data.phone);
        }

        // Pending Count (For Notification & Red Dot)
        if (status === "pending") pending++;
      });

      // ၃။ အော်ဒါအသစ်တက်လာရင် အသံမြည်စေခြင်း (prevPendingRef သုံးပြီး စစ်ဆေးသည်)
      if (prevPendingRef.current !== -1 && pending > prevPendingRef.current) {
        if (audioEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        if (Notification.permission === "granted") {
          new Notification("🔔 New Order!", { body: "အော်ဒါအသစ်တစ်ခု ရောက်ရှိနေပါတယ်" });
        }
      }
      
      prevPendingRef.current = pending;
      setStats({ revenue, orders: ordersToday, customers: customers.size, pending });
    });

    return () => unsubscribe();
  }, [audioEnabled]);

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        .main-gradient-card { background: linear-gradient(135deg, #007AFF, #00D2FF); border-radius: 20px; padding: 25px; color: white; position: relative; margin-bottom: 20px; }
        .nav-card { background: white; border-radius: 18px; padding: 20px; text-decoration: none; color: #1C1C1E; display: flex; flex-direction: column; gap: 12px; position: relative; border: 1px solid #F0F0F0; }
        .badge { background: #FF3B30; color: white; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; }
        .red-dot { position: absolute; top: -5px; right: -5px; width: 15px; height: 15px; background: #FF3B30; border-radius: 50%; border: 2px solid white; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
      `}</style>

      {/* Audio Activator - ဒါကို နှိပ်မှ အသံထွက်လာမှာပါ */}
      {!audioEnabled && (
        <div onClick={() => setAudioEnabled(true)} style={{ background: '#FFF3CD', color: '#856404', padding: '10px', borderRadius: '10px', marginBottom: '15px', fontSize: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
          ⚠️ အသံကြားရအောင် ဒီနေရာကို တစ်ချက်နှိပ်ပေးပါ (Enable Audio)
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#8E8E93', fontWeight: 600 }}>Mingalaba!</p>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>YNS Kitchen</h1>
        </div>
        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: audioEnabled ? '#34C759' : '#8E8E93' }}>
          <i className={`fas ${audioEnabled ? 'fa-bell' : 'fa-bell-slash'}`}></i>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="main-gradient-card">
        <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', opacity: 0.9 }}>Today's Revenue</h3>
        <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>Updated: Live Today</span>
      </div>

      {/* Management Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-card">
            {stats.pending > 0 && <div className="red-dot"></div>}
            <div style={{ color: '#007AFF', background: '#F0F7FF', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-shopping-basket"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Orders {stats.pending > 0 && <span className="badge">{stats.pending}</span>}</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Live Monitoring</span>
            </div>
        </Link>

        <Link href="/admin/history" className="nav-card">
            <div style={{ color: '#34C759', background: '#F2FFF5', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-history"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>History</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Sales Log</span>
            </div>
        </Link>
      </div>
    </div>
  );
        }
