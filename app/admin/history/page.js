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
      // Status Filter
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
        (o.id).toLowerCase().includes(searchId.toLowerCase()) ||
        (o.customerName || "").toLowerCase().includes(searchId.toLowerCase())
      );
    }
    setFilteredOrders(result);
  }, [selDate, searchId, orders]);

  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || curr.total || 0), 0);

  const handleCopy = (e, id) => {
    e.stopPropagation(); // Card Click မဖြစ်အောင် တားတာ
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
    const date = order.date || "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  // --- VOUCHER COMPONENT ---
  if (selectedOrder) {
    return (
      <div className="voucher-container">
        <style jsx>{`
          .voucher-container { background: #0A0C10; min-height: 100vh; padding: 20px; font-family: 'Inter', sans-serif; color: #fff; }
          .v-card { background: #161A22; border-radius: 24px; padding: 25px; border: 1px solid #2d323d; max-width: 450px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
          .v-header { text-align: center; margin-bottom: 25px; }
          .v-header h2 { font-size: 24px; margin: 0; letter-spacing: 1px; }
          .v-header p { color: #00F2EA; font-size: 11px; margin-top: 5px; font-weight: 700; letter-spacing: 2px; }
          
          .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .info-box { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
          .info-box label { display: block; font-size: 9px; color: #8e9196; margin-bottom: 4px; font-weight: 600; }
          .info-box span { font-size: 13px; font-weight: 600; }

          .pickup-bar { grid-column: span 2; background: rgba(0, 242, 234, 0.08); border: 1px solid rgba(0, 242, 234, 0.2); padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
          
          .item-list { margin: 20px 0; width: 100%; border-collapse: collapse; }
          .item-list th { text-align: left; font-size: 10px; color: #8e9196; padding-bottom: 10px; border-bottom: 1px solid #2d323d; }
          .item-list td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.02); }

          .note-box { background: rgba(255, 212, 59, 0.05); border-left: 3px solid #fcc419; padding: 10px; border-radius: 8px; font-size: 12px; color: #fcc419; margin-top: 10px; }
          
          .total-section { margin-top: 25px; padding-top: 15px; border-top: 2px dashed #2d323d; display: flex; justify-content: space-between; align-items: center; }
          .total-label { font-weight: 700; color: #8e9196; }
          .total-amount { font-size: 24px; font-weight: 900; color: #fff; }

          .actions { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 12px; width: 90%; max-width: 400px; }
          .abtn { flex: 1; padding: 16px; border-radius: 16px; border: none; font-weight: 800; cursor: pointer; transition: 0.2s; }
          .back-btn { background: #2d323d; color: #fff; }
          .print-btn { background: #00F2EA; color: #000; box-shadow: 0 10px 20px rgba(0,242,234,0.2); }
        `}</style>

        <div className="v-card">
          <div className="v-header">
            <h2>YNS KITCHEN</h2>
            <p>PREMIUM GUEST CHECK</p>
          </div>

          <div className="grid-info">
            <div className="info-box"><label>CUSTOMER</label><span>{selectedOrder.customerName || "Unknown"}</span></div>
            <div className="info-box"><label>PHONE</label><span>{selectedOrder.customerPhone || selectedOrder.phone || "-"}</span></div>
            <div className="info-box"><label>ORDER ID</label><span>#{selectedOrder.id.slice(-6).toUpperCase()}</span></div>
            <div className="info-box"><label>SYSTEM TIME</label><span>{selectedOrder.time || "-"}</span></div>
            <div className="pickup-bar">
              <div><label style={{color: '#00F2EA', fontSize: '9px'}}>PICK-UP SCHEDULE</label>
              <span style={{fontSize: '14px'}}>{selectedOrder.pickupDate || selectedOrder.date} | {selectedOrder.pickupTime || "ASAP"}</span></div>
              <i className="fas fa-calendar-check" style={{color: '#00F2EA'}}></i>
            </div>
          </div>

          <table className="item-list">
            <thead><tr><th>ITEM</th><th style={{textAlign:'center'}}>QTY</th><th style={{textAlign:'right'}}>PRICE</th></tr></thead>
            <tbody>
              {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
                <tr key={i}>
                  <td style={{fontWeight: 500}}>{item.name}</td>
                  <td style={{textAlign:'center'}}>{item.quantity || item.qty}</td>
                  <td style={{textAlign:'right', fontWeight: 700}}>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedOrder.note && <div className="note-box"><strong>NOTE:</strong> {selectedOrder.note}</div>}

          <div className="total-section">
            <span className="total-label">TOTAL AMOUNT</span>
            <span className="total-amount">{Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} <small style={{fontSize:'12px'}}>Ks</small></span>
          </div>
        </div>

        <div className="actions">
          <button className="abtn back-btn" onClick={() => setSelectedOrder(null)}>BACK</button>
          <button className="abtn print-btn" onClick={() => window.print()}>PRINT RECEIPT</button>
        </div>
      </div>
    );
  }

  // --- HISTORY LIST VIEW ---
  return (
    <div className="history-root">
      <style jsx global>{`
        body { background: #0A0C10; color: #fff; font-family: 'Inter', sans-serif; margin: 0; }
        .h-header { position: sticky; top: 0; background: rgba(10, 12, 16, 0.8); backdrop-filter: blur(15px); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2229; z-index: 100; }
        .h-btn { background: #161A22; border: 1px solid #2d323d; color: #fff; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; }
        
        .summary { background: linear-gradient(135deg, #161A22 0%, #0A0C10 100%); margin: 20px; padding: 20px; border-radius: 20px; border: 1px solid #2d323d; display: flex; justify-content: space-between; }
        .rev-label { color: #8e9196; font-size: 11px; font-weight: 700; margin-bottom: 5px; }
        .rev-amt { font-size: 26px; font-weight: 900; }
        
        .search-area { padding: 0 20px 15px; }
        .search-box { background: #161A22; border: 1px solid #2d323d; border-radius: 12px; padding: 12px 15px; display: flex; align-items: center; }
        .search-box input { background: none; border: none; color: #fff; outline: none; margin-left: 10px; width: 100%; }

        .date-title { padding: 10px 20px; color: #00F2EA; font-size: 11px; font-weight: 900; letter-spacing: 1px; }
        .card { background: #161A22; margin: 0 20px 12px; padding: 16px; border-radius: 18px; border: 1px solid #1f2229; display: flex; justify-content: space-between; align-items: center; transition: 0.2s; }
        .card:active { transform: scale(0.98); background: #1c212b; }
        
        .copy-toast { position: fixed; top: 100px; left: 50%; transform: translateX(-50%); background: #00F2EA; color: #000; padding: 10px 25px; border-radius: 30px; font-weight: 800; font-size: 12px; z-index: 2000; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
        
        .dropdown { position: absolute; right: 20px; top: 65px; background: #1c1f26; border: 1px solid #2d323d; border-radius: 16px; width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 500; overflow: hidden; }
        .drop-item { padding: 14px 18px; font-size: 13px; display: flex; align-items: center; gap: 12px; cursor: pointer; border-bottom: 1px solid #2d323d; }
        .drop-item:last-child { border: none; }
        .drop-item:active { background: #2d323d; }
      `}</style>

      {copyStatus && <div className="copy-toast">Order ID Copied!</div>}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="h-header">
        <Link href="/admin" className="h-btn"><i className="fas fa-arrow-left"></i></Link>
        <b style={{fontSize: '18px'}}>Order History</b>
        <div style={{display: 'flex', gap: '10px'}}>
          <div className="h-btn" style={{position: 'relative'}}>
            <i className="fas fa-calendar-day"></i>
            <input type="date" style={{position: 'absolute', opacity: 0, inset: 0}} onChange={(e) => setSelDate(e.target.value)} />
          </div>
          <div className="h-btn" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></div>
        </div>
      </div>

      {showMenu && (
        <div className="dropdown">
          <div className="drop-item" onClick={() => {setShowTracker(!showTracker); setShowMenu(false);}}><i className="fas fa-search"></i> Tracker</div>
          <div className="drop-item" onClick={() => {window.location.reload()}}><i className="fas fa-sync"></i> Refresh</div>
          <div className="drop-item" style={{color: '#ff453a'}} onClick={() => {setSelDate(""); setShowMenu(false);}}><i className="fas fa-trash-alt"></i> Clear Filter</div>
        </div>
      )}

      <div className="summary">
        <div><div className="rev-label">TOTAL REVENUE</div><div className="rev-amt">{totalIncome.toLocaleString()} <small style={{fontSize:'14px'}}>Ks</small></div></div>
        <div style={{textAlign: 'right'}}><div className="rev-label">ORDERS</div><div className="rev-amt">{filteredOrders.length}</div></div>
      </div>

      {(showTracker || searchId) && (
        <div className="search-area">
          <div className="search-box">
            <i className="fas fa-search" style={{color: '#444'}}></i>
            <input placeholder="Search Order ID or Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          </div>
        </div>
      )}

      <div style={{paddingBottom: '100px'}}>
        {Object.keys(groupedOrders).map(date => (
          <div key={date}>
            <div className="date-title">{getDateLabel(date)}</div>
            {groupedOrders[date].map(order => (
              <div key={order.id} className="card" onClick={() => setSelectedOrder(order)}>
                <div style={{flex: 1}}>
                  <div style={{fontSize: '15px', fontWeight: '800', marginBottom: '4px'}}>{order.customerName || "Customer"}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{fontSize: '10px', color: '#8e9196', background: '#222', padding: '2px 6px', borderRadius: '4px'}}>#{order.id.slice(-5).toUpperCase()}</span>
                    <span style={{fontSize: '10px', color: '#555'}}>• {order.time || order.date}</span>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{color: '#00F2EA', fontWeight: '900', fontSize: '15px'}}>+{Number(order.totalPrice || order.total).toLocaleString()}</div>
                  <div className="h-btn" style={{width: '32px', height: '32px', fontSize: '12px'}} onClick={(e) => handleCopy(e, order.id)}>
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

    
