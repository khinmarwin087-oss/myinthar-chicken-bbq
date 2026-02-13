"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { db } from "../../../lib/firebase"; 
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDate, setSelDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showTracker, setShowTracker] = useState(false);

  // Firestore မှ Data ဖတ်ယူခြင်း
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Status စစ်ထုတ်ခြင်း
      const validOrders = allOrders.filter(o => 
        ['Cooking', 'Ready', 'Done', 'Success', 'completed'].includes(o.status)
      );
      
      setOrders(validOrders);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter Logic - Google Login Name များအတွက် field သုံးမျိုးလုံးကို စစ်ပေးထားသည်
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const customerName = (o.name || o.displayName || o.customerName || "").toLowerCase();
      const orderID = (o.orderId || o.id || "").toString().toLowerCase();
      const search = searchId.toLowerCase();

      const matchesDate = selDate ? o.date === selDate : true;
      const matchesSearch = searchId ? (
        orderID.includes(search) || customerName.includes(search)
      ) : true;
      
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || curr.total || 0), 0);

  const getDateLabel = (dateStr) => {
    if (!dateStr) return "Unknown";
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "TODAY";
    if (dateStr === yesterday) return "YESTERDAY";
    return dateStr;
  };

  const groupedOrders = useMemo(() => {
    return filteredOrders.reduce((groups, order) => {
      const date = order.date || "Unknown";
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
      return groups;
    }, {});
  }, [filteredOrders]);

  // Search Input
  const handleSearchChange = (e) => {
    setSearchId(e.target.value);
  };

  // Voucher View Section
  if (selectedOrder) {
    return (
      <div className="modern-voucher-page">
        <style jsx>{`
          .modern-voucher-page { 
            background: #0A0C10; 
            min-height: 100vh; 
            color: #fff; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          }
          .v-header { text-align: center; margin-bottom: 25px; }
          .v-header h1 { font-size: 24px; font-weight: 800; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-card { background: #161A22; padding: 12px; border-radius: 12px; border: 1px solid #1f2229; }
          .info-card label { display: block; font-size: 9px; color: #8e9196; margin-bottom: 4px; }
          .info-card span { font-size: 13px; font-weight: 600; display: block; overflow: hidden; text-overflow: ellipsis; }
          .items-section { background: #161A22; border-radius: 15px; padding: 15px; border: 1px solid #1f2229; margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { text-align: left; font-size: 10px; color: #8e9196; padding-bottom: 8px; border-bottom: 1px solid #1f2229; }
          .items-table td { padding: 12px 0; font-size: 13px; }
          .total-box { background: #fff; color: #000; padding: 18px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; }
          .v-actions { position: fixed; bottom: 20px; left: 20px; right: 20px; display: flex; gap: 10px; }
          .btn { flex: 1; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; transition: all 0.2s; }
          .btn-back { background: #2D323D; color: #fff; }
          .btn-back:hover { background: #3D4452; }
          .btn-print { background: #00F2EA; color: #000; }
          .btn-print:hover { background: #00D9D1; }
          @media print {
            .v-actions, body > *:not(.modern-voucher-page) { display: none !important; }
            .modern-voucher-page { padding: 0; }
          }
        `}</style>

        <div className="v-header">
          <h1>YNS KITCHEN</h1>
          <p style={{color: '#00F2EA', fontSize: 10}}>OFFICIAL RECEIPT</p>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <label>CUSTOMER</label>
            <span>{selectedOrder.name || selectedOrder.displayName || selectedOrder.customerName || "Customer"}</span>
          </div>
          <div className="info-card">
            <label>PHONE</label>
            <span>{selectedOrder.phone || selectedOrder.customerPhone || "-"}</span>
          </div>
          <div className="info-card">
            <label>ORDER ID</label>
            <span>#{selectedOrder.orderId || (selectedOrder.id ? selectedOrder.id.slice(-6).toUpperCase() : 'N/A')}</span>
          </div>
          <div className="info-card">
            <label>DATE</label>
            <span>{selectedOrder.date || 'N/A'}</span>
          </div>
        </div>

        <div className="items-section">
          <table className="items-table">
            <thead>
              <tr>
                <th>ITEM</th>
                <th style={{textAlign:'center'}}>QTY</th>
                <th style={{textAlign:'right'}}>PRICE</th>
              </tr>
            </thead>
            <tbody>
              {(selectedOrder.items || selectedOrder.cartItems || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.name || 'N/A'}</td>
                  <td style={{textAlign:'center'}}>{item.qty || item.quantity || 0}</td>
                  <td style={{textAlign:'right'}}>
                    {((Number(item.price || 0) * Number(item.qty || item.quantity || 1)) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="total-box">
          <span style={{fontWeight: 700}}>TOTAL AMOUNT</span>
          <span style={{fontSize: 20, fontWeight: 900}}>
            {Number(selectedOrder.totalPrice || selectedOrder.total || 0).toLocaleString()} Ks
          </span>
        </div>

        <div className="v-actions">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>BACK</button>
          <button className="btn btn-print" onClick={() => window.print()}>PRINT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <style jsx>{`
        .admin-root { 
          background: #0A0C10; 
          min-height: 100vh; 
          color: #fff; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        }
        body { margin: 0; background: #0A0C10; }
        .header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding: 15px; 
          position: sticky; 
          top: 0; 
          background: #0A0C10; 
          border-bottom: 1px solid #1f2229; 
          z-index: 100; 
        }
        .btn-box { 
          background: #161A22; 
          border: 1px solid #2d323d; 
          color: #fff; 
          width: 40px; 
          height: 40px; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          text-decoration: none; 
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-box:hover { background: #2D323D; }
        .summary-card { 
          background: #161A22; 
          margin: 15px; 
          padding: 20px; 
          border-radius: 15px; 
          border: 1px solid #2d323d; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
        }
        .order-card { 
          background: #161A22; 
          margin: 0 15px 10px; 
          padding: 15px; 
          border-radius: 15px; 
          border: 1px solid #1f2229; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          cursor: pointer;
          transition: all 0.2s;
        }
        .order-card:hover { 
          background: #1A1F28; 
          border-color: #00F2EA; 
        }
        .search-input { 
          position: fixed; 
          top: 70px; 
          left: 15px; 
          right: 15px; 
          background: #161A22; 
          border: 1px solid #2d323d; 
          border-radius: 10px; 
          padding: 12px 15px; 
          color: #fff; 
          font-size: 14px; 
          z-index: 99;
        }
        .date-section {
          padding: 10px 15px;
          color: #00F2EA;
          font-size: 11px;
          font-weight: 900;
          border-bottom: 1px solid #1f2229;
        }
        .no-orders {
          text-align: center;
          padding: 40px 20px;
          color: #8e9196;
        }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="header">
        <Link href="/admin" className="btn-box" title="Back">
          <i className="fas fa-chevron-left"></i>
        </Link>
        <b style={{fontSize: '16px'}}>Order History</b>
        <div style={{display:'flex', gap:'10px'}}>
          <label className="btn-box" style={{position:'relative'}} title="Filter by date">
            <i className="fas fa-calendar-alt"></i>
            <input 
              type="date" 
              style={{position:'absolute', opacity:0, inset:0, cursor:'pointer'}} 
              onChange={(e)=>setSelDate(e.target.value)}
              value={selDate}
            />
          </label>
          <div className="btn-box" onClick={()=>setShowMenu(!showMenu)} title="More options">
            <i className="fas fa-ellipsis-v"></i>
          </div>
        </div>
      </div>

      {searchId && (
        <input 
          type="text" 
          className="search-input"
          placeholder="Search Order ID or Customer Name..."
          value={searchId}
          onChange={handleSearchChange}
          autoFocus
        />
      )}

      <div className="summary-card">
        <div>
          <small style={{color:'#8e9196'}}>REVENUE</small>
          <div style={{fontSize:'22px', fontWeight:900, color:'#00F2EA'}}>
            {totalIncome.toLocaleString()} Ks
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <small style={{color:'#8e9196'}}>ORDERS</small>
          <div style={{fontSize:'22px', fontWeight:900}}>{filteredOrders.length}</div>
        </div>
      </div>

      <div style={{paddingBottom: '100px'}}>
        {loading ? (
          <div className="no-orders">Loading orders...</div>
        ) : Object.keys(groupedOrders).length === 0 ? (
          <div className="no-orders">
            {searchId ? 'No orders match your search.' : 'No orders found.'}
          </div>
        ) : (
          Object.keys(groupedOrders)
            .sort((a,b) => b.localeCompare(a))
            .map(date => (
              <div key={date}>
                <div className="date-section">{getDateLabel(date)}</div>
                {groupedOrders[date].map(order => (
                  <div 
                    key={order.id} 
                    className="order-card" 
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div>
                      <div style={{fontSize:'15px', fontWeight:'800'}}>
                        {order.name || order.displayName || order.customerName || "Customer"}
                      </div>
                      <small style={{color:'#8e9196'}}>
                        #{order.orderId || (order.id ? order.id.slice(-6).toUpperCase() : 'N/A')} 
                        {order.orderId ? '' : ` • ${order.id?.slice(-5).toUpperCase()}`}
                        {order.time ? ` • ${order.time}` : ''}
                      </small>
                    </div>
                    <div style={{fontWeight:900, color:'#00F2EA'}}>
                      +{Number(order.totalPrice || order.total || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>
    </div>
  );
                                            }
