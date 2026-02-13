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

  // Date Label Helper
  const getDateLabel = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "TODAY";
    if (dateStr === yesterday) return "YESTERDAY";
    return dateStr;
  };

  // Grouping Logic
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const date = order.date || "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  // Download Voucher as Image
  const downloadVoucher = async () => {
    if (voucherRef.current) {
      const canvas = await html2canvas(voucherRef.current, { backgroundColor: "#ffffff" });
      const link = document.createElement('a');
      link.download = `Voucher-${selectedOrder.orderId || selectedOrder.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (selectedOrder) {
    return (
      <div className="full-page-voucher">
        <style jsx>{`
          .full-page-voucher { background: #fff; min-height: 100vh; color: #000; padding: 20px; font-family: 'Courier New', monospace; }
          .v-header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
          .v-body { font-size: 14px; line-height: 1.8; }
          .v-item { display: flex; justify-content: space-between; margin: 5px 0; }
          .v-footer { border-top: 2px dashed #000; margin-top: 20px; padding-top: 15px; text-align: center; }
          .v-btns { position: fixed; bottom: 0; left: 0; right: 0; padding: 20px; background: #fff; display: flex; gap: 10px; border-top: 1px solid #eee; }
          .btn { flex: 1; padding: 15px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; }
          .btn-save { background: #000; color: #fff; }
          .btn-back { background: #f0f0f0; color: #000; }
        `}</style>
        
        <div ref={voucherRef} style={{ padding: '20px' }}>
          <div className="v-header">
            <h2 style={{ margin: 0 }}>YNS KITCHEN</h2>
            <p style={{ margin: 0, fontSize: '12px' }}>OFFICIAL RECEIPT</p>
          </div>
          <div className="v-body">
            <div className="v-item"><span>Customer:</span> <span>{selectedOrder.customerName}</span></div>
            <div className="v-item"><span>Phone:</span> <span>{selectedOrder.customerPhone || selectedOrder.phone}</span></div>
            <div className="v-item"><span>Date:</span> <span>{selectedOrder.date} | {selectedOrder.time}</span></div>
            <div style={{ margin: '15px 0', borderTop: '1px solid #eee' }}></div>
            {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
              <div key={i} className="v-item">
                <span>{item.name} x{item.quantity || item.qty}</span>
                <span>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</span>
              </div>
            ))}
            <div className="v-footer">
              <h2 style={{ margin: 0 }}>TOTAL: {Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks</h2>
            </div>
          </div>
        </div>

        <div className="v-btns">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>BACK</button>
          <button className="btn btn-save" onClick={downloadVoucher}>SAVE VOUCHER</button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-admin">
      <style jsx global>{`
        :root { --p-bg: #0A0C10; --p-card: #161A22; --p-accent: #00F2EA; --p-text: #FFFFFF; }
        body { background: var(--p-bg); color: var(--p-text); font-family: sans-serif; margin: 0; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 10px 15px; position: sticky; top: 0; background: rgba(10, 12, 16, 0.9); backdrop-filter: blur(10px); z-index: 100; border-bottom: 1px solid #222; }
        .icon-btn { background: var(--p-card); border: 1px solid #2D323D; color: white; width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        
        .summary-section { padding: 15px; }
        .main-card { background: linear-gradient(145deg, #1C1F26, #0A0C10); border-radius: 20px; padding: 15px; border: 1px solid #2D323D; }
        
        .date-group-label { font-size: 10px; color: var(--p-accent); font-weight: 800; margin: 20px 15px 10px; letter-spacing: 1px; }
        .list-container { padding: 0 15px 100px; }
        .order-item { background: var(--p-card); border-radius: 15px; padding: 10px 15px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; border: 1px solid #222; }
        
        .more-menu { position: absolute; top: 50px; right: 15px; background: #1C1F26; border-radius: 12px; padding: 5px; width: 170px; border: 1px solid #333; z-index: 500; }
        .menu-item { padding: 10px; font-size: 13px; display: flex; align-items: center; gap: 10px; color: #ccc; }
      `}</style>

      {/* Header */}
      <div className="header">
        <Link href="/admin" className="icon-btn"><i className="fas fa-chevron-left"></i></Link>
        <span style={{ fontWeight: 700, fontSize: '15px' }}>Order History</span>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          <div className="icon-btn">
            <i className="fas fa-calendar-alt"></i>
            <input type="date" style={{ position: 'absolute', opacity: 0, width: '35px' }} onChange={(e) => setSelDate(e.target.value)} />
          </div>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></button>
          {showMenu && (
            <div className="more-menu">
              <div className="menu-item" onClick={() => {setShowTracker(!showTracker); setShowMenu(false);}}><i className="fas fa-search"></i> Tracker</div>
              <div className="menu-item" style={{ color: '#FF453A' }} onClick={() => setSelDate("")}>Reset</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary - Compact size */}
      <div className="summary-section">
        <div className="main-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#8E9196', fontSize: '10px', margin: 0 }}>REVENUE</p>
              <h2 style={{ margin: 0, fontSize: '22px' }}>{totalIncome.toLocaleString()} <small style={{ fontSize: '12px' }}>Ks</small></h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#8E9196', fontSize: '10px', margin: 0 }}>ORDERS</p>
              <h2 style={{ margin: 0, fontSize: '22px' }}>{filteredOrders.length}</h2>
            </div>
          </div>
        </div>
      </div>

      {showTracker && (
        <div style={{ padding: '0 15px 15px' }}>
          <input 
            placeholder="Search Order ID..." 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#161A22', border: '1px solid #333', color: '#fff', outline: 'none' }}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>
      )}

      {/* Grouped Order List */}
      <div className="list-container">
        {Object.keys(groupedOrders).length > 0 ? Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div className="date-group-label">{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-item" onClick={() => setSelectedOrder(order)}>
                <div style={{ flex: 1 }}>
                  <b style={{ display: 'block', fontSize: '13px' }}>{order.customerName}</b>
                  <span style={{ fontSize: '10px', color: '#8E9196' }}>#{ (order.orderId || order.id).toString().slice(0,8) } • {order.time}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: var(--p-accent), fontSize: '13px' }}>+{Number(order.totalPrice || order.total).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )) : <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px' }}>No orders found.</div>}
      </div>
    </div>
  );
        }
        
