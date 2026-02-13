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
  const [copyStatus, setCopyStatus] = useState(null);

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

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // Voucher View
  if (selectedOrder) {
    return (
      <div className="modern-voucher-page">
        <style jsx>{`
          .modern-voucher-page { background: linear-gradient(135deg, #0F1115 0%, #1C1F26 100%); min-height: 100vh; color: #fff; padding: 20px; font-family: sans-serif; }
          .v-header { text-align: center; margin-bottom: 30px; }
          .v-header h1 { font-size: 26px; font-weight: 800; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; }
          .info-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 16px; }
          .info-card label { display: block; font-size: 10px; color: #8E9196; margin-bottom: 4px; }
          .pickup-highlight { grid-column: span 2; background: rgba(0, 242, 234, 0.1); border: 1px solid rgba(0, 242, 234, 0.2); padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; }
          .items-section { background: rgba(255, 255, 255, 0.03); border-radius: 20px; padding: 15px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { text-align: left; font-size: 10px; color: #8E9196; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
          .items-table td { padding: 12px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.02); }
          .total-box { margin-top: 25px; background: #fff; color: #000; padding: 20px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; }
          .v-actions { position: fixed; bottom: 20px; left: 20px; right: 20px; display: flex; gap: 12px; }
          .btn { flex: 1; padding: 16px; border-radius: 16px; border: none; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .btn-back { background: #2D323D; color: #fff; }
          .btn-print { background: #00F2EA; color: #000; }
        `}</style>

        <div className="v-header">
          <h1>YNS KITCHEN</h1>
          <p style={{color: '#00F2EA', fontSize: '11px', letterSpacing: '2px'}}>PREMIUM GUEST CHECK</p>
        </div>

        <div className="info-grid">
          <div className="info-card"><label>CUSTOMER</label><span>{selectedOrder.customerName}</span></div>
          <div className="info-card"><label>PHONE</label><span>{selectedOrder.customerPhone || selectedOrder.phone}</span></div>
          <div className="info-card"><label>ORDER ID</label><span>#{selectedOrder.id.slice(-6).toUpperCase()}</span></div>
          <div className="info-card"><label>DATE</label><span>{selectedOrder.date}</span></div>
          <div className="pickup-highlight">
            <div><label style={{color: '#00F2EA'}}>PICK-UP</label><span>{selectedOrder.pickupDate || 'Today'} | {selectedOrder.pickupTime || 'ASAP'}</span></div>
            <i className="fas fa-clock" style={{color: '#00F2EA'}}></i>
          </div>
        </div>

        <div className="items-section">
          <table className="items-table">
            <thead><tr><th>ITEM</th><th style={{textAlign: 'center'}}>QTY</th><th style={{textAlign: 'right'}}>PRICE</th></tr></thead>
            <tbody>
              {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td style={{textAlign: 'center'}}>{item.quantity || item.qty}</td>
                  <td style={{textAlign: 'right'}}>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedOrder.note && <div style={{marginTop: '15px', color: '#FFD43B', fontSize: '12px'}}><strong>NOTE:</strong> {selectedOrder.note}</div>}
        </div>

        <div className="total-box">
          <span style={{fontWeight: 700, opacity: 0.6}}>TOTAL</span>
          <span style={{fontSize: '22px', fontWeight: 900}}>{Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks</span>
        </div>

        <div className="v-actions">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}><i className="fas fa-chevron-left"></i> BACK</button>
          <button className="btn btn-print" onClick={() => window.print()}><i className="fas fa-print"></i> PRINT</button>
        </div>
      </div>
    );
  }

  // History List View
  return (
    <div className="admin-root">
      <style jsx global>{`
        body { background: #0A0C10; color: #fff; font-family: sans-serif; margin: 0; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; position: sticky; top: 0; background: rgba(10, 12, 16, 0.9); backdrop-filter: blur(10px); z-index: 100; border-bottom: 1px solid #1f2229; }
        .icon-btn { background: #161A22; border: 1px solid #2d323d; color: #fff; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .summary-card { background: linear-gradient(145deg, #161A22, #0A0C10); margin: 20px; padding: 20px; border-radius: 20px; border: 1px solid #2d323d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .date-group { padding: 10px 20px 5px; color: #00F2EA; font-size: 11px; font-weight: 800; letter-spacing: 1px; }
        .order-item { background: #161A22; margin: 0 20px 10px; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #1f2229; position: relative; }
        .amount-tag { color: #00F2EA; font-weight: 800; font-size: 15px; }
        .copy-toast { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); background: #00F2EA; color: #000; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 12px; z-index: 1000; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { top: 50px; opacity: 0; } to { top: 80px; opacity: 1; } }
        .menu-dropdown { position: absolute; right: 20px; top: 65px; background: #1c1f26; border: 1px solid #2d323d; border-radius: 15px; width: 200px; box-shadow: 0 15px 40px rgba(0,0,0,0.6); overflow: hidden; z-index: 500; }
        .menu-link { padding: 12px 20px; font-size: 14px; display: flex; align-items: center; gap: 12px; color: #ccc; transition: 0.2s; }
        .menu-link:hover { background: #2d323d; color: #fff; }
      `}</style>

      {copyStatus && <div className="copy-toast">ID Copied to Clipboard!</div>}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Header */}
      <div className="header">
        <Link href="/admin" className="icon-btn"><i className="fas fa-chevron-left"></i></Link>
        <b style={{fontSize: '18px'}}>Order History</b>
        <div style={{display: 'flex', gap: '10px'}}>
          <div className="icon-btn" style={{position: 'relative'}}>
            <i className="fas fa-calendar-alt"></i>
            <input type="date" style={{position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer'}} onChange={(e) => setSelDate(e.target.value)} />
          </div>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></button>
        </div>
      </div>

      {/* Three-dot Menu */}
      {showMenu && (
        <div className="menu-dropdown">
          <div className="menu-link" onClick={() => {setShowTracker(!showTracker); setShowMenu(false);}}><i className="fas fa-search"></i> Order Tracker</div>
          <div className="menu-link"><i className="fas fa-file-export"></i> Export to Excel</div>
          <div className="menu-link"><i className="fas fa-chart-line"></i> View Analytics</div>
          <div className="menu-link" style={{color: '#ff453a'}} onClick={() => {setSelDate(""); setShowMenu(false);}}><i className="fas fa-undo"></i> Reset Filters</div>
        </div>
      )}

      {/* Revenue Card */}
      <div className="summary-card">
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div><small style={{color: '#8e9196', fontWeight: 600}}>TOTAL REVENUE</small><div style={{fontSize: '28px', fontWeight: 900, color: '#fff'}}>{totalIncome.toLocaleString()} <span style={{fontSize: '14px'}}>Ks</span></div></div>
          <div style={{textAlign: 'right'}}><small style={{color: '#8e9196', fontWeight: 600}}>ORDERS</small><div style={{fontSize: '28px', fontWeight: 900}}>{filteredOrders.length}</div></div>
        </div>
      </div>

      {/* Tracker Search Bar */}
      {showTracker && (
        <div style={{padding: '0 20px 15px', animation: 'fadeIn 0.3s'}}>
          <div style={{background: '#161A22', border: '1px solid #2d323d', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 15px'}}>
            <i className="fas fa-search" style={{color: '#444'}}></i>
            <input placeholder="Enter Order ID to track..." style={{background: 'none', border: 'none', padding: '12px', color: '#fff', outline: 'none', flex: 1}} onChange={(e) => setSearchId(e.target.value)} />
            {searchId && <i className="fas fa-times" onClick={() => setSearchId("")}></i>}
          </div>
        </div>
      )}

      {/* Order List */}
      <div style={{paddingBottom: '50px'}}>
        {Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div className="date-group">{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-item">
                <div style={{flex: 1}} onClick={() => setSelectedOrder(order)}>
                  <div style={{fontSize: '15px', fontWeight: '700', marginBottom: '4px'}}>{order.customerName}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{fontSize: '11px', color: '#8e9196', background: '#222', padding: '2px 6px', borderRadius: '4px'}}>#{order.id.slice(0, 5)}</span>
                    <span style={{fontSize: '11px', color: '#666'}}>• {order.time}</span>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div className="amount-tag">+{Number(order.totalPrice || order.total).toLocaleString()}</div>
                  <button onClick={() => handleCopy(order.id)} style={{background: 'none', border: 'none', color: '#444', fontSize: '14px'}}><i className="far fa-copy"></i></button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
    }
        
