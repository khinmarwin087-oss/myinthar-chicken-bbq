"use client";
import { useEffect, useState } from 'react';
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";
import Link from 'next/link';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('New'); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // query ထဲက orderBy ကြောင့် error တက်နေရင် အရင်ဖြုတ်ပြီး စမ်းကြည့်ဖို့ logic ပါ
        const q = query(collection(db, "orders")); 
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Client side မှာတင် ရက်စွဲအလိုက် ပြန်စီပေးထားပါတယ်
            orderList.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            
            setOrders(orderList);
            setLoading(false);
        }, (error) => {
            console.error("Firebase Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        } catch (error) { alert("Error updating status"); }
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'New') return !order.status || order.status === 'New';
        return order.status === activeTab;
    });

    if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading Orders...</div>;

    return (
        <div style={{ background: '#F4F7FE', minHeight: '100vh', padding: '15px' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Header - Orders ကို အလယ်ပို့ထားပါတယ် */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
                <Link href="/admin" style={{ position: 'absolute', left: 0, textDecoration: 'none', color: '#007AFF', fontWeight: 'bold' }}>
                    <i className="fas fa-chevron-left"></i> Admin
                </Link>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Orders</h2>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#E0E0E0', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
                {['New', 'Cooking', 'Ready'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                        background: activeTab === tab ? '#fff' : 'transparent', fontWeight: 'bold'
                    }}>{tab}</button>
                ))}
            </div>

            {/* Order Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredOrders.length === 0 ? (
                    <div style={{textAlign:'center', color:'#999', marginTop: '30px'}}>အော်ဒါမရှိသေးပါ</div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} style={{ background: '#fff', borderRadius: '15px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#999'}}>
                                <span>{order.orderId || 'No ID'}</span>
                                <span>{order.orderDate ? new Date(order.orderDate).toLocaleString() : ''}</span>
                            </div>
                            <div style={{fontSize:'18px', fontWeight:'bold', margin:'10px 0'}}>{order.name}</div>
                            <div style={{color:'#007AFF', fontWeight:'bold'}}>{order.phone}</div>
                            
                            <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'10px', marginTop: '10px'}}>
                                {order.items?.map((item, i) => (
                                    <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'14px', marginBottom:'5px'}}>
                                        <span>{item.name} x {item.qty}</span>
                                        <span>{(item.price * item.qty).toLocaleString()} Ks</span>
                                    </div>
                                ))}
                                {order.note && <div style={{fontSize:'12px', color:'orange', borderTop:'1px solid #eee', paddingTop:'5px'}}>Note: {order.note}</div>}
                            </div>
                            
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'15px'}}>
                                <div style={{fontWeight:'bold', fontSize:'18px'}}>{(order.totalPrice || 0).toLocaleString()} Ks</div>
                                <div style={{display:'flex', gap:'5px'}}>
                                    {activeTab === 'New' && <button onClick={() => updateStatus(order.id, 'Cooking')} style={{background:'#007AFF', color:'#fff', border:'none', padding:'8px 15px', borderRadius:'8px'}}>Accept</button>}
                                    {activeTab === 'Cooking' && <button onClick={() => updateStatus(order.id, 'Ready')} style={{background:'#34C759', color:'#fff', border:'none', padding:'8px 15px', borderRadius:'8px'}}>Ready</button>}
                                    {activeTab === 'Ready' && <span style={{color:'#34C759'}}><i className="fas fa-check"></i> Done</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
        }
                    
