"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from "../../../lib/firebase"; 
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDate, setSelDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const validOrders = allOrders.filter(o => ['Cooking', 'Ready', 'Done', 'Success', 'completed'].includes(o.status));
      setOrders(validOrders);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = orders;
    if (selDate) result = result.filter(o => o.date === selDate);
    if (searchId) {
      result = result.filter(o => 
        (o.orderId || o.id).toString().toLowerCase().includes(searchId.toLowerCase())
      );
    }
    setFilteredOrders(result);
  }, [selDate, searchId, orders]);

  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || curr.total || 0), 0);

  const getDateLabel = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "TODAY";
    if (dateStr === yesterday) return "YESTERDAY";
    return dateStr;
  };

  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const date = order.date || "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  // ပုံအဖြစ်သိမ်းမယ့်အစား browser ရဲ့ print function ကို သုံးမယ် (PDF သိမ်းလို့ရတယ်)
  const handlePrint = () => {
    window.print();
  };

  if (selectedOrder) {
    return (
      <div className="voucher-view">
        <style jsx>{`
          .voucher-view { background: #fff; min-height: 100vh; color: #000; font-family: 'Courier New', monospace; padding: 40px 20px; }
          .v-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
          .v-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .v-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #000; }
          .no-print { position: fixed; bottom: 0; left: 0; right: 0; padding: 20px; background: #fff; display: flex; gap: 10px; border-top: 1px solid #eee; }
          .btn { flex: 1; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
          
          @media print {
            .no-print { display: none; }
            body { background: #fff; }
            .voucher-view { padding: 0; }
          }
        `}</style>

        <div className="v-header">
          <h1 style={{ margin: 0 }}>YNS KITCHEN</h1>
          <p style={{ margin: 0, fontSize: '12px' }}>OFFICIAL RECEIPT</p>
        </div>

        <div className="v-row"><span>Customer:</span> <strong>{selectedOrder.customerName}</strong></div>
        <div className="v-row"><span>Phone:</span> <strong>{selectedOrder.customerPhone || selectedOrder.phone}</strong></div>
        <div className="v-row"><span>Date:</span> <strong>{selectedOrder.date} | {selectedOrder.time}</strong></div>
        
        <div style={{ margin: '20px 0', borderBottom: '1px solid #000', paddingBottom: '5px', fontSize: '12px' }}>ITEMS</div>
        {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
          <div key={i} className="v-row">
            <span>{item.name} x {item.quantity || item.qty}</span>
            <span>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</span>
          </div>
        ))}

        <div className="v-footer">
          <h2 style={{ margin: 0 }}>TOTAL: {Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks</h2>
          <p style={{ fontSize: '10px', marginTop: '10px' }}>Thank You! Come Again.</p>
        </div>

        <div className="no-print">
          <button className="btn" style={{ background: '#f2f2f2' }} onClick={() => setSelectedOrder(null)}>BACK</button>
          <button className="btn" style={{ background: '#000', color: '#fff' }} onClick={handlePrint}>PRINT / PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <style jsx global>{`
        body { background: #0A0C10; color: #fff; font-family: sans-serif; margin: 0; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; background: #0A0C10; z-index: 100; border-bottom: 1px solid #1f2229; }
        .btn-box { background: #161A22; border: 1px solid #2d323d; color: #fff; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .summary-card { background: #161A22; margin: 16px; padding: 15px; border-radius: 15px; border: 1px solid #2d323d; display: flex; justify-content: space-between; }
        .date-label { padding: 15px 16px 5px; color: #00F2EA; font-size: 10px; font-weight: 900; }
        .order-card { background: #161A22; margin: 0 16px 8px; padding: 12px 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #1f2229; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="header">
        <Link href="/admin" className="btn-box"><i className="fas fa-chevron-left"></i></Link>
        <b style={{ fontSize: '16px' }}>Order History</b>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="btn-box" style={{ position: 'relative' }}>
            <i className="fas fa-calendar-alt"></i>
            <input type="date" style={{ position: 'absolute', opacity: 0, inset: 0 }} onChange={(e) => setSelDate(e.target.value)} />
          </div>
          <button className="btn-box" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></button>
        </div>
      </div>

      {showMenu && (
        <div style={{ position: 'absolute', right: 16, top: 60, background: '#161A22', border: '1px solid #2d323d', borderRadius: '10px', zIndex: 200 }}>
          <div style={{ padding: '12px 20px', fontSize: '14px' }} onClick={() => {setShowTracker(!showTracker); setShowMenu(false);}}>Tracker</div>
          <div style={{ padding: '12px 20px', fontSize: '14px', color: 'red' }} onClick={() => {setSelDate(""); setShowMenu(false);}}>Reset</div>
        </div>
      )}

      <div className="summary-card">
        <div><small style={{ color: '#8e9196' }}>REVENUE</small><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalIncome.toLocaleString()} Ks</div></div>
        <div style={{ textAlign: 'right' }}><small style={{ color: '#8e9196' }}>ORDERS</small><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{filteredOrders.length}</div></div>
      </div>

      {showTracker && (
        <div style={{ padding: '0 16px 10px' }}>
          <input 
            placeholder="Search Order ID..." 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#161A22', border: '1px solid #2d323d', color: '#fff' }}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>
      )}

      <div style={{ paddingBottom: '50px' }}>
        {Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div className="date-label">{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{order.customerName}</div>
                  <small style={{ color: '#8e9196' }}>#{order.id.slice(0, 5)} • {order.time}</small>
                </div>
                <div style={{ fontWeight: 'bold', color: '#00F2EA' }}>+{Number(order.totalPrice || order.total).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
                    }
  
