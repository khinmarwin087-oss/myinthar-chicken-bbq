"use client";
import { useEffect, useState } from 'react';
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, updateDoc, doc, query } from "firebase/firestore";
import Link from 'next/link';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('New'); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(""); // Search အတွက် state

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, "orders")), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setOrders(list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateStatus = async (id, status) => {
        if (status === 'Rejected' && !confirm("ပယ်ဖျက်မှာ သေချာပါသလား?")) return;
        try { await updateDoc(doc(db, "orders", id), { status }); } 
        catch (e) { console.error(e); }
    };

    const getCount = (status) => {
        if (status === 'New') return orders.filter(o => ['pending', 'new', ''].includes(o.status?.toLowerCase() || '')).length;
        return orders.filter(o => o.status?.toLowerCase() === status.toLowerCase()).length;
    };

    // Filter Logic: Tab အလိုက်ရော Search Keyword အလိုက်ရော စစ်ထုတ်မည်
    const filtered = orders.filter(o => {
        const s = o.status?.toLowerCase();
        const matchesTab = activeTab === 'New' 
            ? (s === 'pending' || s === 'new' || !s)
            : s === activeTab.toLowerCase();
        
        const matchesSearch = 
            o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            o.orderId?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTab && matchesSearch;
    });

    return (
        <div style={{ background: '#F0F2F5', minHeight: '100vh' }}>
            <style>{`
                .sticky-header { 
                    position: sticky; top: 0; z-index: 100; 
                    background: rgba(255, 255, 255, 0.9); 
                    backdrop-filter: blur(15px); padding: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .search-box {
                    background: #eee; border-radius: 12px; padding: 8px 12px;
                    display: flex; alignItems: center; margin-top: 10px;
                }
                .search-input {
                    background: transparent; border: none; outline: none;
                    width: 100%; font-size: 14px; margin-left: 8px; font-weight: 600;
                }
                .order-card { 
                    background: #fff; border-radius: 15px; padding: 12px; 
                    margin: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); 
                    border-left: 4px solid #007AFF; 
                }
                .compact-item { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; border-bottom: 1px dashed #eee; }
                .tab-bar { display: flex; background: #eee; padding: 3px; border-radius: 12px; gap: 2px; margin-top: 10px; }
                .tab-btn { flex: 1; padding: 10px; border: none; font-size: 12px; font-weight: 800; border-radius: 10px; cursor: pointer; position: relative; }
                .badge { background: #FF3B30; color: #fff; padding: 2px 5px; border-radius: 5px; font-size: 9px; position: absolute; top: 2px; right: 2px; }
            `}</style>

            <div className="sticky-header">
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link href="/admin" style={{ 
                        background: '#f8f8f8', width: '35px', height: '35px', borderRadius: '10px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        color: '#000', textDecoration: 'none', border: '1px solid #eee'
                    }}>
                        <i className="fas fa-chevron-left"></i>
                    </Link>
                    <h3 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '17px', fontWeight: 800 }}>Orders Management</h3>
                    <div style={{ width: '35px' }}></div>
                </div>

                {/* Search Bar */}
                <div className="search-box">
                    <i className="fas fa-search" style={{ color: '#999', fontSize: '14px' }}></i>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search Name or Order ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <div className="tab-bar">
                    {['New', 'Cooking', 'Ready'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" 
                            style={{ background: activeTab === t ? '#fff' : 'transparent', color: activeTab === t ? '#000' : '#666' }}>
                            {t} {getCount(t) > 0 && <span className="badge">{getCount(t)}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            <div style={{ padding: '5px 0 20px 0' }}>
                {loading ? (
                    <div style={{textAlign:'center', marginTop: '50px', color: '#666'}}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{textAlign:'center', color: '#999', marginTop: '50px'}}>
                        <i className="fas fa-box-open" style={{fontSize: '40px', display: 'block', marginBottom: '10px'}}></i>
                        အော်ဒါရှာမတွေ့ပါ
                    </div>
                ) : (
                    filtered.map(order => (
                        <div key={order.id} className="order-card" style={{ borderLeftColor: activeTab==='Ready' ? '#34C759' : '#007AFF' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                <b style={{ fontSize: '15px' }}>{order.name}</b>
                                <span style={{ fontSize: '11px', color: '#007AFF', fontWeight: 'bold' }}>
                                    #{order.orderId || 'N/A'}
                                </span>
                            </div>
                            
                            <div style={{ background: '#F9F9F9', padding: '10px', borderRadius: '10px', marginBottom: '10px' }}>
                                {order.items?.map((item, i) => (
                                    <div key={i} className="compact-item">
                                        <span>{item.name} <span style={{color:'#888'}}>x{item.qty}</span></span>
                                        <b>{(item.price * item.qty).toLocaleString()} K</b>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '16px', fontWeight: '900' }}>
                                    {Number(order.totalPrice).toLocaleString()} K
                                </span>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {activeTab === 'New' && (
                                        <>
                                            <button onClick={() => updateStatus(order.id, 'Rejected')} style={{padding:'8px 12px', borderRadius:'10px', border:'none', background:'#FFF0F0', color:'#FF3B30', fontWeight:800, fontSize:12}}>Ignore</button>
                                            <button onClick={() => updateStatus(order.id, 'Cooking')} style={{padding:'8px 12px', borderRadius:'10px', border:'none', background:'#007AFF', color:'#fff', fontWeight:800, fontSize:12}}>Accept</button>
                                        </>
                                    )}
                                    {activeTab === 'Cooking' && (
                                        <button onClick={() => updateStatus(order.id, 'Ready')} style={{padding:'8px 15px', borderRadius:'10px', border:'none', background:'#34C759', color:'#fff', fontWeight:800, fontSize:12}}>Ready</button>
                                    )}
                                    {activeTab === 'Ready' && (
                                        <button onClick={() => updateStatus(order.id, 'Success')} style={{padding:'8px 15px', borderRadius:'10px', border:'none', background:'#1c1c1e', color:'#fff', fontWeight:800, fontSize:12}}>Done</button>
                                    )}
                                </div>
                            </div>
                            {order.note && <div style={{ fontSize: '11px', color: '#f39c12', marginTop: '8px', background:'#FFF9EB', padding:'5px', borderRadius:'5px' }}>📝 {order.note}</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
                            }
