"use client";
import { useEffect, useState, useRef } from 'react'; // useRef ကို သေချာထည့်ထားသည်
import Link from 'next/link';
import { db, auth } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore"; // လိုအပ်တာတွေ အကုန်ပါသည်

export default function Home() {
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // အသံဖိုင် Setup
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

    // Stats အားလုံးကို တွက်ချက်ခြင်း
    const qAll = query(collection(db, "orders"));
    const unsubscribeStats = onSnapshot(qAll, (snapshot) => {
      let revenue = 0;
      let customers = new Set();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Firebase ထဲက totalPrice ကို Number အဖြစ်ပြောင်းပေါင်းခြင်း
        const price = Number(data.totalPrice || 0);
        revenue += price;
        if (data.phone) customers.add(data.phone);
      });

      setTotalRevenue(revenue);
      setTotalOrders(snapshot.size);
      setTotalCustomers(customers.size);
    });

    // အော်ဒါသစ်စောင့်ကြည့်ခြင်း (အသံနှင့် အနီစက်အတွက်)
    const qPending = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      if (!snapshot.empty) {
        // အသံမြည်ရန်
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        setNewOrderCount(snapshot.size);
        
        if (Notification.permission === "granted") {
          new Notification("🔔 အော်ဒါအသစ် ရောက်ရှိလာပါပြီ!");
        }
      } else {
        setNewOrderCount(0);
      }
    });

    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    setCurrentDate(new Date().toLocaleDateString('en-GB'));
    if (Notification.permission !== "granted") Notification.requestPermission();

    return () => {
      unsubscribeStats();
      unsubscribePending();
      unsubscribeAuth();
    };
  }, []);

  return (
    <div style={{ background: '#F8FAFF', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Revenue Card */}
      <div style={{ background: 'linear-gradient(135deg, #007AFF, #00C7BE)', padding: '30px 25px', borderRadius: '24px', color: 'white', marginBottom: '20px', position: 'relative' }}>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '12px', fontWeight: 'bold' }}>TOTAL REVENUE</p>
        <h2 style={{ margin: '10px 0', fontSize: '36px', fontWeight: '800' }}>{totalRevenue.toLocaleString()} Ks</h2>
        <i className="fas fa-chart-line" style={{ position: 'absolute', right: '20px', bottom: '20px', fontSize: '60px', opacity: 0.2 }}></i>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px' }}>
          <p style={{ color: '#999', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>ORDERS</p>
          <h3 style={{ margin: '5px 0 0', fontSize: '24px' }}>{totalOrders}</h3>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px' }}>
          <p style={{ color: '#999', fontSize: '11px', fontWeight: 'bold', margin: 0 }}>CUSTOMERS</p>
          <h3 style={{ margin: '5px 0 0', fontSize: '24px' }}>{totalCustomers}</h3>
        </div>
      </div>

      <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', position: 'relative', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <i className="fas fa-shopping-basket" style={{ color: '#007AFF' }}></i>
          <span style={{ color: '#1C1C1E', fontWeight: '800' }}>Orders Live</span>
          {newOrderCount > 0 && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#FF3B30', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', border: '2px solid #fff' }}>
              {newOrderCount}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
