"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
// Path ကို သတိထားပါ - app/admin/page.js ဖြစ်လို့ အစက် ၄ စက် သုံးရပါမယ်
import { db, auth } from "../../lib/firebase"; 
import { collection, query, onSnapshot, where } from "firebase/firestore";

export default function AdminDashboard() {
  const [currentDate, setCurrentDate] = useState("");
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    pending: 0
  });
  const audioRef = useRef(null);

  useEffect(() => {
    // ၁။ အသံဖိုင် Setup
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

    // ၂။ ယနေ့ရက်စွဲ သတ်မှတ်ခြင်း (YYYY-MM-DD format)
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);

    // ၃။ Firestore မှ Data များ Real-time ဖတ်ခြင်း
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0;
      let totalOrders = 0;
      let pendingCount = 0;
      let customerSet = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // အော်ဒါရက်စွဲသည် ယနေ့ဖြစ်မှ စာရင်းထဲထည့်မည်
        if (data.date === today) {
          totalOrders++;
          if (data.status === "completed" || data.status === "Done") {
            totalRevenue += Number(data.totalPrice || data.total || 0);
          }
          if (data.customerName || data.phone) {
            customerSet.add(data.customerName || data.phone);
          }
        }
        
        // Pending အော်ဒါအရေအတွက် (ရက်စွဲမရွေး)
        if (data.status === "pending" || data.status === "Pending") {
          pendingCount++;
        }
      });

      // အော်ဒါအသစ်တက်လာလျှင် အသံမြည်စေရန်
      if (pendingCount > stats.pending) {
        audioRef.current.play().catch(e => console.log("Audio play blocked"));
      }

      setStats({
        revenue: totalRevenue,
        orders: totalOrders,
        customers: customerSet.size,
        pending: pendingCount
      });
    });

    return () => unsubscribe();
  }, [stats.pending]);

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
        }
        .badge { background: #FF3B30; color: white; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 800; float: right; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px', color: '#8E8E93', fontWeight: 600 }}>Mingalaba!</p>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>YNS Kitchen</h1>
        </div>
        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <i className="fas fa-user"></i>
        </div>
      </div>

      {/* Revenue Card */}
      <div className="main-gradient-card">
        <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', opacity: 0.9 }}>Today's Revenue</h3>
        <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '10px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>Updated: {currentDate}</span>
        <i className="fas fa-chart-line" style={{ position: 'absolute', right: '20px', bottom: '20px', fontSize: '40px', opacity: 0.2 }}></i>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', display: 'block' }}>TOTAL ORDERS</span>
          <span style={{ fontSize: '20px', fontWeight: 800 }}>{stats.orders}</span>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '18px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#8E8E93', display: 'block' }}>CUSTOMERS</span>
          <span style={{ fontSize: '20px', fontWeight: 800 }}>{stats.customers}</span>
        </div>
      </div>

      <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E8E93', textTransform: 'uppercase', marginBottom: '15px' }}>Management</p>

      {/* Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" className="nav-card">
            <div style={{ color: '#007AFF', background: '#F0F7FF', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-shopping-basket"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Orders {stats.pending > 0 && <span className="badge">{stats.pending}</span>}</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Live Orders</span>
            </div>
        </Link>

        <Link href="/admin/menu" className="nav-card">
            <div style={{ color: '#5856D6', background: '#F5F5FF', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-utensils"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Menus</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Edit Dishes</span>
            </div>
        </Link>

        <Link href="/admin/history" className="nav-card">
            <div style={{ color: '#34C759', background: '#F2FFF5', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-history"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>History</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>Past Sales</span>
            </div>
        </Link>

        <Link href="/admin/settings" className="nav-card">
            <div style={{ color: '#FF3B30', background: '#FFF2F2', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-cog"></i>
            </div>
            <div>
              <b style={{ fontSize: '15px' }}>Settings</b>
              <span style={{ fontSize: '11px', color: '#8E8E93' }}>App Config</span>
            </div>
        </Link>
      </div>
    </div>
  );
}
