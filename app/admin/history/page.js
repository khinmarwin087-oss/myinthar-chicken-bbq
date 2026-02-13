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

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = (o.name || o.displayName || o.customerName || "").toLowerCase();
      const orderID = (o.id || o.orderId || "").toString().toLowerCase();
      const search = searchId.toLowerCase();
      const matchesDate = selDate ? o.date === selDate : true;
      const matchesSearch = searchId ? (orderID.includes(search) || name.includes(search)) : true;
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

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

  if (selectedOrder) {
    return (
      <div className="modern-voucher-page">
        <style jsx>{`
          .modern-voucher-page { background: #0A0C10; min-height: 100vh; color: #fff; padding: 20px; font-family: sans-serif; }
          .v-header { text-align: center; margin-bottom: 25px; }
          .v-header h1 { font-size: 24px; font-weight: 800; margin: 0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-card { background: #161A22; padding: 12px; border-radius: 12px; border: 1px solid #1f2229; }
          .items-section { background: #161A22; border-radius: 15px; padding: 15px; border: 1px solid #1f2229; margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table td { padding: 12px 0; font-size: 13px; }
          .total-box { background: #fff; color: #000; padding: 18px; border-radius: 15px; display: flex; justify-content: space-between; }
          .v-actions { position: fixed; bottom: 20px; left: 20px; right: 20px; display: flex; gap: 10px; }
          .btn { flex: 1; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
          .btn-back { background: #2D323D; color: #fff; }
          .btn-print { background: #00F2EA; color: #000; }
          @media print { .v-actions, .btn-box { display: none !important; } .modern-voucher-page { background: white; color: black; } }
        `}</style>

        <div className="v-header">
          <h1>YNS KITCHEN</h1>
          <p style={{color: '#00F2EA', fontSize: 10}}>OFFICIAL RECEIPT</p>
        </div>

        <div className="info-grid">
          <div className="info-card"><span>{selectedOrder.name || selectedOrder.displayName || selectedOrder.customerName || "Customer"}</span></div>
          <div className="info-card"><span>#{selectedOrder.id?.slice(-6).toUpperCase()}</span></div>
        </div>

        <div className="items-section">
          <table className="items-table">
            <tbody>
              {(selectedOrder.items || selectedOrder.cartItems || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.name} x {item.qty || item.quantity}</td>
                  <td style={{textAlign:'right'}}>{(Number(item.price || 0) * Number(item.qty || item.quantity || 1)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="total-box">
          <b>TOTAL</b>
          <b>{Number(selectedOrder.totalPrice || selectedOrder.total || 0).toLocaleString()} Ks</b>
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
        .admin-root { background: #0A0C10; min-height: 100vh; color: #fff; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 15px; background: #0A0C10; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #1f2229; }
        .btn-box { background: #161A22; border: 1px solid #2d323d; color: #fff; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; }
        .summary-card { background: #161A22; margin: 15px; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; border: 1px solid #2d323d; }
        .order-card { background: #161A22; margin: 0 15px 10px; padding: 15px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #1f2229; }
      `}</style>
      
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="header">
        <Link href="/admin" className="btn-box"><i className="fas fa-chevron-left"></i></Link>
        <b>Order History</b>
        <div style={{display:'flex', gap:10}}>
          <div className="btn-box" style={{position:'relative'}}><i className="fas fa-calendar-alt"></i><input type="date" style={{position:'absolute', opacity:0, inset:0}} onChange={(e)=>setSelDate(e.target.value)} /></div>
          <div className="btn-box" onClick={()=>setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></div>
        </div>
      </div>

      <div className="summary-card">
        <div><small>REVENUE</small><div>{totalIncome.toLocaleString()} Ks</div></div>
        <div style={{textAlign:'right'}}><small>ORDERS</small><div>{filteredOrders.length}</div></div>
      </div>

      <div style={{paddingBottom: 80}}>
        {Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div style={{padding:'10px 15px', color:'#00F2EA', fontSize:11, fontWeight:900}}>{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                <div>
                  <div style={{fontSize:15, fontWeight:'800'}}>{order.name || order.displayName || order.customerName || "Guest"}</div>
                  <small style={{color:'#8e9196'}}>#{order.id?.slice(-5).toUpperCase()}</small>
                </div>
                <div style={{fontWeight:900, color:'#00F2EA'}}>+{Number(order.totalPrice || order.total || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
          }
          
