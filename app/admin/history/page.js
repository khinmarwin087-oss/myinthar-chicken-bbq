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
      // အချိန်အလိုက် အရင်စီမယ်
      allOrders.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
      
      // မှတ်ချက် - List မပေါ်ပါက status စစ်တာကို ခဏပိတ်ထားပါသည်
      setOrders(allOrders); 
      setLoading(false);
    }, (err) => {
      console.error("Firebase Error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = (o.name || o.customerName || o.displayName || "").toLowerCase();
      const orderID = (o.id || "").toLowerCase();
      const search = searchId.toLowerCase();
      
      const matchesDate = selDate ? o.date === selDate : true;
      const matchesSearch = searchId ? (orderID.includes(search) || name.includes(search)) : true;
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

  // Summary Logic
  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || 0), 0);
  const totalOrders = filteredOrders.length;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.phone || o.name || o.customerName)).size;

  return (
    <div className="history-root">
      <style jsx>{`
        .history-root { background: #FBFBFC; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .nav-bar { background: #FFF; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F0F0F0; position: sticky; top: 0; z-index: 50; }
        .nav-back { border: none; background: none; font-size: 20px; color: #444; padding: 5px; cursor: pointer; }
        .nav-title { font-size: 15px; font-weight: 600; color: #222; }
        
        .summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 15px; }
        .card { background: #FFF; padding: 12px 8px; border-radius: 12px; border: 1px solid #EEF0F2; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .card span { display: block; font-size: 9px; color: #8E8E93; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .card b { font-size: 13px; color: #1C1C1E; font-weight: 700; }

        .filter-row { padding: 0 15px 15px; display: flex; gap: 8px; }
        .search-field { flex: 1.5; background: #FFF; border: 1px solid #E5E5EA; border-radius: 10px; padding: 8px 12px; font-size: 12px; outline: none; transition: 0.2s; }
        .search-field:focus { border-color: #007AFF; }
        .date-field { flex: 1; background: #FFF; border: 1px solid #E5E5EA; border-radius: 10px; padding: 8px; font-size: 11px; color: #333; }

        .list-container { padding: 0 15px 40px; }
        .order-card { background: #FFF; border: 1px solid #F0F0F2; border-radius: 14px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .order-main b { display: block; font-size: 13px; color: #222; margin-bottom: 2px; }
        .order-main small { font-size: 10px; color: #8E8E93; }
        .order-side { text-align: right; }
        .order-side .price { font-size: 13px; font-weight: 700; color: #1C1C1E; margin-bottom: 3px; }
        .status-pill { font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: #F2F2F7; color: #8E8E93; text-transform: uppercase; }
        .status-success { background: #E8F8F0; color: #27AE60; }

        .menu-pop { position: absolute; right: 16px; top: 50px; background: #FFF; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); border: 1px solid #F0F0F0; width: 170px; overflow: hidden; z-index: 60; }
        .menu-item { width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; font-size: 12px; color: #333; display: flex; align-items: center; gap: 10px; }
        .menu-item:active { background: #F9F9F9; }
        
        @media print {
          .nav-bar, .summary-row, .filter-row, .menu-pop { display: none !important; }
          .history-root { background: #FFF; }
          .list-container { padding: 0; }
          .order-card { border: none; border-bottom: 1px solid #EEE; border-radius: 0; }
        }
      `}</style>

      {/* Navigation */}
      <div className="nav-bar">
        <button className="nav-back" onClick={() => router.back()}>✕</button>
        <span className="nav-title">Order History</span>
        <div style={{ position: 'relative' }}>
          <button className="nav-back" onClick={() => setShowMenu(!showMenu)}>⋮</button>
          {showMenu && (
            <div className="menu-pop">
              <button className="menu-item" onClick={() => { window.print(); setShowMenu(false); }}>📄 Download PDF Report</button>
              <button className="menu-item" onClick={() => { setSelDate(""); setSearchId(""); setShowMenu(false); }}>🔄 View All History</button>
              <button className="menu-item" onClick={() => setShowMenu(false)}>📅 Monthly Analysis</button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-row">
        <div className="card">
          <span>Revenue</span>
          <b>{totalIncome.toLocaleString()}</b>
        </div>
        <div className="card">
          <span>Orders</span>
          <b>{totalOrders}</b>
        </div>
        <div className="card">
          <span>Customer</span>
          <b>{uniqueCustomers}</b>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <input 
          className="search-field" 
          placeholder="Search by ID or Name..." 
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <input 
          type="date" 
          className="date-field" 
          value={selDate}
          onChange={(e) => setSelDate(e.target.value)}
        />
      </div>

      {/* Order List */}
      <div className="list-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}>Loading records...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '12px' }}>No orders found</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-main">
                <b>{order.name || order.customerName || "Customer"}</b>
                <small>ID: #{order.id?.slice(-6).toUpperCase()} • {order.time || order.date}</small>
              </div>
              <div className="order-side">
                <div className="price">{Number(order.totalPrice || 0).toLocaleString()} Ks</div>
                <span className={`status-pill ${['Success', 'Done', 'completed'].includes(order.status) ? 'status-success' : ''}`}>
                  {order.status || 'Pending'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
                             }
