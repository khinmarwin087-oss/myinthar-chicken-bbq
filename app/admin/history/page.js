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
        (o.id || "").toLowerCase().includes(searchId.toLowerCase()) ||
        (o.customerName || "").toLowerCase().includes(searchId.toLowerCase())
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

  if (selectedOrder) {
    return (
      <div className="modern-voucher-page">
        <style jsx>{`
          .modern-voucher-page { background: #0A0C10; min-height: 100vh; color: #fff; padding: 20px; font-family: sans-serif; }
          .v-header { text-align: center; margin-bottom: 25px; }
          .v-header h1 { font-size: 22px; margin: 0; letter-spacing: 1px; }
          .v-header p { font-size: 10px; color: #00F2EA; letter-spacing: 2px; margin-top: 5px; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-card { background: #161A22; padding: 12px; border-radius: 12px; border: 1px solid #1f2229; }
          .info-card label { display: block; font-size: 9px; color: #8e9196; margin-bottom: 4px; }
          .info-card span { font-size: 13px; font-weight: 600; }

          .items-section { background: #161A22; border-radius: 15px; padding: 15px; border: 1px solid #1f2229; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { text-align: left; font-size: 10px; color: #8e9196; padding-bottom: 8px; border-bottom: 1px solid #1f2229; }
          .items-table td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.02); }

          .total-box { margin-top: 20px; background: #fff; color: #000; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
          .v-actions { position: fixed; bottom: 20px; left: 20px; right: 20px; display: flex; gap: 10px; }
          .btn { flex: 1; padding: 15px; border-radius: 12px; border: none; font-weight: bold; cursor: pointer; }
          .btn-back { background: #2D323D; color: #fff; }
          .btn-print { background: #00F2EA; color: #000; }
        `}</style>

        <div className="v-header">
          <h1>YNS KITCHEN</h1>
          <p>OFFICIAL RECEIPT</p>
        </div>

        <div className="info-grid">
          <div className="info-card"><label>CUSTOMER</label><span>{selectedOrder.customerName || "Guest"}</span></div>
          <div className="info-card"><label>PHONE</label><span>{selectedOrder.customerPhone || selectedOrder.phone || "-"}</span></div>
          <div className="info-card"><label>ORDER ID</label><span>#{selectedOrder.id?.slice(-6).toUpperCase() || "N/A"}</span></div>
          <div className="info-card"><label>DATE</label><span>{selectedOrder.date}</span></div>
        </div>

        <div className="items-section">
          <table className="items-table">
            <thead><tr><th>ITEM</th><th style={{textAlign:'center'}}>QTY</th><th style={{textAlign:'right'}}>PRICE</th></tr></thead>
            <tbody>
              {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td style={{textAlign:'center'}}>{item.quantity || item.qty}</td>
                  <td style={{textAlign:'right'}}>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedOrder.note && <div style={{marginTop:10, fontSize:11, color:'#FFD43B'}}>Note: {selectedOrder.note}</div>}
        </div>

        <div className="total-box">
          <span style={{fontWeight:'bold'}}>TOTAL</span>
          <span style={{fontSize:18, fontWeight:900}}>{Number(selectedOrder.totalPrice || selectedOrder.total || 0).toLocaleString()} Ks</span>
        </div>

        <div className="v-actions">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>BACK</button>
          <button className="btn btn-print" onClick={() => window.print()}>PRINT / PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <style jsx global>{`
        body { background: #0A0C10; color: #fff; font-family: sans-serif; margin: 0; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 15px; position: sticky; top: 0; background: #0A0C10; border-bottom: 1px solid #1f2229; z-index: 100; }
        .btn-box { background: #161A22; border: 1px solid #2d323d; color: #fff; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; }
        .summary-card { background: #161A22; margin: 15px; padding: 15px; border-radius: 15px; border: 1px solid #2d323d; display: flex; justify-content: space-between; }
        .order-card { background: #161A22; margin: 0 15px 10px; padding: 15px; border-radius: 15px; border: 1px solid #1f2229; display: flex; justify-content: space-between; align-items: center; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="header">
        <Link href="/admin" className="btn-box"><i className="fas fa-chevron-left"></i></Link>
        <b style={{fontSize: '18px'}}>Order History</b>
        <div style={{display:'flex', gap:10}}>
            <div className="btn-box" style={{position:'relative'}}><i className="fas fa-calendar-alt"></i><input type="date" style={{position:'absolute', opacity:0, inset:0}} onChange={(e)=>setSelDate(e.target.value)} /></div>
            <div className="btn-box" onClick={()=>setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></div>
        </div>
      </div>

      {showMenu && (
        <div style={{position:'absolute', right:15, top:65, background:'#161A22', border:'1px solid #2d323d', borderRadius:10, overflow:'hidden', zIndex:200}}>
            <div style={{padding:'12px 20px', fontSize:14}} onClick={()=>{setShowTracker(!showTracker); setShowMenu(false)}}>Tracker</div>
            <div style={{padding:'12px 20px', fontSize:14, color:'red'}} onClick={()=>{setSelDate(""); setSearchId(""); setShowMenu(false)}}>Reset Filter</div>
        </div>
      )}

      <div className="summary-card">
        <div><small style={{color:'#8e9196'}}>REVENUE</small><div style={{fontSize:20, fontWeight:'bold'}}>{totalIncome.toLocaleString()} Ks</div></div>
        <div style={{textAlign:'right'}}><small style={{color:'#8e9196'}}>ORDERS</small><div style={{fontSize:20, fontWeight:'bold'}}>{filteredOrders.length}</div></div>
      </div>

      {(showTracker || searchId) && (
        <div style={{padding: '0 15px 15px'}}>
          <input 
            placeholder="Search by ID or Name..." 
            value={searchId}
            style={{width:'100%', padding:12, borderRadius:12, background:'#161A22', border:'1px solid #2d323d', color:'#fff', outline:'none'}}
            onChange={(e)=>setSearchId(e.target.value)}
          />
        </div>
      )}

      <div style={{paddingBottom: 50}}>
        {Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div style={{padding:'10px 15px', color:'#00F2EA', fontSize:10, fontWeight:900}}>{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                <div>
                  <div style={{fontSize:15, fontWeight:'bold'}}>{order.customerName || "Guest"}</div>
                  <small style={{color:'#8e9196'}}>#{order.id?.slice(-5).toUpperCase()} • {order.time}</small>
                </div>
                <div style={{fontWeight:'bold', color:'#00F2EA'}}>+{Number(order.totalPrice || order.total || 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
    }
    
