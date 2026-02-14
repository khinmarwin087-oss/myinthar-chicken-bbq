"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot } from "firebase/firestore";

export default function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState("");
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef(null);
  const prevPendingRef = useRef(-1);

  useEffect(() => {
    // ၁။ အသံဖိုင် Setup
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

    // ၂။ Notification Permission တောင်းခြင်း
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);

    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0;
      let totalOrdersToday = 0;
      let pendingCount = 0;
      let customerSet = new Set();
      let lastCustomer = "";

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderDate = data.orderDate ? data.orderDate.split('T')[0] : (data.date || "");
        const status = (data.status || "").toLowerCase();

        // Revenue & Stats Logic (ယနေ့အတွက်)
        if (orderDate === today) {
          totalOrdersToday++;
          // Status မျိုးစုံကို စစ်ပေးထားပါတယ်
          if (["completed", "done", "success", "ready"].includes(status)) {
            totalRevenue += Number(data.totalPrice || data.total || 0);
          }
          if (data.name || data.phone) customerSet.add(data.name || data.phone);
        }
        
        // Pending Count (Notification အတွက်)
        if (status === "pending") {
          pendingCount++;
          lastCustomer = data.name || "Customer";
        }
      });

      // ၃။ အသံမြည်ရန် နှင့် Notification ပြရန် Logic
      if (prevPendingRef.current !== -1 && pendingCount > prevPendingRef.current) {
        // အသံဖွင့်ရန်
        if (audioRef.current && isAudioReady) {
          audioRef.current.play().catch(e => console.log("Audio play blocked"));
        }
        // Notification ပြရန်
        if (Notification.permission === "granted") {
          new Notification("🔔 New Order Received!", {
            body: `${lastCustomer} ထံမှ အော်ဒါအသစ် ရောက်ရှိလာပါပြီ။`,
            icon: "/favicon.ico"
          });
        }
      }

      prevPendingRef.current = pendingCount;
      setStats({ revenue: totalRevenue, orders: totalOrdersToday, customers: customerSet.size, pending: pendingCount });
    });

    return () => unsubscribe();
  }, [isAudioReady]);

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
            position: relative; transition: 0.2s;
        }
        .nav-card:active { transform: scale(0.96); }
        .badge { background: #FF3B30; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; float: right; }
        
        /* အနီစက် Animation */
        .red-dot {
          position: absolute; top: 10px; right: 10px; width: 12px; height: 12px;
          background: #FF3B30; border-radius: 50%; border: 2px solid white;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .audio-banner {
          background: #007AFF; color: white; padding: 12px; border-radius: 12px;
          margin-bottom: 20px; text-align: center; font-size: 13px; font-weight: bold; cursor: pointer;
        }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Audio Activator: Browser Policy ကြောင့် User က တစ်ချက်နှိပ်ပေးဖို့လိုပါတယ် */}
      {!isAudioReady && (
        <div className="audio-banner" onClick={() => setIsAudioReady(true)}>
          <i className="fas fa-volume-up"></i> အော်ဒါအသံကြားရအောင် ဒီမှာတစ်ချက်နှိပ်ပါ
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#8E8E93', fontWeight: 600 }}>Mingalaba!</p>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>YNS Kitchen</h1>
        </div>
        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAudioReady ? '#34C759' : '#007AFF', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <i className={`fas ${isAudioReady ? 'fa-bell' : 'fa-user'}`}></i>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="main-gradient-card">
        <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', opacity: 0.9 }}>Today's Revenue</h3>
        <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>Live Update: {currentDate}</span>
        <i className="fas fa-chart-line" style={{ position: 'absolute', right: '20px', bottom: '20px', fontSize: '40px', opacity: 0.2 }}></i>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', display: 'block' }}>DAILY ORDERS</span>
          <span style={{ fontSize: '20px', fontWeight: 800 }}>{stats.orders}</span>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px' }}>
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
        
