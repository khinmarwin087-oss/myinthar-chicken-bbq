"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
// Path ကို သတိထားပါ (app/admin/history/page.js မို့လို့ အစက် ၃ စု သုံးထားပါတယ်)
import { db } from "../../../lib/firebase"; 
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDate, setSelDate] = useState("");
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    // Firestore မှ Data များ Real-time ဖတ်ခြင်း
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Admin လက်ခံထားသည့် Status များသာ စစ်ထုတ်မည်
      const allowedStatus = ['Cooking', 'Ready', 'Done', 'Success', 'completed'];
      const validOrders = allOrders.filter(order => 
        order.status && allowedStatus.includes(order.status)
      );

      setOrders(validOrders);
      applyFilter(validOrders, selDate);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selDate]);

  const applyFilter = (data, date) => {
    let filtered = data;
    if (date) {
      filtered = data.filter(o => o.date === date);
    }
    
    setFilteredOrders(filtered);
    
    // Summary တွက်ချက်ခြင်း
    const income = filtered.reduce((acc, curr) => acc + Number(curr.totalPrice || curr.total || 0), 0);
    setTotalIncome(income);
    setTotalCount(filtered.length);
  };

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setToast(true);
    setTimeout(() => setToast(false), 1500);
  };

  const getFriendlyDate = (d) => {
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    return d === today ? "TODAY" : d === yest ? "YESTERDAY" : d;
  };

  // ရက်စွဲအလိုက် အုပ်စုဖွဲ့ခြင်း
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const date = order.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  return (
    <div style={{ background: '#F2F5F9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style jsx global>{`
        .header { background: white; padding: 15px 20px; position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 0 rgba(0,0,0,0.05); }
        .back-btn { width: 38px; height: 38px; border-radius: 12px; background: #F2F2F7; display: flex; align-items: center; justify-content: center; color: #1C1C1E; text-decoration: none; }
        .filter-box { position: relative; width: 38px; height: 38px; background: #F2F2F7; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .summary-card { margin: 20px; background: #007AFF; padding: 22px; border-radius: 24px; color: white; box-shadow: 0 10px 20px rgba(0,122,255,0.2); }
        .order-card { background: white; border-radius: 18px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .date-label { font-size: 11px; font-weight: 800; color: #8E8E93; margin: 25px 0 12px; display: flex; align-items: center; gap: 10px; }
        .date-label::after { content: ''; flex: 1; height: 1px; background: #E5E5EA; }
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: flex-end; }
        .modal-content { background: white; width: 100%; border-radius: 30px 30px 0 0; padding: 30px 25px; animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: '#F2F5F9', z-index: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '30px', height: '30px', border: '3px solid #E5E5EA', borderTop: '3px solid #007AFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px', borderRadius: '25px', fontSize: '12px', zIndex: 5000 }}>ID Copied!</div>}

      <div className="header">
        <Link href="/admin" className="back-btn"><i className="fas fa-arrow-left"></i></Link>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Order History</h2>
        <div className="filter-box">
          <i className="fas fa-calendar-alt" style={{ color: '#007AFF' }}></i>
          <input type="date" style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} onChange={(e) => setSelDate(e.target.value)} />
        </div>
      </div>

      <div className="summary-card">
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>Total Revenue</div>
        <div style={{ fontSize: '28px', fontWeight: 800 }}>{totalIncome.toLocaleString()} Ks</div>
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '15px 0' }} />
        <div style={{ display: 'flex', justify fodder Between: 'space-between', fontSize: '12px', fontWeight: 600 }}>
          <span>Orders Completed</span>
          <span>{totalCount}</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 100px' }}>
        {Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div className="date-label">{getFriendlyDate(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                <div style={{ width: '48px', height: '48px', background: '#F0F7FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF' }}>
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ display: 'block', fontSize: '15px' }}>{order.customerName}</b>
                  <span style={{ fontSize: '11px', color: '#8E8E93' }}><i className="far fa-clock"></i> {order.time}</span>
                  <div style={{ background: '#F2F2F7', color: '#8E8E93', fontSize: '10px', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '5px', fontWeight: 600 }} onClick={(e) => copyToClipboard(order.orderId || order.id, e)}>
                    <i className="far fa-copy"></i> #{order.orderId || order.id.slice(0, 6)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#34C759', fontWeight: 800, fontSize: '15px' }}>+{Number(order.totalPrice || order.total).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="modal" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '5px' }}>Customer Name</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{selectedOrder.customerName}</div>
              <div style={{ background: '#F2F2F7', fontSize: '12px', padding: '5px 12px', borderRadius: '8px', display: 'inline-block', marginTop: '10px' }}>ID: #{selectedOrder.orderId || selectedOrder.id}</div>
            </div>

            <div style={{ background: '#F8F9FC', borderRadius: '20px', padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 13 }}>
                <span style={{ color: '#8E8E93' }}>Phone</span>
                <span style={{ fontWeight: 700 }}>{selectedOrder.customerPhone || selectedOrder.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#8E8E93' }}>Time</span>
                <span style={{ fontWeight: 700 }}>{selectedOrder.date} | {selectedOrder.time}</span>
              </div>
            </div>

            <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 800, color: '#8E8E93' }}>ORDER ITEMS</div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {selectedOrder.cartItems?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F2F2F7', fontSize: 14 }}>
                    <span>{item.name} x {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>{(item.price * item.quantity).toLocaleString()} Ks</span>
                </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 15, borderTop: '2px solid #F2F2F7' }}>
              <span style={{ fontWeight: 800 }}>Total Amount</span>
              <span style={{ fontWeight: 800, color: '#007AFF', fontSize: 18 }}>{Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks</span>
            </div>

            <button onClick={() => setSelectedOrder(null)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#1C1C1E', color: 'white', fontWeight: 700, marginTop: 25 }}>Back to List</button>
          </div>
        </div>
      )}
    </div>
  );
                               }
