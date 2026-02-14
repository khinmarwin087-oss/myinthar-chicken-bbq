"use client";
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { db } from "../../../lib/firebase"; 
import { collection, onSnapshot, query } from "firebase/firestore";

export default function AdminHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDate, setSelDate] = useState("");
  const [searchId, setSearchId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Index Error မတက်အောင် simple query ပဲသုံးပါမယ်
    const q = query(collection(db, "orders"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Client-side မှာပဲ အချိန်အလိုက် စီပေးပါမယ် (Index မလိုပါ)
      allOrders.sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0));

      // History မှာ ပြချင်တဲ့ status တွေကိုပဲ filter လုပ်ပါမယ်
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

  // Filter ရှာဖွေခြင်း logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const name = (o.name || o.customerName || "").toLowerCase();
      const orderID = (o.id || "").toLowerCase();
      const search = searchId.toLowerCase();
      const matchesDate = selDate ? o.date === selDate : true;
      const matchesSearch = searchId ? (orderID.includes(search) || name.includes(search)) : true;
      return matchesDate && matchesSearch;
    });
  }, [orders, selDate, searchId]);

  const totalIncome = filteredOrders.reduce((acc, curr) => acc + Number(curr.totalPrice || 0), 0);

  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const date = order.date || "Unknown";
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});

  // Voucher View
  if (selectedOrder) {
    return (
      <div style={{ background: '#0A0C10', minHeight: '100vh', color: '#fff', padding: '20px' }}>
        <button onClick={() => setSelectedOrder(null)} style={{ background: '#2D323D', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', marginBottom: '20px' }}>BACK</button>
        <div style={{ background: '#161A22', padding: '20px', borderRadius: '20px', border: '1px solid #2d323d' }}>
           <h2 style={{ textAlign: 'center', color: '#00F2EA' }}>YNS KITCHEN</h2>
           <hr style={{ borderColor: '#2d323d', borderStyle: 'dashed' }} />
           <p>Order ID: #{selectedOrder.id?.slice(-6).toUpperCase()}</p>
           <p>Customer: {selectedOrder.name || selectedOrder.customerName}</p>
           <p>Date: {selectedOrder.date} | {selectedOrder.time}</p>
           <hr style={{ borderColor: '#2d323d' }} />
           {selectedOrder.items?.map((item, i) => (
             <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>{item.name} x {item.qty}</span>
                <span>{(item.price * item.qty).toLocaleString()} Ks</span>
             </div>
           ))}
           <div style={{ background: '#00F2EA', color: '#000', padding: '15px', borderRadius: '10px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>TOTAL</span>
              <span>{Number(selectedOrder.totalPrice).toLocaleString()} Ks</span>
           </div>
           <button onClick={() => window.print()} style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '10px', background: '#fff', fontWeight: 'bold' }}>PRINT VOUCHER</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0A0C10', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2229' }}>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'none' }}>← Back</Link>
        <b style={{ fontSize: '18px' }}>History</b>
        <input type="date" onChange={(e) => setSelDate(e.target.value)} style={{ background: '#161A22', color: '#fff', border: '1px solid #2d323d', padding: '5px', borderRadius: '5px' }} />
      </div>

      {/* Summary Card */}
      <div style={{ margin: '20px', padding: '20px', background: 'linear-gradient(135deg, #161A22, #0A0C10)', borderRadius: '20px', border: '1px solid #2d323d' }}>
        <small style={{ color: '#8e9196' }}>TOTAL INCOME</small>
        <div style={{ fontSize: '28px', fontWeight: '900', color: '#00F2EA' }}>{totalIncome.toLocaleString()} Ks</div>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px 20px' }}>
        <input 
          type="text" 
          placeholder="Search Name or Order ID..." 
          style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#161A22', border: '1px solid #2d323d', color: '#fff' }}
          onChange={(e) => setSearchId(e.target.value)}
        />
      </div>

      {/* List */}
      <div style={{ paddingBottom: '50px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#8e9196' }}>Loading...</div>
        ) : (
          Object.keys(groupedOrders).map(date => (
            <div key={date}>
              <div style={{ padding: '10px 20px', color: '#00F2EA', fontSize: '12px', fontWeight: 'bold' }}>{date}</div>
              {groupedOrders[date].map(order => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ background: '#161A22', margin: '0 20px 10px', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{order.name || order.customerName}</div>
                    <small style={{ color: '#8e9196' }}>{order.time} • #{order.id?.slice(-5).toUpperCase()}</small>
                  </div>
                  <div style={{ textAlign: 'right', color: '#00F2EA', fontWeight: 'bold' }}>
                    {Number(order.totalPrice).toLocaleString()} Ks
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
