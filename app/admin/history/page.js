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
      <div className="voucher-overlay">
        <style jsx>{`
          .voucher-overlay {
            background: #000;
            min-height: 100vh;
            padding: 20px;
            animation: fadeIn 0.4s ease;
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

          .premium-voucher {
            background: #fff;
            color: #1a1a1a;
            border-radius: 30px;
            padding: 30px 20px;
            max-width: 400px;
            margin: 0 auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            font-family: 'Inter', sans-serif;
          }

          .v-header { text-align: center; margin-bottom: 25px; }
          .v-header h1 { margin: 0; font-size: 22px; letter-spacing: 2px; font-weight: 900; }
          
          .info-section { 
            background: #f8f9fa; 
            border-radius: 15px; 
            padding: 15px; 
            margin-bottom: 20px;
            font-size: 13px;
          }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .label { color: #6c757d; font-weight: 500; }
          .value { font-weight: 700; text-align: right; }

          .items-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
          .items-table th { 
            text-align: left; 
            font-size: 11px; 
            color: #adb5bd; 
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .items-table td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #fafafa; }
          
          .note-box {
            background: #fff9db;
            border-left: 4px solid #fcc419;
            padding: 10px 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 12px;
          }

          .total-section {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 2px dashed #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .footer-btns {
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%);
            display: flex; gap: 12px; width: calc(100% - 40px);
            max-width: 400px;
          }
          .btn {
            flex: 1; padding: 18px; border-radius: 18px; border: none;
            font-weight: 800; cursor: pointer; transition: 0.3s;
          }
          .btn-back { background: #2d2d2d; color: #fff; }
          .btn-print { background: #00F2EA; color: #000; box-shadow: 0 10px 20px rgba(0, 242, 234, 0.3); }
          .btn:active { transform: scale(0.95); }

          @media print { .footer-btns { display: none; } .voucher-overlay { background: #fff; padding: 0; } }
        `}</style>

        <div className="premium-voucher">
          <div className="v-header">
            <h1>YNS KITCHEN</h1>
            <p style={{ fontSize: '10px', color: '#adb5bd', margin: '5px 0' }}>PREMIUM GUEST CHECK</p>
          </div>

          <div className="info-section">
            <div className="info-row"><span className="label">Customer</span> <span className="value">{selectedOrder.customerName}</span></div>
            <div className="info-row"><span className="label">Phone</span> <span className="value">{selectedOrder.customerPhone || selectedOrder.phone}</span></div>
            <div className="info-row"><span className="label">Order ID</span> <span className="value">#{selectedOrder.id.slice(-6).toUpperCase()}</span></div>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />
            
            {/* Pick-up Details */}
            <div className="info-row" style={{ color: '#00F2EA' }}>
              <span className="label" style={{ color: '#00B8B2' }}>Pick-up Time</span> 
              <span className="value">{selectedOrder.pickupDate || selectedOrder.date} | {selectedOrder.pickupTime || 'ASAP'}</span>
            </div>
          </div>

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
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity || item.qty}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedOrder.note && (
            <div className="note-box">
              <strong>Note:</strong> {selectedOrder.note}
            </div>
          )}

          <div className="total-section">
            <span style={{ fontWeight: 800, color: '#6c757d' }}>TOTAL AMOUNT</span>
            <span style={{ fontSize: '24px', fontWeight: 900 }}>{Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} <small style={{ fontSize: '12px' }}>Ks</small></span>
          </div>
          
          <p style={{ textAlign: 'center', fontSize: '10px', color: '#adb5bd', marginTop: '30px' }}>
            THANK YOU FOR CHOOSING YNS KITCHEN!
          </p>
        </div>

        <div className="footer-btns">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>
            <i className="fas fa-arrow-left"></i> BACK
          </button>
          <button className="btn btn-print" onClick={() => window.print()}>
            PRINT RECEIPT <i className="fas fa-print"></i>
          </button>
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
  
