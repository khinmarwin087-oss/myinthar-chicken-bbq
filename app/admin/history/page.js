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
      const allOrders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      // Status filter to only show completed/processed orders
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

  const handleCopy = (e, id) => {
    e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const getDateLabel = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "TODAY";
    if (dateStr === yesterday) return "YESTERDAY";
    return dateStr;
  };

  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const date = order.date || "Unknown Date";
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  if (selectedOrder) {
    return (
      <div className="voucher-overlay">
        <style jsx>{`
          .voucher-overlay { background: #000; min-height: 100vh; padding: 20px; color: #fff; font-family: 'Inter', sans-serif; }
          .v-card { background: #111; border: 1px solid #222; border-radius: 30px; padding: 30px 20px; max-width: 400px; margin: 0 auto; position: relative; }
          .v-header { text-align: center; margin-bottom: 30px; }
          .v-header h2 { font-weight: 900; letter-spacing: 2px; margin: 0; font-size: 22px; }
          .v-header p { color: #00F2EA; font-size: 10px; font-weight: 700; margin-top: 5px; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .info-item { background: #1a1a1a; padding: 12px; border-radius: 15px; border: 1px solid #222; }
          .info-item label { display: block; font-size: 9px; color: #666; font-weight: 800; margin-bottom: 4px; }
          .info-item span { font-size: 13px; font-weight: 600; color: #eee; }

          .pickup-box { grid-column: span 2; background: linear-gradient(90deg, #1a1a1a, #111); border-left: 4px solid #00F2EA; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
          
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .items-table th { text-align: left; font-size: 10px; color: #444; padding-bottom: 10px; border-bottom: 1px solid #222; }
          .items-table td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #1a1a1a; }

          .note-area { background: rgba(255, 212, 59, 0.05); padding: 12px; border-radius: 12px; color: #ffd43b; font-size: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 212, 59, 0.1); }
          
          .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 2px dashed #222; }
          .total-row span { font-weight: 800; color: #00F2EA; font-size: 22px; }

          .btn-group { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; width: 90%; max-width: 400px; }
          .btn { flex: 1; padding: 18px; border-radius: 20px; border: none; font-weight: 800; cursor: pointer; }
          .btn-back { background: #222; color: #fff; }
          .btn-print { background: #00F2EA; color: #000; }
        `}</style>

        <div className="v-card">
          <div className="v-header">
            <h2>YNS KITCHEN</h2>
            <p>ORDER SUMMARY</p>
          </div>

          <div className="info-grid">
            <div className="info-item"><label>CUSTOMER</label><span>{selectedOrder.customerName || "N/A"}</span></div>
            <div className="info-item"><label>PHONE</label><span>{selectedOrder.customerPhone || selectedOrder.phone || "-"}</span></div>
            <div className="info-item"><label>ORDER ID</label><span>#{selectedOrder.id?.slice(-6).toUpperCase()}</span></div>
            <div className="info-item"><label>ORDER TIME</label><span>{selectedOrder.time || "-"}</span></div>
            <div className="pickup-box">
              <div>
                <label style={{color: '#00F2EA'}}>PICK-UP SCHEDULE</label>
                <div style={{fontSize: '14px', fontWeight: 600, marginTop: '3px'}}>
                  {selectedOrder.pickupDate || selectedOrder.date} • {selectedOrder.pickupTime || "ASAP"}
                </div>
              </div>
              <i className="fas fa-clock" style={{color: '#00F2EA'}}></i>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr><th>NAME</th><th style={{textAlign:'center'}}>QTY</th><th style={{textAlign:'right'}}>PRICE</th></tr>
            </thead>
            <tbody>
              {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td style={{textAlign:'center'}}>{item.quantity || item.qty}</td>
                  <td style={{textAlign:'right', fontWeight: 700}}>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedOrder.note && (
            <div className="note-area">
              <strong>NOTE:</strong> {selectedOrder.note}
            </div>
          )}

          <div className="total-row">
            <span style={{color: '#666', fontSize: '14px'}}>TOTAL AMOUNT</span>
            <span>{Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks</span>
          </div>
        </div>

        <div className="btn-group">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>CLOSE</button>
          <button className="btn btn-print" onClick={() => window.print()}>PRINT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="root">
      <style jsx global>{`
        body { background: #000; color: #fff; font-family: 'Inter', sans-serif; margin: 0; }
        .h-header { background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #111; }
        .circle-btn { background: #111; border: 1px solid #222; color: #fff; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .circle-btn:active { transform: scale(0.9); background: #222; }
        
        .rev-card { background: linear-gradient(135deg, #111, #000); margin: 20px; padding: 25px; border-radius: 25px; border: 1px solid #222; display: flex; justify-content: space-between; align-items: flex-end; }
        .rev-amt { font-size: 30px; font-weight: 900; color: #00F2EA; letter-spacing: -1px; }
        
        .tracker-input { padding: 0 20px 15px; }
        .tracker-input input { width: 100%; background: #111; border: 1px solid #222; padding: 15px; border-radius: 15px; color: #fff; outline: none; box-sizing: border-box; }

        .group-label { padding: 10px 20px; font-size: 10px; font-weight: 800; color: #444; letter-spacing: 2px; }
        .order-card { background: #111; margin: 0 20px 10px; padding: 18px; border-radius: 20px; border: 1px solid #1a1a1a; display: flex; justify-content: space-between; align-items: center; }
        .status-tag { font-size: 9px; background: #222; padding: 3px 8px; border-radius: 6px; color: #8e9196; margin-top: 5px; display: inline-block; }
        
        .income { color: #00F2EA; font-weight: 800; font-size: 16px; }
        .copy-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #00F2EA; color: #000; padding: 12px 25px; border-radius: 50px; font-weight: 800; font-size: 12px; z-index: 2000; box-shadow: 0 10px 30px rgba(0,242,234,0.3); }
        
        .menu-pop { position: absolute; right: 20px; top: 70px; background: #111; border: 1px solid #222; border-radius: 18px; width: 170px; z-index: 500; overflow: hidden; }
        .menu-item { padding: 15px 20px; font-size: 13px; border-bottom: 1px solid #1a1a1a; cursor: pointer; display: flex; align-items: center; gap: 10px; }
        .menu-item:last-child { border: none; }
      `}</style>

      {copyStatus && <div className="copy-toast">ID COPIED</div>}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="h-header">
        <Link href="/admin" className="circle-btn"><i className="fas fa-chevron-left"></i></Link>
        <b style={{fontSize: '16px', letterSpacing: '1px'}}>HISTORY</b>
        <div style={{display: 'flex', gap: '8px'}}>
          <div className="circle-btn" style={{position: 'relative'}}><i className="fas fa-calendar"></i><input type="date" style={{position:'absolute', opacity:0, inset:0}} onChange={(e)=>setSelDate(e.target.value)}/></div>
          <div className="circle-btn" onClick={()=>setShowMenu(!showMenu)}><i className="fas fa-bars"></i></div>
        </div>
      </div>

      {showMenu && (
        <div className="menu-pop">
          <div className="menu-item" onClick={()=>{setShowTracker(!showTracker); setShowMenu(false)}}><i className="fas fa-search"></i> Tracker</div>
          <div className="menu-item" onClick={()=>{setSelDate(""); setSearchId(""); setShowMenu(false)}} style={{color: '#ff453a'}}><i className="fas fa-refresh"></i> Reset</div>
        </div>
      )}

      <div className="rev-card">
        <div><div style={{fontSize: '10px', color: '#666', fontWeight: 800}}>TOTAL REVENUE</div><div className="rev-amt">{totalIncome.toLocaleString()}</div></div>
        <div style={{textAlign: 'right'}}><div style={{fontSize: '10px', color: '#666', fontWeight: 800}}>ORDERS</div><div style={{fontSize: '24px', fontWeight: 900}}>{filteredOrders.length}</div></div>
      </div>

      {(showTracker || searchId) && (
        <div className="tracker-input">
          <input placeholder="Search ID or Customer Name..." value={searchId} onChange={(e)=>setSearchId(e.target.value)} />
        </div>
      )}

      <div style={{paddingBottom: '100px'}}>
        {Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div className="group-label">{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 800, fontSize: '15px'}}>{order.customerName || "No Name"}</div>
                  <div className="status-tag">ID: #{order.id?.slice(-5).toUpperCase()} • {order.time}</div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div className="income">+{Number(order.totalPrice || order.total).toLocaleString()}</div>
                  <div className="circle-btn" style={{width: '32px', height: '32px', fontSize: '12px'}} onClick={(e)=>handleCopy(e, order.id)}>
                    <i className="far fa-copy"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
            }
        
