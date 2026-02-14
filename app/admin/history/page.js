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

  // PDF ထုတ်ရင် အသေးစိတ်စာရင်းပါအောင် လုပ်ခြင်း
  const handleMonthlyPDF = (monthVal) => {
    const monthlyData = orders.filter(o => o.displayDate.startsWith(monthVal));
    const printWindow = window.open('', '_blank');
    let tableRows = monthlyData.map(o => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${o.displayDate}<br><small>${o.orderId || o.id.slice(-5)}</small></td>
        <td style="padding: 10px;"><b>${o.name}</b></td>
        <td style="padding: 10px;">${o.items.map(i => `${i.name} x${i.qty}`).join('<br>')}</td>
        <td style="padding: 10px; text-align: right;">${Number(o.totalPrice).toLocaleString()} Ks</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html><head><title>Monthly Report - ${monthVal}</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2 style="text-align: center;">Sales Report (${monthVal})</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background: #f8f9fa;">
            <tr><th style="padding: 10px; text-align: left;">Date/ID</th><th style="padding: 10px; text-align: left;">Customer</th><th style="padding: 10px; text-align: left;">Items Ordered</th><th style="padding: 10px; text-align: right;">Amount</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <h3 style="text-align: right; margin-top: 20px;">Grand Total: ${monthlyData.reduce((s,o) => s+Number(o.totalPrice),0).toLocaleString()} Ks</h3>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowDownloadModal(false);
  };

  if (selectedOrder) {
    return (
      <div className="full-page">
        <style jsx>{`
          .full-page { background: #F4F7FE; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica; }
          .top-nav { padding: 20px; display: flex; align-items: center; background: #FFF; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
          .back-btn { background: #F0F2F5; border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; color: #1A1C1E; }
          .content { padding: 20px; max-width: 500px; margin: 0 auto; }
          .voucher { background: #FFF; border-radius: 24px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; overflow: hidden; }
          .voucher:before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: #007AFF; }
          .v-item { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; color: #4A4A4A; }
          .v-total { border-top: 1px dashed #EEE; padding-top: 15px; font-weight: 800; font-size: 20px; display: flex; justify-content: space-between; color: #1A1C1E; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .info-card { background: #FFF; padding: 12px; border-radius: 16px; font-size: 12px; border: 1px solid #F0F0F0; }
        `}</style>
        <div className="top-nav">
          <button className="back-btn" onClick={() => setSelectedOrder(null)}>←</button>
          <b style={{marginLeft: '15px', fontSize: '18px'}}>Invoice Details</b>
        </div>
        <div className="content">
          <div className="info-grid">
            <div className="info-card"><small style={{color:'#999'}}>CUSTOMER</small><div style={{fontWeight:'bold'}}>{selectedOrder.name}</div></div>
            <div className="info-card"><small style={{color:'#999'}}>PHONE</small><div style={{fontWeight:'bold'}}>{selectedOrder.phone}</div></div>
          </div>
          <div className="voucher">
             <div style={{display:'flex', justifyContent:'space-between', marginBottom: 20}}>
                <b style={{fontSize: 18}}>#ID-${selectedOrder.orderId || selectedOrder.id.slice(-4).toUpperCase()}</b>
                <span style={{background:'#E3F9E5', color:'#1DB954', padding:'4px 10px', borderRadius:8, fontSize:12, fontWeight:'bold'}}>{selectedOrder.status}</span>
             </div>
             {selectedOrder.items?.map((item, i) => (
               <div key={i} className="v-item"><span>{item.name} <small style={{color:'#999'}}>x${item.qty}</small></span><span>${(item.price * item.qty).toLocaleString()} Ks</span></div>
             ))}
             <div className="v-total"><span>Grand Total</span><span>${Number(selectedOrder.totalPrice).toLocaleString()} Ks</span></div>
          </div>
          <button onClick={() => window.print()} style={{width:'100%', padding:'18px', background:'#1A1C1E', color:'#FFF', borderRadius:'18px', marginTop:'30px', fontWeight:'bold', border:'none', fontSize:16, cursor:'pointer'}}>Download Invoice</button>
        </div>
      </div>
    );
  }

  return (
    <div className="root">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style jsx>{`
        .root { background: #F8F9FA; min-height: 100vh; font-family: -apple-system, sans-serif; padding-bottom: 30px; }
        .nav { background: #FFF; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .back-mini { background: #F4F7FE; border: none; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .summary { display: flex; gap: 12px; padding: 20px; overflow-x: auto; }
        .s-card { background: #FFF; min-width: 100px; flex: 1; padding: 15px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid #FFF; }
        .s-card small { font-size: 10px; color: #A0AEC0; font-weight: 700; letter-spacing: 0.5px; }
        .s-card b { display: block; font-size: 15px; color: #2D3748; margin-top: 4px; }
        
        .search-row { padding: 0 20px 15px; display: flex; gap: 10px; }
        .search-box { position: relative; flex: 1; }
        .search-box input { width: 100%; padding: 12px 40px 12px 15px; border-radius: 14px; border: 1px solid #E2E8F0; background: #FFF; font-size: 13px; outline: none; transition: 0.3s; box-sizing: border-box; }
        .search-box input:focus { border-color: #007AFF; box-shadow: 0 0 0 4px rgba(0,122,255,0.1); }
        .clear-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #CBD5E0; cursor: pointer; border: none; background: none; }
        
        .cal-btn { width: 45px; height: 45px; background: #FFF; border: 1px solid #E2E8F0; border-radius: 14px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .cal-btn input { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
        
        .card { background: #FFF; margin: 0 20px 12px; padding: 18px; border-radius: 22px; border: 1px solid #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s; }
        .card:active { transform: scale(0.98); }
        
        .modal { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(5px); display: flex; align-items: flex-end; z-index: 1000; }
        .modal-body { background: #FFF; width: 100%; border-radius: 30px 30px 0 0; padding: 30px 20px; text-align: center; }
        .opt-btn { width: 100%; padding: 16px; border-radius: 18px; border: none; background: #F4F7FE; margin-bottom: 12px; font-weight: 700; color: #2D3748; cursor: pointer; }
      `}</style>

      <div className="nav">
        <button className="back-mini" onClick={() => router.back()}><i className="fa-solid fa-chevron-left"></i></button>
        <b style={{fontSize:'16px'}}>Orders History</b>
        <button className="back-mini" onClick={() => setShowMenu(!showMenu)}><i className="fa-solid fa-ellipsis-v"></i></button>
        {showMenu && (
          <div style={{position:'absolute', right:20, top:60, background:'#FFF', borderRadius:15, boxShadow:'0 10px 30px rgba(0,0,0,0.1)', width:180, zIndex:100, overflow:'hidden', border: '1px solid #f0f0f0'}}>
            <button style={{width:'100%', padding:15, border:'none', background:'none', textAlign:'left', fontSize:13, fontWeight:600}} onClick={() => { setShowDownloadModal(true); setShowMenu(false); }}>📥 Get Monthly Report</button>
            <button style={{width:'100%', padding:15, border:'none', background:'none', textAlign:'left', fontSize:13, fontWeight:600}} onClick={() => { setSelDate(""); setSearchId(""); setShowMenu(false); }}>🔄 Reset Filters</button>
          </div>
        )}
      </div>

      <div className="summary">
        <div className="s-card"><small>REVENUE</small><b>${totalIncome.toLocaleString()} Ks</b></div>
        <div className="s-card"><small>ORDERS</small><b>${filteredOrders.length}</b></div>
        <div className="s-card"><small>CUSTOMERS</small><b>${new Set(filteredOrders.map(o => o.phone)).size}</b></div>
      </div>

      <div className="search-row">
        <div className="search-box">
          <input placeholder="Search by Order ID or Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
          {searchId && <button className="clear-btn" onClick={() => setSearchId("")}><i className="fa-solid fa-circle-xmark"></i></button>}
        </div>
        <div className="cal-btn">
          <i className="fa-solid fa-calendar-alt" style={{color:'#4A5568'}}></i>
          <input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} />
        </div>
      </div>

      <div>
        {filteredOrders.map(order => (
          <div key={order.id} className="card" onClick={() => setSelectedOrder(order)}>
            <div>
              <div style={{fontWeight: 700, fontSize: 15, color: '#2D3748'}}>${order.name}</div>
              <div style={{fontSize: 11, color: '#A0AEC0', marginTop: 4}}>#ID-${order.orderId || order.id.slice(-4)} • ${order.displayDate}</div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: 800, fontSize: 15, color: '#2D3748'}}>${Number(order.totalPrice).toLocaleString()} Ks</div>
              <div style={{fontSize: 10, color: '#48BB78', fontWeight: 700, marginTop: 4}}>${order.status.toUpperCase()}</div>
            </div>
          </div>
        ))}
      </div>

      {showDownloadModal && (
        <div className="modal" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-body" onClick={e => e.stopPropagation()}>
            <div style={{width: 40, height: 4, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 20px'}}></div>
            <h3 style={{margin: '0 0 10px'}}>Monthly Report</h3>
            <p style={{fontSize: 13, color: '#718096', marginBottom: 25}}>စာရင်းအသေးစိတ်ထုတ်ယူမည့် လကိုရွေးချယ်ပါ</p>
            {(() => {
              const options = [];
              const now = new Date();
              for (let i = 0; i < 2; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                options.push({ label: d.toLocaleString('default', { month: 'long', year: 'numeric' }), value: d.toISOString().slice(0, 7) });
              }
              return options.map((opt, i) => (
                <button key={i} className="opt-btn" onClick={() => handleMonthlyPDF(opt.value)}>{opt.label}</button>
              ));
            })()}
            <button onClick={() => setShowDownloadModal(false)} style={{marginTop: 15, background: 'none', border: 'none', color: '#F56565', fontWeight: 700, fontSize: 15}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
                                                                               }
    
