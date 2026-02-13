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

  // ၁။ Firebase မှ အော်ဒါမှတ်တမ်းများ ဖတ်ယူခြင်း
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("orderDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // အောင်မြင်ပြီးသား Status ရှိသည့် အော်ဒါများကိုသာ ပြမည်
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

  // ၂။ Filter Logic (Search ID သို့မဟုတ် နာမည်ဖြင့် ရှာဖွေခြင်း)
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

  // ၃။ စုစုပေါင်း ဝင်ငွေတွက်ချက်ခြင်း
  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || curr.total || 0), 0);

  // ၄။ ရက်စွဲအလိုက် အုပ်စုခွဲခြင်း
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const date = order.date || "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  const getDateLabel = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return "TODAY";
    if (dateStr === yesterday) return "YESTERDAY";
    return dateStr;
  };

  // ၅။ Voucher View (အော်ဒါတစ်ခုကို နှိပ်လိုက်သည့်အခါ ပြမည့် UI)
  if (selectedOrder) {
    return (
      <div className="modern-voucher-page">
        <style jsx>{`
          .modern-voucher-page { background: #0A0C10; min-height: 100vh; color: #fff; padding: 20px; font-family: sans-serif; }
          .v-header { text-align: center; margin-bottom: 25px; border-bottom: 1px dashed #2d323d; padding-bottom: 20px; }
          .v-header h1 { font-size: 28px; font-weight: 800; margin: 0; color: #00F2EA; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .info-card { background: #161A22; padding: 12px; border-radius: 12px; border: 1px solid #1f2229; font-size: 13px; }
          .items-section { background: #161A22; border-radius: 15px; padding: 15px; border: 1px solid #1f2229; margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table td { padding: 12px 0; font-size: 14px; border-bottom: 1px solid #1f2229; }
          .total-box { background: #00F2EA; color: #000; padding: 18px; border-radius: 15px; display: flex; justify-content: space-between; font-weight: 800; font-size: 18px; }
          .v-actions { position: fixed; bottom: 20px; left: 20px; right: 20px; display: flex; gap: 10px; }
          .btn { flex: 1; padding: 16px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; transition: 0.2s; }
          .btn-back { background: #2D323D; color: #fff; }
          .btn-print { background: #fff; color: #000; }
          @media print { 
            .v-actions { display: none !important; } 
            .modern-voucher-page { background: white !important; color: black !important; }
            .info-card, .items-section { background: white !important; border: 1px solid #eee !important; color: black !important; }
            .v-header h1 { color: black !important; }
          }
        `}</style>

        <div className="v-header">
          <h1>YNS KITCHEN</h1>
          <p style={{color: '#8e9196', fontSize: 11, marginTop: 5}}>OFFICIAL RECEIPT</p>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <small style={{color: '#8e9196'}}>CUSTOMER</small><br/>
            <b>{selectedOrder.name || selectedOrder.customerName}</b>
          </div>
          <div className="info-card">
            <small style={{color: '#8e9196'}}>ORDER ID</small><br/>
            <b>#{selectedOrder.orderId || selectedOrder.id?.slice(-6).toUpperCase()}</b>
          </div>
          <div className="info-card">
            <small style={{color: '#8e9196'}}>DATE</small><br/>
            <b>{selectedOrder.date}</b>
          </div>
          <div className="info-card">
            <small style={{color: '#8e9196'}}>TIME</small><br/>
            <b>{selectedOrder.time || 'N/A'}</b>
          </div>
        </div>

        <div className="items-section">
          <table className="items-table">
            <tbody>
              {(selectedOrder.items || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.name} <span style={{color: '#8e9196'}}>x{item.qty}</span></td>
                  <td style={{textAlign:'right'}}>{(Number(item.price) * item.qty).toLocaleString()} Ks</td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedOrder.note && (
            <div style={{marginTop: 15, fontSize: 12, color: '#00F2EA'}}>
              Note: {selectedOrder.note}
            </div>
          )}
        </div>

        <div className="total-box">
          <span>TOTAL</span>
          <span>{Number(selectedOrder.totalPrice || 0).toLocaleString()} Ks</span>
        </div>

        <div className="v-actions">
          <button className="btn btn-back" onClick={() => setSelectedOrder(null)}>BACK</button>
          <button className="btn btn-print" onClick={() => window.print()}><i className="fas fa-print"></i> PRINT</button>
        </div>
      </div>
    );
  }

  // ၆။ Main History List View
  return (
    <div className="admin-root">
      <style jsx>{`
        .admin-root { background: #0A0C10; min-height: 100vh; color: #fff; font-family: sans-serif; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 20px; background: #0A0C10; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid #1f2229; }
        .btn-box { background: #161A22; border: 1px solid #2d323d; color: #fff; width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .summary-card { background: linear-gradient(135deg, #161A22, #0A0C10); margin: 20px; padding: 25px; border-radius: 20px; display: flex; justify-content: space-between; border: 1px solid #2d323d; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .order-card { background: #161A22; margin: 0 20px 12px; padding: 18px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #1f2229; }
        .search-box { margin: 0 20px 20px; position: relative; }
        .search-box input { width: 100%; padding: 14px 14px 14px 45px; border-radius: 12px; border: 1px solid #2d323d; background: #161A22; color: #fff; box-sizing: border-box; }
        .date-label { padding: 10px 20px; color: #00F2EA; font-size: 12px; font-weight: 900; letter-spacing: 1px; }
      `}</style>
      
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

      <div className="header">
        <Link href="/admin" className="btn-box"><i className="fas fa-chevron-left"></i></Link>
        <b style={{fontSize: 18}}>Order History</b>
        <div style={{position:'relative'}}>
          <div className="btn-box"><i className="fas fa-calendar-alt"></i></div>
          <input type="date" style={{position:'absolute', opacity:0, inset:0, cursor:'pointer'}} onChange={(e)=>setSelDate(e.target.value)} />
        </div>
      </div>

      <div className="summary-card">
        <div><small style={{color: '#8e9196'}}>TOTAL REVENUE</small><div style={{fontSize: 24, fontWeight: 900, color: '#00F2EA'}}>{totalIncome.toLocaleString()} Ks</div></div>
        <div style={{textAlign:'right'}}><small style={{color: '#8e9196'}}>ORDERS</small><div style={{fontSize: 24, fontWeight: 900}}>{filteredOrders.length}</div></div>
      </div>

      <div className="search-box">
        <i className="fas fa-search" style={{position:'absolute', left: 18, top: 16, color: '#4a4d54'}}></i>
        <input type="text" placeholder="Search by name or ID..." value={searchId} onChange={(e)=>setSearchId(e.target.value)} />
      </div>

      <div style={{paddingBottom: 100}}>
        {loading ? (
           <div style={{textAlign:'center', padding: 50, color: '#8e9196'}}>Loading records...</div>
        ) : (
          Object.keys(groupedOrders).length === 0 ? (
            <div style={{textAlign:'center', padding: 50, color: '#4a4d54'}}>No records found</div>
          ) : (
            Object.keys(groupedOrders).map(date => (
              <div key={date}>
                <div className="date-label">{getDateLabel(date)}</div>
                {groupedOrders[date].map(order => (
                  <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
                    <div>
                      <div style={{fontSize: 16, fontWeight: '700'}}>{order.name || order.customerName}</div>
                      <small style={{color: '#8e9196'}}>#{order.orderId || order.id?.slice(-5).toUpperCase()} • {order.time || 'N/A'}</small>
                    </div>
                    <div style={{textAlign: 'right'}}>
                       <div style={{fontWeight: 900, color: '#00F2EA', fontSize: 16}}>+{Number(order.totalPrice || 0).toLocaleString()}</div>
                       <small style={{fontSize: 10, color: '#4caf50', textTransform: 'uppercase'}}>{order.status}</small>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
    }
                                                                                             
