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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        let cleanDate = data.orderDate ? data.orderDate.split('T')[0] : (data.date || "");
        return { id: doc.id, ...data, displayDate: cleanDate };
      });
      const historyItems = allOrders.filter(o => ['Ready', 'Success', 'Done', 'completed'].includes(o.status));
      historyItems.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
      setOrders(historyItems);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = (o.name || "").toLowerCase();
      const orderID = (o.orderId || o.id || "").toLowerCase();
      const matchesDate = selDate ? o.displayDate === selDate : true;
      const matchesSearch = searchId ? (orderID.includes(searchId.toLowerCase()) || name.includes(searchId.toLowerCase())) : true;
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || 0), 0);

  // လအလိုက် Report ထုတ်ရန် (ယခုလ နှင့် ပြီးခဲ့သောလ)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      const value = d.toISOString().slice(0, 7); // YYYY-MM
      options.push({ label, value });
    }
    return options;
  };

  const handleMonthlyPDF = (monthVal) => {
    const monthlyData = orders.filter(o => o.displayDate.startsWith(monthVal));
    console.log("Downloading PDF for:", monthVal, monthlyData);
    setShowDownloadModal(false);
    window.print();
  };

  if (selectedOrder) {
    return (
      <div className="full-page">
        <style jsx>{`
          .full-page { background: #FFF; min-height: 100vh; font-family: sans-serif; }
          .top-nav { padding: 15px; display: flex; align-items: center; border-bottom: 1px solid #F0F0F0; }
          .back-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
          .content { padding: 20px; }
          .voucher { border: 1px solid #EEE; border-radius: 15px; padding: 20px; margin-top: 15px; }
          .v-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .v-total { border-top: 1px dashed #DDD; padding-top: 10px; font-weight: bold; font-size: 18px; display: flex; justify-content: space-between; }
        `}</style>
        <div className="top-nav">
          <button className="back-btn" onClick={() => setSelectedOrder(null)}>←</button>
          <b style={{marginLeft: '15px'}}>Order Details</b>
        </div>
        <div className="content">
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
             <b>#{selectedOrder.orderId || selectedOrder.id.slice(-6).toUpperCase()}</b>
             <span style={{color:'#27AE60', fontWeight:'bold'}}>{selectedOrder.status}</span>
          </div>
          <div style={{fontSize:'14px', lineHeight:'2'}}>
            <div>Customer: {selectedOrder.name}</div>
            <div>Phone: {selectedOrder.phone}</div>
            <div>Date: {selectedOrder.displayDate}</div>
          </div>
          <div className="voucher">
            {selectedOrder.items?.map((item, i) => (
              <div key={i} className="v-item"><span>{item.name} x{item.qty}</span><span>{(item.price * item.qty).toLocaleString()} Ks</span></div>
            ))}
            <div className="v-total"><span>Total</span><span>{Number(selectedOrder.totalPrice).toLocaleString()} Ks</span></div>
          </div>
          <button onClick={() => window.print()} style={{width:'100%', padding:'15px', background:'#000', color:'#FFF', borderRadius:'12px', marginTop:'20px', fontWeight:'bold', border:'none'}}>PRINT PDF</button>
        </div>
      </div>
    );
  }

  return (
    <div className="root">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style jsx>{`
        .root { background: #FBFBFC; min-height: 100vh; font-family: sans-serif; padding-bottom: 30px; }
        .nav { background: #FFF; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F0F0F0; position: sticky; top: 0; z-index: 50; }
        .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 15px; }
        .s-card { background: #FFF; padding: 12px 5px; border-radius: 12px; border: 1px solid #EEF0F2; text-align: center; }
        .s-card small { display: block; font-size: 9px; color: #888; margin-bottom: 4px; }
        .s-card b { font-size: 12px; }
        
        .filter-box { padding: 0 15px 15px; display: flex; gap: 10px; align-items: center; }
        .search-container { position: relative; flex: 1; }
        .search-input { width: 100%; padding: 10px 35px 10px 12px; border-radius: 10px; border: 1px solid #E5E5EA; font-size: 12px; outline: none; background: #FFF; box-sizing: border-box; }
        .clear-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #CCC; cursor: pointer; border: none; background: none; }
        
        .calendar-box { position: relative; width: 40px; height: 40px; background: #FFF; border: 1px solid #E5E5EA; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .date-picker { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
        
        .order-card { background: #FFF; margin: 0 15px 10px; padding: 15px; border-radius: 15px; border: 1px solid #F0F0F2; display: flex; justify-content: space-between; align-items: center; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justifyContent: center; z-index: 1000; padding: 20px; }
        .modal { background: #FFF; width: 100%; max-width: 300px; border-radius: 20px; padding: 20px; text-align: center; }
        .m-btn { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #EEE; background: #F9F9F9; margin-bottom: 10px; font-weight: bold; cursor: pointer; }
      `}</style>

      <div className="nav">
        <button style={{background:'none', border:'none', fontSize:'22px'}} onClick={() => router.back()}>←</button>
        <b style={{fontSize:'14px'}}>Order History</b>
        <button style={{background:'none', border:'none', fontSize:'20px'}} onClick={() => setShowMenu(!showMenu)}>⋮</button>
        {showMenu && (
          <div style={{position:'absolute', right:15, top:50, background:'#FFF', borderRadius:10, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', width:150, zIndex:100, border:'1px solid #F0F0F0'}}>
            <button style={{width:'100%', padding:12, border:'none', background:'none', textAlign:'left', fontSize:12}} onClick={() => { setShowDownloadModal(true); setShowMenu(false); }}>📥 Download Report</button>
            <button style={{width:'100%', padding:12, border:'none', background:'none', textAlign:'left', fontSize:12}} onClick={() => { setSelDate(""); setSearchId(""); setShowMenu(false); }}>🔄 View All</button>
          </div>
        )}
      </div>

      <div className="summary">
        <div className="s-card"><small>REVENUE</small><b>{totalIncome.toLocaleString()}</b></div>
        <div className="s-card"><small>ORDERS</small><b>{filteredOrders.length}</b></div>
        <div className="s-card"><small>CUSTOMER</small><b>{new Set(filteredOrders.map(o => o.phone)).size}</b></div>
      </div>

      <div className="filter-box">
        <div className="search-container">
          <input className="search-input" placeholder="Track Order ID or Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          {searchId && <button className="clear-btn" onClick={() => setSearchId("")}>✕</button>}
        </div>
        <div className="calendar-box">
          <i className="fa-regular fa-calendar-days" style={{color:'#555'}}></i>
          <input type="date" className="date-picker" value={selDate} onChange={(e) => setSelDate(e.target.value)} />
        </div>
      </div>

      <div className="list">
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
            <div>
              <b style={{fontSize:'13px'}}>{order.name}</b>
              <div style={{fontSize:'10px', color:'#999'}}>#{order.orderId || order.id.slice(-5)} • {order.displayDate}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:'bold', fontSize:'13px'}}>{Number(order.totalPrice).toLocaleString()} Ks</div>
              <div style={{fontSize:'9px', color:'#27AE60', fontWeight:'bold'}}>{order.status}</div>
            </div>
          </div>
        ))}
      </div>

      {showDownloadModal && (
        <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h4 style={{marginTop:0}}>Download History</h4>
            <p style={{fontSize:'12px', color:'#666'}}>ဘယ်လစာရင်းကို ဒေါင်းလုဒ်လုပ်မလဲ?</p>
            {getMonthOptions().map((opt, i) => (
              <button key={i} className="m-btn" onClick={() => handleMonthlyPDF(opt.value)}>{opt.label}</button>
            ))}
            <button onClick={() => setShowDownloadModal(false)} style={{color:'red', border:'none', background:'none', marginTop:10}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
          }
            
