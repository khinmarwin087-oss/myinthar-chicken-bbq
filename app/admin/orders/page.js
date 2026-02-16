"use client";
import { useEffect, useState } from 'react';
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, updateDoc, doc, query } from "firebase/firestore";
import Link from 'next/link';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('New'); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    const filtered = orders.filter(o => {
        const s = o.status?.toLowerCase();
        const matchesTab = activeTab === 'New' 
            ? (s === 'pending' || s === 'new' || !s)
            : s === activeTab.toLowerCase();
        const matchesSearch = o.name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.orderId?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div style={{ background: '#F2F2F7', minHeight: '100vh' }}>
            <style>{`
                .sticky-header { 
                    position: sticky; top: 0; z-index: 100; 
                    background: rgba(255, 255, 255, 0.8); 
                    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                    padding: 12px 16px; border-bottom: 0.5px solid rgba(0,0,0,0.1);
                }
                .header-row { display: flex; align-items: center; justify-content: space-between; position: relative; height: 44px; }
                .apple-back-btn {
                    width: 32px; height: 44px; display: flex; align-items: center; 
                    color: #007AFF; text-decoration: none; transition: opacity 0.2s;
                }
                .apple-back-btn:active { opacity: 0.3; }
                .nav-title { 
                    position: absolute; left: 50%; transform: translateX(-50%);
                    font-size: 17px; font-weight: 700; color: #000; letter-spacing: -0.4px;
                }
                .search-box {
                    background: rgba(118, 118, 128, 0.12); border-radius: 10px; 
                    padding: 8px 12px; display: flex; align-items: center; margin-top: 15px;
                }
                .search-input {
                    background: transparent; border: none; outline: none;
                    width: 100%; font-size: 16px; margin-left: 8px; color: #000;
                }
                .tab-bar { display: flex; background: rgba(118, 118, 128, 0.08); padding: 2px; border-radius: 8px; margin-top: 15px; }
                .tab-btn { 
                    flex: 1; padding: 7px; border: none; font-size: 13px; font-weight: 600; 
                    border-radius: 7px; cursor: pointer; position: relative; transition: 0.2s;
                }
                .badge { 
                    background: #FF3B30; color: #fff; padding: 1px 5px; 
                    border-radius: 10px; font-size: 10px; position: absolute; top: -5px; right: -2px;
                    border: 2px solid #fff;
                }
                .order-card { 
                    background: #fff; border-radius: 14px; padding: 16px; 
                    margin: 12px 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .compact-item { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #3a3a3c; }
            `}</style>

            <div className="sticky-header">
                <div className="header-row">
                    <Link href="/admin" className="apple-back-btn">
                        <svg width="12" height="21" viewBox="0 0 12 21" fill="none">
                            <path d="M10.5 19.5L1.5 10.5L10.5 1.5" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{marginLeft: 5, fontSize: 17}}>Back</span>
                    </Link>
                    <span className="nav-title">Orders</span>
                    <div style={{ width: 60 }}></div> 
                </div>

                <div className="search-box">
                    <i className="fas fa-search" style={{ color: '#8e8e93', fontSize: '15px' }}></i>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Search" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="tab-bar">
                    {['New', 'Cooking', 'Ready'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" 
                            style={{ 
                                background: activeTab === t ? '#fff' : 'transparent', 
                                color: activeTab === t ? '#000' : '#8e8e93',
                                boxShadow: activeTab === t ? '0 3px 8px rgba(0,0,0,0.12)' : 'none'
                            }}>
                            {t} {getCount(t) > 0 && <span className="badge">{getCount(t)}</span>}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: '8px 0 30px 0' }}>
                {loading ? (
                    <div style={{textAlign:'center', marginTop: '40px', color: '#8e8e93'}}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{textAlign:'center', color: '#8e8e93', marginTop: '60px'}}>
                        <i className="fas fa-magnifying-glass" style={{fontSize: '30px', marginBottom: 15, display: 'block'}}></i>
                        No Orders Found
                    </div>
                ) : (
                    filtered.map(order => (
                        <div key={order.id} className="order-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <b style={{ fontSize: '17px', letterSpacing: '-0.3px' }}>{order.name}</b>
                                <span style={{ fontSize: '13px', color: '#8e8e93' }}>#{order.orderId?.replace('ORD-', '')}</span>
                            </div>
                            
                            <div style={{ marginBottom: '15px', borderTop: '0.5px solid #eee', paddingTop: '10px' }}>
                                {order.items?.map((item, i) => (
                                    <div key={i} className="compact-item">
                                        <span>{item.name} <span style={{color:'#8e8e93'}}>× {item.qty}</span></span>
                                        <span style={{fontWeight: '500'}}>{(item.price * item.qty).toLocaleString()} K</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: '700', color: '#000' }}>
                                    {Number(order.totalPrice).toLocaleString()} K
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {activeTab === 'New' && (
                                        <>
                                            <button onClick={() => updateStatus(order.id, 'Rejected')} style={{padding:'8px 16px', borderRadius:'8px', border:'none', background:'#FFE5E5', color:'#FF3B30', fontWeight:600, fontSize:13}}>Decline</button>
                                            <button onClick={() => updateStatus(order.id, 'Cooking')} style={{padding:'8px 16px', borderRadius:'8px', border:'none', background:'#007AFF', color:'#fff', fontWeight:600, fontSize:13}}>Accept</button>
                                        </>
                                    )}
                                    {activeTab === 'Cooking' && (
                                        <button onClick={() => updateStatus(order.id, 'Ready')} style={{padding:'8px 20px', borderRadius:'8px', border:'none', background:'#34C759', color:'#fff', fontWeight:600, fontSize:13}}>Ready</button>
                                    )}
                                    {activeTab === 'Ready' && (
                                        <button onClick={() => updateStatus(order.id, 'Success')} style={{padding:'8px 20px', borderRadius:'8px', border:'none', background:'#1c1c1e', color:'#fff', fontWeight:600, fontSize:13}}>Done</button>
                                    )}
                                </div>
                            </div>
                            {order.note && <div style={{ fontSize: '13px', color: '#8a8a8e', marginTop: '12px', padding:'8px', background:'#F2F2F7', borderRadius:'8px' }}>💬 {order.note}</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
                    }
                                 
