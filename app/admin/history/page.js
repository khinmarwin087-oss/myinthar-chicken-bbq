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
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const validOrders = allOrders.filter(o => ['Cooking', 'Ready', 'Done', 'Success', 'completed'].includes(o.status));
      setOrders(validOrders);
      setFilteredOrders(validOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = orders;
    if (selDate) result = result.filter(o => o.date === selDate);
    if (searchId) result = result.filter(o => (o.orderId || o.id).toLowerCase().includes(searchId.toLowerCase()));
    setFilteredOrders(result);
  }, [selDate, searchId, orders]);

  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || curr.total || 0), 0);

  return (
    <div className="premium-admin">
      <style jsx global>{`
        :root { --p-bg: #0F1115; --p-card: #1C1F26; --p-accent: #00F2EA; --p-text: #FFFFFF; --p-gray: #8E9196; }
        body { background: var(--p-bg); color: var(--p-text); font-family: 'Inter', sans-serif; margin: 0; }
        
        .header { display: flex; align-items: center; justify-content: space-between; padding: 20px; position: sticky; top: 0; background: rgba(15, 17, 21, 0.8); backdrop-filter: blur(10px); z-index: 100; }
        .nav-icons { display: flex; gap: 15px; align-items: center; position: relative; }
        .icon-btn { background: var(--p-card); border: 1px solid #2D323D; color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .summary-section { padding: 0 20px; margin-bottom: 30px; }
        .main-card { background: linear-gradient(145deg, #1C1F26, #13151A); border-radius: 30px; padding: 25px; border: 1px solid #2D323D; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #2D323D; }
        
        .list-container { padding: 0 20px 100px; }
        .order-item { background: var(--p-card); border-radius: 20px; padding: 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; border: 1px solid transparent; transition: 0.3s; cursor: pointer; }
        .order-item:active { border-color: var(--p-accent); transform: scale(0.98); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--p-accent); box-shadow: 0 0 10px var(--p-accent); }
        
        /* Dropdown Menu */
        .more-menu { position: absolute; top: 50px; right: 0; background: #252932; border-radius: 15px; padding: 10px; width: 180px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #363B46; }
        .menu-item { padding: 12px; font-size: 13px; display: flex; align-items: center; gap: 10px; color: #E0E0E0; text-decoration: none; border-radius: 10px; }
        .menu-item:hover { background: #2D323D; }

        /* Modal Details */
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .voucher-card { background: #FFFFFF; color: #000; width: 100%; max-width: 350px; border-radius: 20px; padding: 25px; font-family: 'Courier New', Courier, monospace; }
        .btn-download { background: var(--p-accent); color: black; border: none; width: 100%; padding: 15px; border-radius: 12px; font-weight: 800; margin-top: 15px; }
      `}</style>

      {/* Header */}
      <div className="header">
        <Link href="/admin" className="icon-btn"><i className="fas fa-chevron-left"></i></Link>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Order History</h2>
        <div className="nav-icons">
          <div className="icon-btn" style={{ position: 'relative' }}>
            <i className="fas fa-calendar-alt"></i>
            <input type="date" style={{ position: 'absolute', opacity: 0, inset: 0 }} onChange={(e) => setSelDate(e.target.value)} />
          </div>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><i className="fas fa-ellipsis-v"></i></button>
          
          {showMenu && (
            <div className="more-menu">
              <div className="menu-item" onClick={() => {setShowTracker(true); setShowMenu(false);}}><i className="fas fa-search"></i> Order Tracker</div>
              <div className="menu-item"><i className="fas fa-file-excel"></i> Export Excel</div>
              <div className="menu-item"><i className="fas fa-chart-line"></i> Analytics</div>
              <div className="menu-item" style={{ color: '#FF453A' }} onClick={() => setSelDate("")}><i className="fas fa-redo"></i> Reset View</div>
            </div>
          )}
        </div>
      </div>

      {/* Tracker Search Bar (Toggleable) */}
      {showTracker && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ background: '#252932', padding: '12px 15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-search" style={{ color: var(--p-gray) }}></i>
            <input 
              placeholder="Track by Order ID..." 
              style={{ background: 'none', border: 'none', color: 'white', flex: 1, outline: 'none' }}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <i className="fas fa-times" onClick={() => {setShowTracker(false); setSearchId("");}}></i>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="summary-section">
        <div className="main-card">
          <p style={{ color: '#8E9196', fontSize: '12px', marginBottom: '8px' }}>TOTAL REVENUE</p>
          <h1 style={{ fontSize: '32px', margin: 0, color: 'white' }}>{totalIncome.toLocaleString()} <span style={{ fontSize: '16px', color: var(--p-accent) }}>Ks</span></h1>
          
          <div className="stats-grid">
            <div>
              <p style={{ color: '#8E9196', fontSize: '10px', margin: '0 0 5px' }}>COMPLETED</p>
              <h3 style={{ margin: 0 }}>{filteredOrders.length}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#8E9196', fontSize: '10px', margin: '0 0 5px' }}>AVG VALUE</p>
              <h3 style={{ margin: 0 }}>{(totalIncome / (filteredOrders.length || 1)).toFixed(0).toLocaleString()} Ks</h3>
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="list-container">
        <p style={{ fontSize: '12px', fontWeight: 800, color: '#8E9196', marginBottom: '15px', letterSpacing: '1px' }}>RECENT ORDERS</p>
        {filteredOrders.map(order => (
          <div key={order.id} className="order-item" onClick={() => setSelectedOrder(order)}>
            <div style={{ position: 'relative' }}>
              <div className="icon-btn" style={{ background: '#252932', width: '50px', height: '50px' }}><i className="fas fa-shopping-bag" style={{ color: var(--p-accent) }}></i></div>
              <div className="status-dot" style={{ position: 'absolute', bottom: 5, right: 5 }}></div>
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ display: 'block', fontSize: '15px' }}>{order.customerName}</b>
              <span style={{ fontSize: '11px', color: '#8E9196' }}>ID: #{(order.orderId || order.id).toString().slice(0, 8)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, color: var(--p-accent) }}>+{Number(order.totalPrice || order.total).toLocaleString()}</div>
              <div style={{ fontSize: '10px', color: '#8E9196' }}>{order.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail & Voucher Modal */}
      {selectedOrder && (
        <div className="modal" onClick={() => setSelectedOrder(null)}>
          <div className="voucher-card" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '15px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>YNS KITCHEN</h2>
              <p style={{ fontSize: '10px' }}>Order Receipt</p>
            </div>
            
            <div style={{ fontSize: '12px' }}>
              <p><b>Name:</b> {selectedOrder.customerName}</p>
              <p><b>Phone:</b> {selectedOrder.customerPhone || selectedOrder.phone}</p>
              <p><b>Date:</b> {selectedOrder.date} | {selectedOrder.time}</p>
              <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
              { (selectedOrder.cartItems || selectedOrder.items).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
                  <span>{item.name} x {item.quantity || item.qty}</span>
                  <span>{(item.price * (item.quantity || item.qty)).toLocaleString()}</span>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '15px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                <span>TOTAL:</span>
                <span>{Number(selectedOrder.totalPrice || selectedOrder.total).toLocaleString()} Ks</span>
              </div>
            </div>

            <button className="btn-download" onClick={() => alert('Downloading Voucher PDF...')}>
              <i className="fas fa-download"></i> DOWNLOAD VOUCHER
            </button>
            <button onClick={() => setSelectedOrder(null)} style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'none', border: 'none', fontSize: '12px', color: '#888' }}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
        }
        
