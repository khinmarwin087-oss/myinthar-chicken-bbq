"use client";
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from "../../../lib/firebase"; 
import { collection, onSnapshot, query } from "firebase/firestore";

export default function AdminHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDate, setSelDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allOrders.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
      setOrders(allOrders.filter(o => ['Success', 'Done', 'completed'].includes(o.status)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = (o.name || o.customerName || "").toLowerCase();
      const orderID = (o.id || "").toLowerCase();
      const matchesDate = selDate ? o.date === selDate : true;
      const matchesSearch = searchId ? (orderID.includes(searchId.toLowerCase()) || name.includes(searchId.toLowerCase())) : true;
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

  // Calculations
  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || 0), 0);
  const totalOrders = filteredOrders.length;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.phone || o.name)).size;

  const handleDownloadPDF = () => {
    window.print(); // Browser print as PDF
    setShowMenu(false);
  };

  return (
    <div className="history-container">
      <style jsx>{`
        .history-container { background: #F8F9FA; min-height: 100vh; font-family: -apple-system, sans-serif; color: #333; padding-bottom: 30px; }
        .header { background: #FFF; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #EEE; position: sticky; top: 0; z-index: 100; }
        .back-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #555; }
        .menu-rel { position: relative; }
        .dot-btn { background: none; border: none; font-size: 20px; color: #555; padding: 5px; }
        .dropdown { position: absolute; right: 0; top: 35px; background: #FFF; border: 1px solid #EEE; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 160px; z-index: 101; }
        .dropdown button { width: 100%; padding: 10px; border: none; background: none; text-align: left; font-size: 12px; color: #444; border-bottom: 1px solid #F5F5F5; }
        
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 16px; }
        .s-card { background: #FFF; padding: 10px; border-radius: 10px; border: 1px solid #EAEAEA; text-align: center; }
        .s-card small { font-size: 9px; color: #888; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .s-card b { font-size: 13px; color: #222; }

        .search-area { padding: 0 16px 12px; display: flex; gap: 8px; }
        .search-input { flex: 2; padding: 8px 12px; border-radius: 8px; border: 1px solid #DDD; font-size: 12px; outline: none; }
        .date-input { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #DDD; font-size: 11px; }

        .order-item { background: #FFF; margin: 0 16px 8px; padding: 12px; border-radius: 12px; border: 1px solid #F0F0F0; display: flex; justify-content: space-between; align-items: center; }
        .o-info b { font-size: 13px; display: block; margin-bottom: 2px; }
        .o-info small { font-size: 10px; color: #999; }
        .o-price { text-align: right; }
        .o-price div { font-size: 13px; font-weight: 700; color: #2D3436; }
        .o-price span { font-size: 9px; color: #27AE60; background: #E8F8F0; padding: 2px 6px; border-radius: 4px; }

        @media print { .header, .summary-grid, .search-area, .dot-btn { display: none !important; } }
      `}</style>

      {/* Header */}
      <div className="header">
        <button className="back-btn" onClick={() => router.back()}>←</button>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Order History</span>
        <div className="menu-rel">
          <button className="dot-btn" onClick={() => setShowMenu(!showMenu)}>⋮</button>
          {showMenu && (
            <div className="dropdown">
              <button onClick={handleDownloadPDF}>📥 Download PDF Report</button>
              <button onClick={() => { setSelDate(""); setShowMenu(false); }}>🔄 View All History</button>
              <button onClick={() => setShowMenu(false)}>📅 Monthly Analysis</button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="s-card">
          <small>Revenue</small>
          <b>{totalIncome.toLocaleString()}</b>
        </div>
        <div className="s-card">
          <small>Orders</small>
          <b>{totalOrders}</b>
        </div>
        <div className="s-card">
          <small>Customer</small>
          <b>{uniqueCustomers}</b>
        </div>
      </div>

      {/* Filter Area */}
      <div className="search-area">
        <input 
          className="search-input" 
          placeholder="Track Order ID or Name..." 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <input 
          type="date" 
          className="date-input" 
          value={selDate}
          onChange={(e) => setSelDate(e.target.value)}
        />
      </div>

      {/* Orders List */}
      <div style={{ marginTop: '5px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '20px' }}>Loading...</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="o-info">
                <b>{order.name || "Guest User"}</b>
                <small>ID: #{order.id?.slice(-6).toUpperCase()} • {order.time || order.date}</small>
              </div>
              <div className="o-price">
                <div>{Number(order.totalPrice || 0).toLocaleString()} Ks</div>
                <span>{order.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
          }
