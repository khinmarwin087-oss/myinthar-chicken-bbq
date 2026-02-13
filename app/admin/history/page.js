"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, auth } from "../../../lib/firebase"; // လမ်းကြောင်းသေချာစစ်ပါ
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null); // Accordion အတွက်
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    // Firestore မှ အော်ဒါအားလုံးကို အချိန်အလိုက် နောက်ဆုံးမှ အရင်ပုံစံ (Descending) ယူမည်
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(orderData);
      setFilteredOrders(orderData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ရက်စွဲဖြင့် Filter လုပ်ခြင်း
  const handleFilter = (e) => {
    const selectedDate = e.target.value;
    setFilterDate(selectedDate);
    if (selectedDate === "") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(o => o.date === selectedDate);
      setFilteredOrders(filtered);
    }
  };

  const toggleAccordion = (id) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <div style={{ background: '#F8F9FC', minHeight: '100vh', paddingBottom: '50px' }}>
      <style jsx global>{`
        :root { --pearl: #ffffff; --bg: #F8F9FC; --primary: #007AFF; --text: #1C1C1E; --gray: #8E8E93; --success: #34C759; --warning: #FF9500; }
        .header { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px); padding: 20px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .back-btn { width: 35px; height: 35px; border-radius: 10px; background: white; display: flex; align-items: center; justify-content: center; color: var(--text); text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .filter-box { display: flex; gap: 10px; align-items: center; background: #f0f2f5; padding: 10px 15px; border-radius: 15px; margin-top: 15px; }
        .filter-box input { border: none; background: transparent; outline: none; font-size: 14px; width: 100%; color: var(--text); }
        .history-card { background: white; border-radius: 20px; padding: 18px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.01); cursor: pointer; }
        .status-badge { padding: 5px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
        .status-pending { background: #FFF5CC; color: var(--warning); }
        .status-done, .status-completed { background: #EAF9EE; color: var(--success); }
        .order-detail { overflow: hidden; transition: 0.3s; padding-top: 15px; border-top: 1px dashed #EEE; margin-top: 15px; }
        .item-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin" className="back-btn"><i className="fas fa-chevron-left"></i></Link>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Sales History</h2>
        </div>
        <div className="filter-box">
          <i className="fas fa-calendar-alt" style={{ color: 'var(--gray)' }}></i>
          <input type="date" value={filterDate} onChange={handleFilter} />
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray)' }}>Loading records...</p>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--gray)' }}>
            <i className="fas fa-receipt" style={{ fontSize: '40px', opacity: 0.3, marginBottom: '10px' }}></i>
            <p>မှတ်တမ်းမရှိသေးပါ။</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="history-card" onClick={() => toggleAccordion(order.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', color: 'var(--primary)' }}>ID: #{order.orderId || order.id.slice(0, 5)}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600 }}>
                    <i className="far fa-user"></i> {order.customerName || 'Guest'}
                  </span>
                  <br />
                  <span style={{ fontSize: '11px', color: 'var(--gray)' }}>{order.date}</span>
                </div>
                <span className={`status-badge status-${(order.status || 'pending').toLowerCase()}`}>
                  {order.status}
                </span>
              </div>

              {activeId === order.id && (
                <div className="order-detail">
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} className="item-row">
                      <span style={{ flex: 2 }}>{item.name}</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>x{item.qty}</span>
                      <span style={{ flex: 1, textAlign: 'right' }}>{(item.price * item.qty).toLocaleString()} Ks</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F5F5F5', fontWeight: 800 }}>
                    <span>Total Revenue</span>
                    <span style={{ color: 'var(--primary)' }}>{(order.totalPrice || order.total || 0).toLocaleString()} Ks</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
  }
                    
