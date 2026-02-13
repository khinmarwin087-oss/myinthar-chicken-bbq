"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db } from "../../../lib/firebase"; 
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import html2canvas from 'html2canvas';

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDate, setSelDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const voucherRef = useRef(null);

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

  const downloadVoucher = async () => {
    if (voucherRef.current) {
      try {
        const canvas = await html2canvas(voucherRef.current, { 
          backgroundColor: "#ffffff",
          scale: 2 // ပုံထွက်ပိုကြည်အောင်
        });
        const link = document.createElement('a');
        link.download = `Voucher-${selectedOrder.orderId || selectedOrder.id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        alert("Download failed!");
      }
    }
  };

  // Full Page Voucher View
  if (selectedOrder) {
    return (
      <div className="voucher-page">
        <style jsx>{`
          .voucher-page { background: #fff; min-height: 100vh; color: #000; font-family: 'Courier New', monospace; position: relative; padding-bottom: 80px; }
          .v-container { padding: 40px 25px; max-width: 500px; margin: 0 auto; }
          .v-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
          .v-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .items-list { margin: 20px 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .v-footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #000; }
          .v-action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 15px; display: flex; gap: 10px; box-shadow: 0 -5px 15px rgba(0,0,0,0.05); }
          .v-btn { flex: 1; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; font-size: 14px; }
          .btn-dl { background: #000; color: #fff; }
          .btn-bk { background: #f2f2f2; color: #000; }
        `}</style>

        <div className="v-container" ref={voucherRef}>
          <div className="v-header">
            <h1 style={{ margin: 0, fontSize: '24px' }}>YNS KITCHEN</h1>
            <p style={{ margin: '5px 0 0', fontSize: '12px', letterSpacing: '2px' }}>OFFICIAL RECEIPT</p>
          </div>
          
          <div className="v-row"><span>Customer:</span> <strong>{selectedOrder.customerName}</strong></div>
          <div className="v-row"><span>Phone:</span> <strong>{selectedOrder.customerPhone || selectedOrder.phone}</strong></div>
          <div className="v-row"><span>Date:</span> <strong>{selectedOrder.date} | {selectedOrder.time}</strong></div>
          
          <div className="items-list">
            <div style={{ borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px', fontSize: '12px' }}>ITEMS</div>
            {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
              <div key={i} className="v-row">
                <span>{item.name} x {item.quantity || item.qty}</span>
                <span>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="v-footer">
            <p style={{ margin: 0, fontSize: '12px' }}>TOTAL AMOUNT</p>
            <h2 style={{ margin: '5px 0 0', fontSize: '28px' }}>{Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks</h2>
          </div>
        </div>

        <div className="v-action-bar">
          <button className="v-btn btn-bk" onClick={() => setSelectedOrder(null)}>BACK</button>
          <button className="v-btn btn-dl" onClick={downloadVoucher}>SAVE VOUCHER</button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-root">
      <style jsx global>{`
        :root { --p-bg: #0A0C10; --p-card: #161A22; --p-accent: #00F2EA; }
        body { background: var(--p-bg); color: #fff; font-family: -apple-system, sans-serif; margin: 0; }
        
        .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; position: sticky; top: 0; background: rgba(10,12,16,0.95); backdrop-filter: blur(10px); z-index: 100; border-bottom: 1px solid #1f2229; }
        .icon-btn { background: var(--p-card); border: 1px solid #2d323d; color: #fff; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; position: relative; }
        
        .summary-box { padding: 16px; }
        .summary-card { background: linear-gradient(145deg, #1c1f26, #0a0c10); border-radius: 20px; padding: 18px; border: 1px solid #2d323d; display: flex; justify-content: space-between; }
        .stat-label { color: #8e9196; font-size: 10px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
        .stat-value { margin: 4px 0 0; fontSize: 20px; font-weight: 800; }
        
        .date-header { padding: 15px 16px 8px; color: var(--p-accent); font-size: 10px; font-weight: 900; letter-spacing: 1px; }
        .order-card { background: var(--p-card); margin: 0 16px 8px; padding: 12px 16px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #1f2229; }
        
        .dropdown { position: absolute; top: 45px; right: 0; background: #1c1f26; border: 1px solid #2d323d; border-radius: 12px; width: 160px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .drop-item { padding: 12px 16px; font-size: 13px; display: flex; align-items: center; gap: 10px; color: #eee; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {/* Top Header */}
      <div className="header">
        <Link href="/admin" className="icon-btn"><i className="fas fa-chevron-left"></i></Link>
        <span style={{ fontWeight: 800, fontSize: '16px' }}>Order History</span>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <div className="icon-btn">
            <i className="fas fa-calendar-alt"></i>
            <input type="date" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={(e) => setSelDate(e.target.value)} />
          </div>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></button>
          {showMenu && (
            <div className="dropdown">
              <div className="drop-item" onClick={() => {setShowTracker(!showTracker); setShowMenu(false);}}><i className="fas fa-search"></i> Tracker</div>
              <div className="drop-item" style={{ color: '#ff453a' }} onClick={() => {setSelDate(""); setShowMenu(false);}}>Reset</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="summary-box">
        <div className="summary-card">
          <div>
            <p className="stat-label">REVENUE</p>
            <h2 className="stat-value">{totalIncome.toLocaleString()} <small style={{ fontSize: '12px' }}>Ks</small></h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="stat-label">TOTAL ORDERS</p>
            <h2 className="stat-value">{filteredOrders.length}</h2>
          </div>
        </div>
      </div>

      {/* Tracker Bar */}
      {showTracker && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: '#161a22', border: '1px solid #2d323d', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <i className="fas fa-search" style={{ color: '#444' }}></i>
            <input 
              placeholder="Track Order ID..." 
              style={{ background: 'none', border: 'none', padding: '12px', color: '#fff', outline: 'none', flex: 1, fontSize: '14px' }}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ paddingBottom: '40px' }}>
        {Object.keys(groupedOrders).length > 0 ? Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div className="date-header">{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                <div>
                  <b style={{ display: 'block', fontSize: '14px' }}>{order.customerName}</b>
                  <span style={{ fontSize: '10px', color: '#8e9196' }}>#{ (order.orderId || order.id).toString().slice(0,8) } • {order.time}</span>
                </div>
                <div style={{ fontWeight: 800, color: '#00F2EA', fontSize: '14px' }}>
                  +{Number(order.totalPrice || order.total).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#444' }}>No orders found</div>
        )}
      </div>
    </div>
  );
}
