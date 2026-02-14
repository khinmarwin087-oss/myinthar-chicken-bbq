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
        // Date formatting for filter
        let cleanDate = data.orderDate ? data.orderDate.split('T')[0] : (data.date || "");
        return { id: doc.id, ...data, displayDate: cleanDate };
      });
      // သမိုင်းထဲမှာ ပြဖို့ Status တွေကို သတ်မှတ်ခြင်း
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

  // PDF Report Generating Logic (Fixed)
  const handleMonthlyPDF = (monthVal) => {
    const monthlyData = orders.filter(o => o.displayDate.startsWith(monthVal));
    
    if (monthlyData.length === 0) {
      alert("ရွေးချယ်ထားသော လအတွက် အချက်အလက်မရှိပါ!");
      return;
    }

    const printWindow = window.open('', '_blank');
    let tableRows = monthlyData.map(o => `
      <tr style="border-bottom: 1px solid #eee; font-size: 12px;">
        <td style="padding: 10px;">${o.displayDate}<br><small>#${o.orderId || o.id.slice(-5)}</small></td>
        <td style="padding: 10px;"><b>${o.name}</b><br>${o.phone}</td>
        <td style="padding: 10px;">${o.items?.map(i => `${i.name} x${i.qty}`).join(', ') || 'No Items'}</td>
        <td style="padding: 10px; text-align: right;">${Number(o.totalPrice).toLocaleString()} Ks</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html><head><title>Monthly Report - ${monthVal}</title></head>
      <body style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="text-align: center; margin-bottom: 5px;">Sales Report</h2>
        <p style="text-align: center; margin-top: 0; color: #666;">Month: ${monthVal}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead style="background: #f8f9fa;">
            <tr>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Date/ID</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Customer</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Items</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div style="text-align: right; margin-top: 30px; border-top: 2px solid #333; padding-top: 10px;">
          <h3 style="margin: 0;">Grand Total: ${monthlyData.reduce((s,o) => s+Number(o.totalPrice),0).toLocaleString()} Ks</h3>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
    setShowDownloadModal(false);
  };

  // --- Order Details Full Page View ---
  if (selectedOrder) {
    return (
      <div className="full-page">
        <style jsx>{`
          .full-page { background: #F4F7FE; min-height: 100vh; font-family: sans-serif; color: #1A1C1E; }
          .top-nav { padding: 15px 20px; display: flex; align-items: center; background: #FFF; position: sticky; top: 0; z-index: 10; }
          .back-btn { background: #F0F2F5; border: none; width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
          .container { padding: 20px; max-width: 600px; margin: 0 auto; }
          .card { background: #FFF; border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 15px; }
          .label { font-size: 11px; color: #8E8E93; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block; }
          .value { font-size: 14px; font-weight: 700; color: #2C2C2E; margin-bottom: 15px; }
          .voucher { background: #FFF; border-radius: 20px; padding: 20px; border: 1px solid #E5E5EA; position: relative; }
          .voucher:before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: #007AFF; border-radius: 20px 20px 0 0; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .total-row { border-top: 1px dashed #C7C7CC; padding-top: 15px; margin-top: 10px; display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; }
          .note-card { background: #FFF9E6; padding: 15px; border-radius: 12px; border-left: 4px solid #FFCC00; font-size: 13px; margin-top: 15px; }
        `}</style>
        
        <div className="top-nav">
          <button className="back-btn" onClick={() => setSelectedOrder(null)}>←</button>
          <b style={{marginLeft: '15px'}}>Invoice Details</b>
        </div>

        <div className="container">
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: 20}}>
              <div><span className="label">Order ID</span><div className="value">#${selectedOrder.orderId || selectedOrder.id.slice(-6).toUpperCase()}</div></div>
              <div style={{textAlign:'right'}}><span className="label">Status</span><div style={{color:'#27AE60', fontWeight:'bold'}}>${selectedOrder.status}</div></div>
            </div>

            <span className="label">Customer Details</span>
            <div className="value" style={{marginBottom:5}}>${selectedOrder.name}</div>
            <div className="value" style={{color:'#007AFF'}}>${selectedOrder.phone}</div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', marginTop: 15}}>
              <div><span className="label">Pick-up Date</span><div className="value">${selectedOrder.date || "Not set"}</div></div>
              <div><span className="label">Pick-up Time</span><div className="value">${selectedOrder.time || "Not set"}</div></div>
            </div>

            <span className="label">Order Placed At (System)</span>
            <div className="value">${new Date(selectedOrder.orderDate).toLocaleString() || "N/A"}</div>
          </div>

          <div className="voucher">
            <span className="label" style={{marginBottom:15}}>Items Summary</span>
            {selectedOrder.items?.map((item, i) => (
              <div key={i} className="item-row">
                <span>${item.name} <small style={{color:'#8E8E93'}}>x${item.qty}</small></span>
                <span>${(item.price * item.qty).toLocaleString()} Ks</span>
              </div>
            ))}
            <div className="total-row">
              <span>Grand Total</span>
              <span>${Number(selectedOrder.totalPrice).toLocaleString()} Ks</span>
            </div>
          </div>

          {selectedOrder.note && (
            <div className="note-card">
              <span className="label" style={{color:'#856404'}}>Customer Note:</span>
              <p style={{margin: '5px 0 0'}}>${selectedOrder.note}</p>
            </div>
          )}

          <button onClick={() => window.print()} style={{width:'100%', padding:'18px', background:'#1C1C1E', color:'#FFF', borderRadius:'15px', marginTop:'25px', fontWeight:'bold', border:'none', fontSize:'15px'}}>Print Invoice</button>
        </div>
      </div>
    );
  }

  return (
    <div className="root">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style jsx>{`
        .root { background: #F8F9FA; min-height: 100vh; font-family: sans-serif; padding-bottom: 40px; }
        .nav { background: #FFF; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 5px rgba(0,0,0,0.02); }
        .icon-btn { background: #F2F2F7; border: none; width: 38px; height: 38px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .summary-row { display: flex; gap: 10px; padding: 20px; }
        .s-box { background: #FFF; flex: 1; padding: 15px 10px; border-radius: 16px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .s-box span { font-size: 9px; color: #8E8E93; display: block; font-weight: 700; margin-bottom: 4px; }
        .s-box b { font-size: 14px; color: #1C1C1E; }
        
        .filter-row { padding: 0 20px 15px; display: flex; gap: 10px; }
        .search-wrap { flex: 1; position: relative; }
        .search-wrap input { width: 100%; padding: 12px 15px; border-radius: 12px; border: 1px solid #E5E5EA; outline: none; font-size: 13px; box-sizing: border-box; }
        .clear-x { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #C7C7CC; border: none; background: none; font-size: 16px; }
        
        .order-card { background: #FFF; margin: 0 20px 10px; padding: 15px; border-radius: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: center; cursor: pointer; border: 1px solid transparent; }
        .order-info { flex: 1; min-width: 0; padding-right: 10px; }
        .cust-name { display: block; font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
        .order-meta { font-size: 11px; color: #8E8E93; }
        
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: flex-end; z-index: 1000; }
        .modal-content { background: #FFF; width: 100%; border-radius: 25px 25px 0 0; padding: 25px 20px; }
        .month-btn { width: 100%; padding: 15px; border-radius: 15px; border: 1px solid #F2F2F7; background: #F9F9F9; margin-bottom: 10px; font-weight: 700; cursor: pointer; }
      `}</style>

      <div className="nav">
        <button className="icon-btn" onClick={() => router.back()}>←</button>
        <b style={{fontSize: '16px'}}>Orders History</b>
        <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><i className="fa-solid fa-ellipsis-v"></i></button>
        {showMenu && (
          <div style={{position:'absolute', right:20, top:60, background:'#FFF', borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,0.1)', width:180, zIndex:100, border:'1px solid #f0f0f0', overflow:'hidden'}}>
            <button style={{width:'100%', padding:15, border:'none', background:'none', textAlign:'left', fontSize:13, fontWeight:600}} onClick={() => { setShowDownloadModal(true); setShowMenu(false); }}>📥 Monthly Report</button>
            <button style={{width:'100%', padding:15, border:'none', background:'none', textAlign:'left', fontSize:13, fontWeight:600}} onClick={() => { setSelDate(""); setSearchId(""); setShowMenu(false); }}>🔄 Clear All</button>
          </div>
        )}
      </div>

      <div className="summary-row">
        <div className="s-box"><span>REVENUE</span><b>${totalIncome.toLocaleString()}</b></div>
        <div className="s-box"><span>ORDERS</span><b>${filteredOrders.length}</b></div>
        <div className="s-box"><span>CUSTOMERS</span><b>${new Set(filteredOrders.map(o => o.phone)).size}</b></div>
      </div>

      <div className="filter-row">
        <div className="search-wrap">
          <input placeholder="Search Name or ID..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          {searchId && <button className="clear-x" onClick={() => setSearchId("")}>✕</button>}
        </div>
        <div style={{position:'relative', width: 45, height: 45, background:'#FFF', borderRadius:12, border:'1px solid #E5E5EA', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <i className="fa-solid fa-calendar-days" style={{color:'#8E8E93'}}></i>
          <input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} style={{position:'absolute', opacity:0, width:'100%', height:'100%', cursor:'pointer'}} />
        </div>
      </div>

      <div>
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card" onClick={() => setSelectedOrder(order)}>
            <div className="order-info">
              <span className="cust-name">${order.name}</span>
              <div className="order-meta">#${order.orderId || order.id.slice(-5)} • ${order.displayDate}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: 800, fontSize: 14}}>${Number(order.totalPrice).toLocaleString()} Ks</div>
              <div style={{fontSize: 9, color: '#27AE60', fontWeight: 800, marginTop: 4}}>${order.status.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>

      {showDownloadModal && (
        <div className="modal" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop:0, textAlign:'center'}}>Export Report</h3>
            <p style={{textAlign:'center', fontSize:13, color:'#8E8E93', marginBottom:20}}>အသေးစိတ်စာရင်းထုတ်ယူမည့်လကို ရွေးပါ</p>
            {(() => {
              const opts = [];
              const now = new Date();
              for(let i=0; i<2; i++) {
                const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
                opts.push({ label: d.toLocaleString('default', { month: 'long', year: 'numeric' }), value: d.toISOString().slice(0, 7) });
              }
              return opts.map((opt, i) => (
                <button key={i} className="month-btn" onClick={() => handleMonthlyPDF(opt.value)}>{opt.label}</button>
              ));
            })()}
            <button onClick={() => setShowDownloadModal(false)} style={{width:'100%', padding:15, border:'none', background:'none', color:'#FF3B30', fontWeight:700}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
              }
    
