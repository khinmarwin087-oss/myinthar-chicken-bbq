"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../lib/firebase"; 
import { collection, query, onSnapshot } from "firebase/firestore";

export default function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState("");
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    pending: 0
  });
  
  // အော်ဒါဟောင်းအရေအတွက်ကို မှတ်ထားရန်
  const prevPendingRef = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // ၁။ အသံဖိုင် Setup (User က Page ကို တစ်ချက်နှိပ်ပြီးမှ အလုပ်လုပ်ပါမည်)
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');
    audioRef.current.load();

    // ၂။ Notification ခွင့်ပြုချက် တောင်းခံခြင်း
    if ("Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }

    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);

    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0;
      let totalOrders = 0;
      let pendingCount = 0;
      let customerSet = new Set();
      let lastOrderName = "";

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.date === today) {
          totalOrders++;
          if (data.status === "completed" || data.status === "Done" || data.status === "Success") {
            totalRevenue += Number(data.totalPrice || 0);
          }
          if (data.name || data.phone) {
            customerSet.add(data.name || data.phone);
          }
        }
        
        if (data.status === "pending" || data.status === "Pending") {
          pendingCount++;
          lastOrderName = data.name || "Customer";
        }
      });

      // ၃။ အော်ဒါအသစ်တက်လာလျှင် အသံမြည်ခြင်းနှင့် Notification ပြခြင်း
      if (pendingCount > prevPendingRef.current) {
        // အသံမြည်ရန်
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log("Interaction required for audio"));
        }

        // Notification ပြရန် (အခြား App သုံးနေရင်လည်း ပေါ်လာမည်)
        if (Notification.permission === "granted") {
          new Notification("🔔 အော်ဒါအသစ် တက်လာပါပြီ!", {
            body: `${lastOrderName} ထံမှ အော်ဒါအသစ် ရရှိပါတယ်ဗျာ။`,
            icon: "/favicon.ico" // သင့် App icon path ကို ထည့်ပါ
          });
        }

        // ဖုန်းမှာဆိုရင် တုန်ခါမှု (Vibrate) ပါ ထည့်ချင်လျှင်
        if ("vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }

      // လက်ရှိအရေအတွက်ကို Update လုပ်ထားမည်
      prevPendingRef.current = pendingCount;

      setStats({
        revenue: totalRevenue,
        orders: totalOrders,
        customers: customerSet.size,
        pending: pendingCount
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        .main-gradient-card {
            background: linear-gradient(135deg, #007AFF, #00D2FF);
            border-radius: 20px; padding: 25px; color: white; position: relative;
            box-shadow: 0 10px 25px rgba(0, 122, 255, 0.2); margin-bottom: 20px;
        }
        .nav-card {
            background: white; border-radius: 22px; padding: 20px; text-decoration: none; color: #1C1C1E;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 12px;
            transition: 0.3s; border: 1px solid #FFF;
        }
        .nav-card:active { transform: scale(0.95); background: #F2F2F7; }
        .badge { background: #FF3B30; color: white; padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 800; margin-left: 5px; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#8E8E93', fontWeight: 700, letterSpacing: '0.5px' }}>MANAGEMENT PANEL</p>
          <h1 style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 900, color: '#1C1C1E' }}>YNS Kitchen</h1>
        </div>
        <div style={{ width: '45px', height: '45px', background: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
          <i className="fas fa-store" style={{ fontSize: '20px' }}></i>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="main-gradient-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h3 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Today's Revenue</h3>
                <span style={{ fontSize: '34px', fontWeight: '900', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                LIVE
            </div>
        </div>
        <span style={{ fontSize: '11px', opacity: 0.8 }}>Date: {currentDate}</span>
        <i className="fas fa-wallet" style={{ position: 'absolute', right: '20px', bottom: '20px', fontSize: '50px', opacity: 0.15 }}></i>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '18px', borderRadius: '22px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          <i className="fas fa-shopping-bag" style={{ color: '#007AFF', marginBottom: '10px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', display: 'block' }}>DAILY ORDERS</span>
          <span style={{ fontSize: '22px', fontWeight: 900 }}>{stats.orders}</span>
        </div>
        <div style={{ background: 'white', padding: '18px', borderRadius: '22px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
          <i className="fas fa-users" style={{ color: '#5856D6', marginBottom: '10px' }}></i>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', display: 'block' }}>CUSTOMERS</span>
          <span style={{ fontSize: '22px', fontWeight: 900 }}>{stats.customers}</span>
        </div>
      </div>

      <p style={{ fontSize: '12px', fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>Control Center</p>

      {/* Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-card">
            <div style={{ color: '#007AFF', background: '#F0F7FF', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Orders {stats.pending > 0 && <span className="badge">{stats.pending}</span>}</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Manage Live Orders</span>
            </div>
        </Link>

        <Link href="/admin/manage_menu" className="nav-card">
            <div style={{ color: '#AF52DE', background: '#FDF0FF', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fas fa-list-ul"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Inventory</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Stock & Items</span>
            </div>
        </Link>

        <Link href="/admin/history" className="nav-card">
            <div style={{ color: '#34C759', background: '#F2FFF5', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>History</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Sales Reports</span>
            </div>
        </Link>

        <Link href="/admin/settings" className="nav-card">
            <div style={{ color: '#FF9500', background: '#FFF9F0', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fas fa-sliders-h"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Settings</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Shop Profile</span>
            </div>
        </Link>
      </div>
    </div>
  );
        }
        
