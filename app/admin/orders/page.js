"use client";
import { useEffect, useState } from 'react';
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, updateDoc, doc, query } from "firebase/firestore";
import Link from 'next/link';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('New'); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "orders")), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setOrders(list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateStatus = async (id, status) => {
        if (status === 'Rejected' && !confirm("အော်ဒါကို ပယ်ဖျက်မှာ သေချာပါသလား?")) return;
        try { await updateDoc(doc(db, "orders", id), { status }); } 
        catch (e) { console.error(e); }
    };

    const filtered = orders.filter(o => {
        const s = o.status?.toLowerCase();
        if (activeTab === 'New') return s === 'pending' || s === 'new' || !s;
        return s === activeTab.toLowerCase();
    });

    return (
        <div style={{ background: '#F0F2F5', minHeight: '100vh', padding: '10px' }}>
            <style>{`
                .order-card { background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-left: 5px solid #007AFF; }
                .compact-item { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; border-bottom: 1px dashed #eee; }
                .btn { padding: 6px 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 12px; cursor: pointer; transition: 0.2s; }
                .btn:active { transform: scale(0.95); }
                .btn-accept { background: #007AFF; color: #fff; }
                .btn-reject { background: #FFF0F0; color: #FF3B30; }
                .btn-ready { background: #34C759; color: #fff; }
                .btn-done { background: #1c1c1e; color: #fff; }
                .tab-btn { flex: 1; padding: 8px; border: none; font-size: 13px; font-weight: 800; border-radius: 8px; transition: 0.3s; }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <Link href="/admin" style={{ color: '#007AFF', textDecoration: 'none' }}><i className="fas fa-arrow-left"></i></Link>
                <h3 style={{ flex: 1, textAlign: 'center', margin: 0 }}>KDS Console</h3>
            </div>

            <div style={{ display: 'flex', background: '#ddd', padding: '3px', borderRadius: '10px', marginBottom: '15px', gap: '2px' }}>
                {['New', 'Cooking', 'Ready'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" 
                        style={{ background: activeTab === t ? '#fff' : 'transparent', color: activeTab === t ? '#000' : '#666' }}>{t}</button>
                ))}
            </div>

            <div className="orders-container">
                {filtered.map(order => (
                    <div key={order.id} className="order-card" style={{ borderLeftColor: activeTab==='Ready' ? '#34C759' : '#007AFF' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <b style={{ fontSize: '14px' }}>{order.name}</b>
                            <span style={{ fontSize: '11px', color: '#999' }}>#{order.orderId || 'N/A'}</span>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                            {order.items?.map((item, i) => (
                                <div key={i} className="compact-item">
                                    <span>{item.name} <small>x{item.qty}</small></span>
                                    <b>{(item.price * item.qty).toLocaleString()}</b>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '15px', fontWeight: '900' }}>{Number(order.totalPrice).toLocaleString()} K</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {activeTab === 'New' && (
                                    <>
                                        <button onClick={() => updateStatus(order.id, 'Rejected')} className="btn btn-reject">Ignore</button>
                                        <button onClick={() => updateStatus(order.id, 'Cooking')} className="btn btn-accept">Accept</button>
                                    </>
                                )}
                                {activeTab === 'Cooking' && (
                                    <button onClick={() => updateStatus(order.id, 'Ready')} className="btn btn-ready">Ready to Pickup</button>
                                )}
                                {activeTab === 'Ready' && (
                                    <button onClick={() => updateStatus(order.id, 'Success')} className="btn btn-done">Done & Paid</button>
                                )}
                            </div>
                        </div>
                        {order.note && <div style={{ fontSize: '11px', color: '#f39c12', marginTop: '8px' }}>📍 {order.note}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}
