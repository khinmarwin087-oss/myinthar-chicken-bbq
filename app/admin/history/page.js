"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
// Folder structure အရ လမ်းကြောင်းမှားနေရင် error တက်တတ်ပါတယ်။ 
// အကယ်၍ error ပြနေရင် ဒီနေရာမှာ import { db } from "@/lib/firebase"; လို့ ပြောင်းစမ်းကြည့်ပါ။
import { db } from "../../../lib/firebase"; 
import { collection, query, onSnapshot } from "firebase/firestore";

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
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // အောင်မြင်ပြီးသား အော်ဒါများသာ ယူမည်
      const validOrders = allOrders.filter(o => ['Cooking', 'Ready', 'Done', 'Success', 'completed'].includes(o.status));
      setOrders(validOrders);
      setFilteredOrders(validOrders);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter & Tracker Logic
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

  return (
    <div className="premium-admin">
      <style jsx global>{`
        :root { 
          --p-bg: #0F1115; 
          --p-card: #1C1F26; 
          --p-accent: #00F2EA; 
          --p-text: #FFFFFF; 
          --p-gray: #8E9196; 
        }
        * { box-sizing: border-box; }
        body { 
          background: var(--p-bg); 
          color: var(--p-text); 
          font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
          margin: 0; 
          overflow-x: hidden;
        }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; position: sticky; top: 0; background: rgba(15, 20, 25, 0.9); backdrop-filter: blur(12px); z-index: 100; border-bottom: 1px solid #2D323D; }
        .nav-icons { display: flex; gap: 12px; align-items: center; position: relative; }
        .icon-btn { background: var(--p-card); border: 1px solid #2D323D; color: white; width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .icon-btn:active { transform: scale(0.9); background: #2D323D; }
        
        .summary-section { padding: 20px; }
        .main-card { background: linear-gradient(145deg, #1C1F26, #111318); border-radius: 28px; padding: 25px; border: 1px solid #2D323D; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #2D323D; }
        
        .list-container { padding: 0 20px 120px; }
        .order-item { background: var(--p-card); border-radius: 22px; padding: 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; border: 1px solid #2D323D; transition: 0.3s; cursor: pointer; }
        .order-item:hover { border-color: var(--p-accent); }
        
        .more-menu { position: absolute; top: 55px; right: 0; background: #252932; border-radius: 18px; padding: 8px; width: 190px; box-shadow: 0 15px 40px rgba(0,0,0,0.6); border: 1px solid #363B46; z-index: 500; }
        .menu-item { padding: 12px 15px; font-size: 14px; display: flex; align-items: center; gap: 12px; color: #E0E0E0; border-radius: 12px; transition: 0.2s; }
        .menu-item:active { background: #363B46; color: var(--p-accent); }

        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .voucher-card { background: #FFFFFF; color: #1a1a1a; width: 100%; max-width: 360px; border-radius: 25px; padding: 30px; font-family: 'Courier New', monospace; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .btn-download { background: #000; color: #fff; border: none; width: 100%; padding: 16px; border-radius: 15px; font-weight: 800; margin-top: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .loader { width: 30px; height: 30px; border: 3px solid #2D323D; border-top: 3px solid var(--p-accent); border-radius: 50%; animation: spin 1s linear infinite; }
      `}</style>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: '#0F1115', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader"></div>
        </div>
      )}

      {/* Header */}
      <div className="header">
        <Link href="/admin" className="icon-btn"><i className="fas fa-chevron-left"></i></Link>
        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>History</h2>
        <div className="nav-icons">
          <div className="icon-btn" style={{ position: 'relative' }}>
            <i className="fas fa-calendar-alt"></i>
            <input type="date" style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', cursor: 'pointer' }} onChange={(e) => setSelDate(e.target.value)} />
          </div>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></button>
          
          {showMenu && (
            <div className="more-menu">
              <div className="menu-item" onClick={() => {setShowTracker(true); setShowMenu(false);}}><i className="fas fa-search"></i> Order Tracker</div>
              <div className="menu-item"><i className="fas fa-file-export"></i> Export Data</div>
              <div className="menu-item"><i className="fas fa-chart-pie"></i> Analytics</div>
              <div className="menu-item" style={{ color: '#FF453A' }} onClick={() => {setSelDate(""); setShowMenu(false);}}><i className="fas fa-redo"></i> Reset View</div>
            </div>
          )}
        </div>
      </div>

      {/* Tracker Search Bar */}
      {showTracker && (
        <div style={{ padding: '15px 20px' }}>
          <div style={{ background: '#1C1F26', padding: '14px 18px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #2D323D' }}>
            <i className="fas fa-search" style={{ color: '#8E9196' }}></i>
            <input 
              placeholder="Track Order ID..." 
              style={{ background: 'none', border: 'none', color: 'white', flex: 1, outline: 'none', fontSize: '15px' }}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <i className="fas fa-times" style={{ color: '#8E9196' }} onClick={() => {setShowTracker(false); setSearchId("");}}></i>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="summary-section">
        <div className="main-card">
          <p style={{ color: '#8E9196', fontSize: '12px', marginBottom: '10px', fontWeight: 600 }}>REVENUE SUMMARY</p>
          <h1 style={{ fontSize: '36px', margin: 0, color: 'white', fontWeight: 800 }}>{totalIncome.toLocaleString()} <span style={{ fontSize: '18px', color: '#00F2EA' }}>Ks</span></h1>
          
          <div className="stats-grid">
            <div>
              <p style={{ color: '#8E9196', fontSize: '11px', margin: '0 0 6px' }}>TOTAL ORDERS</p>
              <h3 style={{ margin: 0, fontSize: '20px' }}>{filteredOrders.length}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#8E9196', fontSize: '11px', margin: '0 0 6px' }}>AVG PER ORDER</p>
              <h3 style={{ margin: 0, fontSize: '20px' }}>{(totalIncome / (filteredOrders.length || 1)).toFixed(0).toLocaleString()} Ks</h3>
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="list-container">
        <p style={{ fontSize: '11px', fontWeight: 800, color: '#8E9196', marginBottom: '18px', letterSpacing: '1.5px' }}>TRANSACTION LOGS</p>
        {filteredOrders.length > 0 ? filteredOrders.map(order => (
          <div key={order.id} className="order-item" onClick={() => setSelectedOrder(order)}>
            <div className="icon-btn" style={{ background: '#252932', border: 'none', width: '48px', height: '48px', flexShrink: 0 }}>
              <i className="fas fa-receipt" style={{ color: '#00F2EA' }}></i>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customerName}</b>
              <span style={{ fontSize: '11px', color: '#8E9196' }}>ID: #{(order.orderId || order.id).toString().slice(0, 8)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: '#00F2EA', fontSize: '15px' }}>+{Number(order.totalPrice || order.total || 0).toLocaleString()}</div>
              <div style={{ fontSize: '10px', color: '#8E9196', marginTop: '4px' }}>{order.time}</div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#8E9196' }}>No records found.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="modal" onClick={() => setSelectedOrder(null)}>
          <div className="voucher-card" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #eee', paddingBottom: '20px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 5px', letterSpacing: '2px' }}>YNS KITCHEN</h2>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>OFFICIAL RECEIPT</p>
            </div>
            
            <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Customer:</span> <b>{selectedOrder.customerName}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Phone:</span> <b>{selectedOrder.customerPhone || selectedOrder.phone}</b></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date:</span> <b>{selectedOrder.date} | {selectedOrder.time}</b></div>
              <div style={{ margin: '15px 0', borderTop: '1px solid #f0f0f0' }}></div>
              
              {(selectedOrder.cartItems || selectedOrder.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>{item.name} x{item.quantity || item.qty}</span>
                  <span>{(Number(item.price) * Number(item.quantity || item.qty)).toLocaleString()}</span>
                </div>
              ))}
              
              <div style={{ margin: '15px 0', borderTop: '2px dashed #000', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900 }}>
                  <span>TOTAL:</span>
                  <span>{Number(selectedOrder.totalPrice || selectedOrder.total || 0).toLocaleString()} Ks</span>
                </div>
              </div>
            </div>

            <button className="btn-download" onClick={() => alert('Voucher Generating...')}>
              <i className="fas fa-cloud-download-alt"></i> SAVE VOUCHER
            </button>
            <p onClick={() => setSelectedOrder(null)} style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#999', cursor: 'pointer' }}>Back to History</p>
          </div>
        </div>
      )}
    </div>
  );
}
