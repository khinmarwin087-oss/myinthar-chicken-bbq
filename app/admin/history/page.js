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

  useEffect(() => {
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Date ကို YYYY-MM-DD ပြောင်းလဲခြင်း
        let cleanDate = "";
        if (data.orderDate) {
           cleanDate = data.orderDate.split('T')[0]; // ISO string မှ ဖြတ်ယူခြင်း
        } else if (data.date) {
           cleanDate = data.date;
        }

        return { 
          id: doc.id, 
          ...data,
          displayDate: cleanDate
        };
      });

      // 🔥 အရေးကြီးဆုံးအချက် - History မှာ ပေါ်ဖို့ status ကို ပိုစုံအောင် ထည့်ထားပါတယ်
      // အခု လောလောဆယ် "Ready" ဖြစ်သွားရင်တင် History ထဲ စဝင်အောင် လုပ်ထားပေးပါတယ်
      const historyItems = allOrders.filter(o => 
        ['Ready', 'Success', 'Done', 'completed', 'Success'].includes(o.status)
      );

      historyItems.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
      setOrders(historyItems);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = (o.name || "").toLowerCase();
      const orderID = (o.orderId || o.id || "").toLowerCase();
      const search = searchId.toLowerCase();
      
      const matchesDate = selDate ? o.displayDate === selDate : true;
      const matchesSearch = searchId ? (orderID.includes(search) || name.includes(search)) : true;
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || 0), 0);
  const totalOrders = filteredOrders.length;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.phone || o.name)).size;

  return (
    <div className="history-root">
      <style jsx>{`
        .history-root { background: #FBFBFC; min-height: 100vh; font-family: -apple-system, sans-serif; }
        .nav-bar { background: #FFF; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #F0F0F0; position: sticky; top: 0; z-index: 50; }
        .nav-back { border: none; background: none; font-size: 20px; color: #444; cursor: pointer; }
        
        .summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 12px 16px; }
        .card { background: #FFF; padding: 10px 5px; border-radius: 12px; border: 1px solid #EEF0F2; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .card span { display: block; font-size: 8px; color: #8E8E93; text-transform: uppercase; margin-bottom: 2px; }
        .card b { font-size: 11px; color: #1C1C1E; font-weight: 700; }

        .filter-row { padding: 0 16px 12px; display: flex; gap: 8px; }
        .search-field { flex: 1.5; background: #FFF; border: 1px solid #E5E5EA; border-radius: 10px; padding: 8px 12px; font-size: 11px; outline: none; }
        .date-field { flex: 1; background: #FFF; border: 1px solid #E5E5EA; border-radius: 10px; padding: 8px; font-size: 10px; }

        .order-card { background: #FFF; border: 1px solid #F0F0F2; border-radius: 14px; padding: 12px; margin: 0 16px 8px; display: flex; justify-content: space-between; align-items: center; }
        .order-main b { display: block; font-size: 12px; color: #222; margin-bottom: 2px; }
        .order-main small { font-size: 10px; color: #999; }
        .price { font-size: 12px; font-weight: 700; color: #1C1C1E; }
        .status-tag { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #E8F8F0; color: #27AE60; font-weight: bold; }
        
        .menu-pop { position: absolute; right: 16px; top: 50px; background: #FFF; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); border: 1px solid #F0F0F0; width: 170px; z-index: 100; }
        .menu-item { width: 100%; padding: 12px 16px; border: none; background: none; text-align: left; font-size: 12px; color: #333; }

        @media print { .nav-bar, .summary-row, .filter-row { display: none !important; } .order-card { border: none; border-bottom: 1px solid #EEE; } }
      `}</style>

      <div className="nav-bar">
        <button className="nav-back" onClick={() => router.back()}>✕</button>
        <b style={{ fontSize: '13px' }}>Order History</b>
        <div style={{ position: 'relative' }}>
          <button className="nav-back" onClick={() => setShowMenu(!showMenu)}>⋮</button>
          {showMenu && (
            <div className="menu-pop">
              <button className="menu-item" onClick={() => { window.print(); setShowMenu(false); }}>📄 Download PDF</button>
              <button className="menu-item" onClick={() => { setSelDate(""); setShowMenu(false); }}>🔄 View All</button>
            </div>
          )}
        </div>
      </div>

      <div className="summary-row">
        <div className="card"><span>Revenue</span><b>{totalIncome.toLocaleString()}</b></div>
        <div className="card"><span>Orders</span><b>{totalOrders}</b></div>
        <div className="card"><span>Customer</span><b>{uniqueCustomers}</b></div>
      </div>

      <div className="filter-row">
        <input className="search-field" placeholder="Search by ID or Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        <input type="date" className="date-field" value={selDate} onChange={(e) => setSelDate(e.target.value)} />
      </div>

      <div className="list-container">
        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999', padding: '20px' }}>Loading records...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999', padding: '20px' }}>No records found</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-main">
                <b>{order.name || "Customer"}</b>
                <small>{order.orderId || order.id.slice(-6)} • {order.displayDate}</small>
              </div>
              <div className="order-side">
                <div className="price">{Number(order.totalPrice || 0).toLocaleString()} Ks</div>
                <span className="status-tag">{order.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
