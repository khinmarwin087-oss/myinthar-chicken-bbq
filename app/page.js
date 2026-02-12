"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
// Firebase ပိုင်းကို မှန်ကန်အောင် Import လုပ်ခြင်း
import { db, auth } from "../lib/firebase"; 
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";

export default function Home() {
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // ၁။ အသံဖိုင် ချိတ်ဆက်ခြင်း
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

    // ၂။ Pending Orders (အနီစက်နှင့် အသံအတွက်)
    const qPending = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      if (!snapshot.empty) {
        // အော်ဒါဝင်လျှင် အသံမြည်စေရန်
        audioRef.current.play().catch(e => console.log("Audio Error:", e));
        setNewOrderCount(snapshot.size);

        // ဖုန်းပိတ်ထားရင်တောင် သိနိုင်ရန် Browser Notification လွှတ်ခြင်း
        if (Notification.permission === "granted") {
          new Notification("🔔 အော်ဒါအသစ် ရောက်ရှိလာပါပြီ!", {
            body: `ယခု Pending အော်ဒါ ${snapshot.size} ခု ရှိနေပါသည်၊`,
            icon: "/logo.png",
            vibrate: [200, 100, 200]
          });
        }
      } else {
        setNewOrderCount(0);
      }
    });

    // ၃။ Total Stats ပေါင်းခြင်း (Revenue, Orders, Customers)
    const qAll = query(collection(db, "orders"));
    const unsubscribeStats = onSnapshot(qAll, (snapshot) => {
      let revenue = 0;
      let customerSet = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        revenue += (data.totalPrice || 0); // Total Price ကို ပေါင်းခြင်း
        if (data.phone) customerSet.add(data.phone); // ဖုန်းနံပါတ်ဖြင့် Customer အရေအတွက်တွက်ခြင်း
      });
      setTotalRevenue(revenue);
      setTotalOrders(snapshot.size);
      setTotalCustomers(customerSet.size);
    });

    // ၄။ Date & Auth
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    setCurrentDate(new Date().toLocaleDateString('en-GB', options));
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));

    // ၅။ Notification ခွင့်ပြုချက်တောင်းခြင်း
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    return () => {
      unsubscribePending();
      unsubscribeStats();
      unsubscribeAuth();
    };
  }, []);

  return (
    <div style={{ background: '#F8FAFF', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
            <p style={{ margin: 0, color: '#999', fontSize: '14px' }}>Mingalaba!</p>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>YNS Kitchen</h1>
        </div>
        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <i className="fas fa-user" style={{ color: '#007AFF' }}></i>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ background: '#fff', padding: '10px 15px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#007AFF', fontWeight: 'bold', fontSize: '14px' }}>
            {currentDate} <i className="fas fa-chevron-down"></i>
        </div>
      </div>

      {/* Total Revenue */}
      <div style={{ 
        background: 'linear-gradient(135deg, #007AFF, #00C7BE)', 
        padding: '30px 25px', borderRadius: '24px', color: 'white', 
        marginBottom: '20px', position: 'relative', overflow: 'hidden'
      }}>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '12px', fontWeight: 'bold' }}>TOTAL REVENUE</p>
        <h2 style={{ margin: '10px 0', fontSize: '36px', fontWeight: '800' }}>{totalRevenue.toLocaleString()} Ks</h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '11px' }}>Updated just now</p>
        <i className="fas fa-chart-line" style={{ position: 'absolute', right: '20px', bottom: '20px', fontSize: '60px', opacity: 0.2 }}></i>
      </div>

      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px' }}>
            <p style={{ margin: 0, color: '#999', fontSize: '11px', fontWeight: 'bold' }}>TOTAL ORDERS</p>
            <h3 style={{ margin: '5px 0 0', fontSize: '24px' }}>{totalOrders}</h3>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px' }}>
            <p style={{ margin: 0, color: '#999', fontSize: '11px', fontWeight: 'bold' }}>CUSTOMERS</p>
            <h3 style={{ margin: '5px 0 0', fontSize: '24px' }}>{totalCustomers}</h3>
        </div>
      </div>

      <p style={{ fontSize: '12px', fontWeight: '800', color: '#999', marginBottom: '15px' }}>MANAGEMENT</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', position: 'relative' }}>
                <div style={{ color: '#007AFF', fontSize: '20px', marginBottom: '15px' }}><i className="fas fa-shopping-basket"></i></div>
                <div style={{ color: '#1C1C1E', fontWeight: '800' }}>Orders <span style={{color:'#bbb', fontWeight:'normal', fontSize:'12px'}}>Live</span></div>
                
                {/* အနီစက် အရေအတွက်နှင့်တကွပြခြင်း */}
                {newOrderCount > 0 && (
                    <div style={{ 
                        position: 'absolute', top: '15px', right: '15px', 
                        background: '#FF3B30', color: 'white', borderRadius: '50%', 
                        width: '24px', height: '24px', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', 
                        fontSize: '11px', fontWeight: 'bold', border: '2px solid #fff'
                    }}>{newOrderCount}</div>
                )}
            </div>
        </Link>

        <Link href="/menus" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '24px' }}>
                <div style={{ color: '#AF52DE', fontSize: '20px', marginBottom: '15px' }}><i className="fas fa-utensils"></i></div>
                <div style={{ color: '#1C1C1E', fontWeight: '800' }}>Menus</div>
            </div>
        </Link>
      </div>
    </div>
  );
}
