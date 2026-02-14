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
        // Date Format ကို သေချာ ပြန်ညှိခြင်း (ISO string ကနေ YYYY-MM-DD ပြောင်းတာ)
        let formattedDate = data.date;
        if (data.orderDate) {
           formattedDate = new Date(data.orderDate).toISOString().split('T')[0];
        }

        return { 
          id: doc.id, 
          ...data,
          displayDate: formattedDate // တွက်ချက်ဖို့အတွက် date သီးသန့်ထားမယ်
        };
      });

      // တကယ် အောင်မြင်သွားတဲ့ (သို့မဟုတ်) ပြီးဆုံးသွားတဲ့ အော်ဒါတွေကိုပဲ သမိုင်း (History) မှာ ပြပါမယ်
      // အခု လောလောဆယ် "Ready" တွေရော၊ "Success" တွေရော ပါအောင် စစ်ထားပါတယ်
      const historyOnly = allOrders.filter(o => 
        ['Success', 'Done', 'completed'].includes(o.status)
      );

      // အချိန်အလိုက် အရင်ဆုံးကနေ ပြန်စီမယ်
      historyOnly.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));
      
      setOrders(historyOnly);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtering Logic (Date and Search)
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = (o.name || o.customerName || "").toLowerCase();
      const orderID = (o.id || "").toLowerCase();
      const search = searchId.toLowerCase();
      
      // Date ရွေးထားရင် အဲ့ဒီရက်နဲ့ ကိုက်တာပဲ ပြမယ်
      const matchesDate = selDate ? o.displayDate === selDate : true;
      const matchesSearch = searchId ? (orderID.includes(search) || name.includes(search)) : true;
      
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

  // အမှန်ကန်ဆုံး တွက်ချက်မှုများ
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
        .card { background: #FFF; padding: 10px 5px; border-radius: 12px; border: 1px solid #EEF0F2; text-align: center; }
        .card span { display: block; font-size: 8px; color: #8E8E93; text-transform: uppercase; margin-bottom: 2px; }
        .card b { font-size: 11px; color: #1C1C1E; }

        .filter-row { padding: 0 16px 12px; display: flex; gap: 8px; }
        .search-field { flex: 1.5; background: #FFF; border: 1px solid #E5E5EA; border-radius: 10px; padding: 8px 12px; font-size: 11px; outline: none; }
        .date-field { flex: 1; background: #FFF; border: 1px solid #E5E5EA; border-radius: 10px; padding: 8px; font-size: 10px; }

        .order-card { background: #FFF; border: 1px solid #F0F0F2; border-radius: 14px; padding: 12px; margin: 0 16px 8px; display: flex; justify-content: space-between; align-items: center; }
        .order-main b { display: block; font-size: 12px; color: #222; margin-bottom: 2px; }
        .order-main small { font-size: 10px; color: #999; }
        .order-side { text-align: right; }
        .price { font-size: 12px; font-weight: 700; color: #1C1C1E; }
        .status-tag { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #E8F8F0; color: #27AE60; font-weight: bold; }
      `}</style>

      {/* Navigation */}
      <div className="nav-bar">
        <button className="nav-back" onClick={() => router.back()}>✕</button>
        <b style={{ fontSize: '14px' }}>Order History</b>
        <button className="nav-back" onClick={() => setShowMenu(!showMenu)}>⋮</button>
      </div>

      {/* Summary */}
      <div className="summary-row">
        <div className="card"><span>Revenue</span><b>{totalIncome.toLocaleString()}</b></div>
        <div className="card"><span>Orders</span><b>{totalOrders}</b></div>
        <div className="card"><span>Customer</span><b>{uniqueCustomers}</b></div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <input className="search-field" placeholder="Search by ID or Name..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
        <input type="date" className="date-field" value={selDate} onChange={(e) => setSelDate(e.target.value)} />
      </div>

      {/* List */}
      <div className="list-container">
        {loading ? (
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999', marginTop: '20px' }}>Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999', marginTop: '20px' }}>No records for selected filter</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-main">
                <b>{order.name || "Customer"}</b>
                <small>#{order.id?.slice(-5).toUpperCase()} • {order.displayDate}</small>
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
