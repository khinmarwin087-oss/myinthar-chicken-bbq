"use client";
import { useEffect, useState, useRef } from 'react'; // useRef ထည့်လိုက်ပြီ
import Link from 'next/link';
import { db, auth } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore"; // လိုအပ်တာတွေ အကုန်ဖြည့်လိုက်ပြီ

export default function Home() {
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // အသံဖိုင် ချိတ်ဆက်ခြင်း
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

    // Stats များ တွက်ချက်ခြင်း
    const qAll = query(collection(db, "orders"));
    const unsubscribeStats = onSnapshot(qAll, (snapshot) => {
      let revenue = 0;
      let customers = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        revenue += Number(data.totalPrice || 0); // totalPrice ကို ပေါင်းခြင်း
        if (data.phone) customers.add(data.phone);
      });
      setTotalRevenue(revenue);
      setTotalOrders(snapshot.size);
      setTotalCustomers(customers.size);
    });

    // အော်ဒါသစ် စောင့်ကြည့်ခြင်း
    const qPending = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubscribePending = onSnapshot(qPending, (snapshot) => {
      if (!snapshot.empty) {
        audioRef.current.play().catch(() => {}); // အသံမြည်စေရန်
        setNewOrderCount(snapshot.size);
        if (Notification.permission === "granted") {
          new Notification("🔔 အော်ဒါအသစ် တက်လာပါပြီ!");
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
    <div style={{ padding: '20px', background: '#F8FAFF', minHeight: '100vh' }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Revenue Card */}
      <div style={{ background: 'linear-gradient(135deg, #007AFF, #00C7BE)', padding: '25px', borderRadius: '20px', color: '#fff', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>TOTAL REVENUE</p>
        <h2 style={{ fontSize: '32px', margin: '10px 0' }}>{totalRevenue.toLocaleString()} Ks</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '15px' }}>
          <small>ORDERS</small>
          <h3 style={{ margin: 0 }}>{totalOrders}</h3>
        </div>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '15px' }}>
          <small>CUSTOMERS</small>
          <h3 style={{ margin: 0 }}>{totalCustomers}</h3>
        </div>
      </div>

      {/* Orders Link */}
      <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', position: 'relative', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <i className="fas fa-shopping-basket" style={{ color: '#007AFF', fontSize: '20px' }}></i>
          <span style={{ color: '#000', fontWeight: 'bold' }}>Orders Live</span>
          {newOrderCount > 0 && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
              {newOrderCount}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
