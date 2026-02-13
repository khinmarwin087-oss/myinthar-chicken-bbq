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
      
      // Status စစ်ထုတ်ခြင်း (Database ထဲရှိ status နှင့် ကိုက်ညီရမည်)
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

  // Filter Logic - Database ထဲရှိ 'name' field ကို အသုံးပြုထားသည်
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesDate = selDate ? o.date === selDate : true;
      const matchesSearch = searchId ? (
        (o.id || "").toLowerCase().includes(searchId.toLowerCase()) ||
        (o.name || "").toLowerCase().includes(searchId.toLowerCase()) ||
        (o.orderId || "").toString().toLowerCase().includes(searchId.toLowerCase())
      ) : true;
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

  // အော်ဒါအသေးစိတ် Voucher View
  if (selectedOrder) {
    return (
      <div className="modern-voucher-page">
        <style jsx>{`
          .modern-voucher-page { background: #0A0C10; min-height: 100vh; color: #fff; padding: 20px; font-family: sans-serif; }
          .v-header { text-align: center; margin-bottom: 25px; }
          .v-header h1 { font-size: 22px; margin: 0; letter-spacing: 1px; font-weight: 800; }
          .v-header p { font-size: 10px; color: #00F2EA; letter-spacing: 2px; margin-top: 5px; font-weight: 700; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-card { background: #161A22; padding: 12px; border-radius: 12px; border: 1px solid #1f2229; }
          .info-card label { display: block; font-size: 9px; color: #8e9196; margin-bottom: 4px; font-weight: 600; }
          .info-card span { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }

          .items-section { background: #161A22; border-radius: 15px; padding: 15px; border: 1px solid #1f2229; margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { text-align: left; font-size: 10px; color: #8e9196; padding-bottom: 8px; border-bottom: 1px solid #1f2229; }
          .items-table td { padding: 12px 0; font-size: 13px; border-bottom: 1px solid rgba(255,255,255,0.02); }

          .total-box { background: #fff; color: #000; padding: 18px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; }
          .v-actions { position: fixed; bottom: 20px; left: 20px; right: 20px; display: flex; gap: 10px; }
          .btn { flex: 1; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
          .btn-back { background: #2D323D; color: #fff; }
          .btn-print { background: #00F2EA; color: #000; box-shadow: 0 4px 15px rgba(0,242,234,0.3); }
          @media print { .v-actions { display: none; } .modern-voucher-page { background: #fff; color: #000; } }
        `}</style>

        <div className="v-header">
          <h1>YNS KITCHEN</h1>
          <p>OFFICIAL RECEIPT</p>
        </div>

        <div className="info-grid">
          <div className="info-card"><label>CUSTOMER</label><span>{selectedOrder.name || "Customer"}</span></div>
          <div className="info-card"><label>PHONE</label><span>{selectedOrder.phone || "-"}</span></div>
          <div className="info-card"><label>ORDER ID</label><span>#{selectedOrder.orderId || selectedOrder.id?.slice(-6).toUpperCase()}</span></div>
          <div className="info-card"><label>DATE</label><span>{selectedOrder.date}</span></div>
        </div>

        <div className="items-section">
          <table className="items-table">
            <thead><tr><th>ITEM</th><th style={{textAlign:'center'}}>QTY</th><th style={{textAlign:'right'}}>PRICE</th></tr></thead>
            <tbody>
              {(selectedOrder.items || selectedOrder.cartItems || []).map((item, i) => (
                <tr key={i}>
                  <td style={{fontWeight: 500}}>{item.name}</td>
                  <td style={{textAlign:'center'}}>{item.qty || item.quantity}</td>
                  <td style={{textAlign:'right', fontWeight: 700}}>{(Number(item.price) * Number(item.qty || item.quantity)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedOrder.note && <div style={{marginTop: 15, fontSize: 12, color: '#FFD43B', padding: '10px', background: 'rgba(255,212,59,0.05)', borderRadius: '8px', borderLeft: '3px solid #FFD43B'}}>Note: {selectedOrder.note}</div>}
        </div>

        <div className="total-box">
          <span style={{fontWeight: 700, color: '#666'}}>TOTAL AMOUNT</span>
          <span style={{fontSize: 20, fontWeight: 900}}>{Number(selectedOrder.totalPrice || selectedOrder.total || 0).toLocaleString()} Ks</span>
        </div>

        <div className="v-actions">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>CLOSE</button>
          <button className="btn btn-print" onClick={() => window.print()}><i className="fas fa-print"></i> PRINT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <style jsx global>{`
        body { background: #0A0C10; color: #fff; font-family: 'Inter', sans-serif; margin: 0; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; position: sticky; top: 0; background: rgba(10, 12, 16, 0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #1f2229; z-index: 100; }
        .btn-box { background: #161A22; border: 1px solid #2d323d; color: #fff; width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; text-decoration: none; cursor: pointer; transition: 0.2s; }
        .summary-card { background: linear-gradient(135deg, #161A22 0%, #0A0C10 100%); margin: 20px; padding: 20px; border-radius: 20px; border: 1px solid #2d323d; display: flex; justify-content: space-between; }
        .order-card { background: #161A22; margin: 0 20px 12px; padding: 16px; border-radius: 18px; border: 1px solid #1f2229; display: flex; justify-content: space-between; align-items: center; }
        .search-input { width: 100%; padding: 14px; border-radius: 12px; background: #161A22; border: 1px solid #2d323d; color: #fff; outline: none; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="header">
        <Link href="/admin" className="btn-box"><i className="fas fa-arrow-left"></i></Link>
        <b style={{fontSize: '18px'}}>Order History</b>
        <div style={{display:'flex', gap:10}}>
            <div className="btn-box" style={{position:'relative'}}><i className="fas fa-calendar-day"></i><input type="date" style={{position:'absolute', opacity:0, inset:0}} onChange={(e)=>setSelDate(e.target.value)} /></div>
            <div className="btn-box" onClick={()=>setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></div>
        </div>
      </div>

      {showMenu && (
        <div style={{position:'absolute', right:20, top:70, background:'#1c1f26', border:'1px solid #2d323d', borderRadius:12, zIndex:200, boxShadow: '0 10px 25px rgba(0,0,0,0.5)'}}>
            <div style={{padding:'14px 20px', fontSize:14, borderBottom: '1px solid #2d323d'}} onClick={()=>{setShowTracker(!showTracker); setShowMenu(false)}}>Tracker</div>
            <div style={{padding:'14px 20px', fontSize:14, color:'#ff453a'}} onClick={()=>{setSelDate(""); setSearchId(""); setShowMenu(false)}}>Reset All</div>
        </div>
      )}

      <div className="summary-card">
        <div><small style={{color:'#8e9196', fontWeight: 700}}>TOTAL REVENUE</small><div style={{fontSize:24, fontWeight:900}}>{totalIncome.toLocaleString()} Ks</div></div>
        <div style={{textAlign:'right'}}><small style={{color:'#8e9196', fontWeight: 700}}>ORDERS</small><div style={{fontSize:24, fontWeight:900}}>{filteredOrders.length}</div></div>
      </div>

      {(showTracker || searchId) && (
        <div style={{padding: '0 20px 20px'}}>
          <input 
            placeholder="Search Order ID or Name..." 
            value={searchId}
            className="search-input"
            onChange={(e)=>setSearchId(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div style={{textAlign: 'center', marginTop: 50, color: '#8e9196'}}>Loading...</div>
      ) : (
        <div style={{paddingBottom: 80}}>
          {Object.keys(groupedOrders).map(date => (
            <div key={date}>
              <div style={{padding:'10px 20px', color:'#00F2EA', fontSize:11, fontWeight:900}}>{getDateLabel(date)}</div>
              {groupedOrders[date].map(order => (
                <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                  <div>
                    <div style={{fontSize:15, fontWeight:'800', marginBottom: 4}}>{order.name || "Customer"}</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <span style={{fontSize:10, color:'#8e9196', background: '#222', padding: '2px 6px', borderRadius: 4}}>#{order.orderId || order.id?.slice(0, 5).toUpperCase()}</span>
                      <small style={{color:'#555'}}>• {order.time}</small>
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontWeight:900, color:'#00F2EA', fontSize: 16}}>+{Number(order.totalPrice || order.total || 0).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
                             }
            
