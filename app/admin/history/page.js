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
      <div className="modern-voucher-page">
        <style jsx>{`
          .modern-voucher-page {
            background: linear-gradient(135deg, #0F1115 0%, #1C1F26 100%);
            min-height: 100vh;
            color: #fff;
            padding: 20px;
            font-family: 'Segoe UI', Roboto, sans-serif;
          }

          /* Header Section */
          .v-header { text-align: center; margin-bottom: 30px; padding-top: 10px; }
          .v-header h1 { font-size: 26px; font-weight: 800; margin: 0; color: #fff; }
          .v-header p { font-size: 11px; color: #00F2EA; letter-spacing: 3px; margin-top: 5px; opacity: 0.8; }

          /* Info Grid Layout */
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 12px; 
            margin-bottom: 25px; 
          }
          .info-card { 
            background: rgba(255, 255, 255, 0.05); 
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 12px; 
            border-radius: 16px; 
            backdrop-filter: blur(10px);
          }
          .info-card label { display: block; font-size: 10px; color: #8E9196; margin-bottom: 4px; font-weight: 600; }
          .info-card span { display: block; font-size: 13px; font-weight: 600; color: #E0E0E0; }

          /* Pick-up Card (Special Highlight) */
          .pickup-highlight {
            grid-column: span 2;
            background: linear-gradient(90deg, rgba(0, 242, 234, 0.1) 0%, rgba(0, 184, 178, 0.05) 100%);
            border: 1px solid rgba(0, 242, 234, 0.2);
            padding: 15px;
            border-radius: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          /* Items List Table */
          .items-section {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 20px;
            padding: 15px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .items-table th { text-align: left; font-size: 10px; color: #8E9196; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
          .items-table td { padding: 12px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.02); }
          .qty-badge { background: #2D323D; padding: 2px 8px; border-radius: 6px; font-size: 11px; }

          /* Note Section */
          .note-section { margin-top: 15px; font-size: 12px; color: #FFD43B; background: rgba(255, 212, 59, 0.05); padding: 10px; border-radius: 10px; border-left: 3px solid #FFD43B; }

          /* Total Box */
          .total-box {
            margin-top: 25px;
            background: #fff;
            color: #000;
            padding: 20px;
            border-radius: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          /* Fixed Action Buttons */
          .v-actions {
            position: fixed; bottom: 20px; left: 20px; right: 20px;
            display: flex; gap: 12px;
          }
          .btn {
            flex: 1; padding: 16px; border-radius: 16px; border: none; font-weight: 800; cursor: pointer; transition: 0.2s;
            display: flex; align-items: center; justify-content: center; gap: 8px;
          }
          .btn-back { background: #2D323D; color: #fff; }
          .btn-print { background: #00F2EA; color: #000; }
          .btn:active { transform: scale(0.96); }

          @media print { .v-actions { display: none; } body { background: #fff; } }
        `}</style>

        <div className="v-header">
          <h1>YNS KITCHEN</h1>
          <p>PREMIUM GUEST CHECK</p>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <label>CUSTOMER</label>
            <span>{selectedOrder.customerName}</span>
          </div>
          <div className="info-card">
            <label>PHONE</label>
            <span>{selectedOrder.customerPhone || selectedOrder.phone}</span>
          </div>
          <div className="info-card">
            <label>ORDER ID</label>
            <span>#{selectedOrder.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="info-card">
            <label>ORDER DATE</label>
            <span>{selectedOrder.date}</span>
          </div>

          <div className="pickup-highlight">
            <div>
              <label style={{ color: '#00F2EA' }}>PICK-UP TIME</label>
              <span style={{ fontSize: '15px', color: '#fff' }}>
                {selectedOrder.pickupDate || 'Today'} | {selectedOrder.pickupTime || 'ASAP'}
              </span>
            </div>
            <i className="fas fa-clock" style={{ color: '#00F2EA', fontSize: '20px' }}></i>
          </div>
        </div>

        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th>ITEM NAME</th>
                <th style={{ textAlign: 'center' }}>QTY</th>
                <th style={{ textAlign: 'right' }}>PRICE</th>
              </tr>
            </thead>
            <tbody>
              {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td style={{ textAlign: 'center' }}><span className="qty-badge">{item.quantity || item.qty}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {selectedOrder.note && (
            <div className="note-section">
              <strong>NOTE:</strong> {selectedOrder.note}
            </div>
          )}
        </div>

        <div className="total-box">
          <span style={{ fontWeight: 700, opacity: 0.6 }}>TOTAL AMOUNT</span>
          <span style={{ fontSize: '22px', fontWeight: 900 }}>
            {Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px', color: '#8E9196', fontSize: '10px', paddingBottom: '100px' }}>
          THANK YOU FOR CHOOSING YNS KITCHEN!
        </div>

        <div className="v-actions">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>
            <i className="fas fa-chevron-left"></i> BACK
          </button>
          <button className="btn btn-print" onClick={() => window.print()}>
            <i className="fas fa-print"></i> PRINT
          </button>
        </div>
      </div>
    );
  }

  // အောက်က return ကတော့ အရင် အော်ဒါစာရင်းပြတဲ့ နေရာပါ
  

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
  
