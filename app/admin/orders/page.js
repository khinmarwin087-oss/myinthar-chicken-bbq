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
        // Real-time listener: Database ပြောင်းတာနဲ့ ချက်ချင်း Update လုပ်ပေးမည်
        const q = query(collection(db, "orders"), orderBy("orderDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Fetched Orders:", orderList); // Debug အတွက်
            setOrders(orderList);
            setLoading(false);
        }, (error) => {
            console.error("Snapshot Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        } catch (error) {
            alert("Error updating status");
        }
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'New') return !order.status || order.status === 'New';
        return order.status === activeTab;
    });

    if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading Orders...</div>;

    return (
        <div style={{ background: '#F4F7FE', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Header: "Orders" စာသားကို အလယ်ပို့ထားသည် */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
                <Link href="/admin" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold', fontSize: '14px', position: 'absolute', left: 0 }}>
                    <i className="fas fa-chevron-left"></i> Admin
                </Link>
                <h2 style={{ width: '100%', textAlign: 'center', margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Orders</h2>
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', background: '#E0E0E0', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
                {['New', 'Cooking', 'Ready'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                            background: activeTab === tab ? '#fff' : 'transparent',
                            fontWeight: 'bold', cursor: 'pointer', transition: '0.2s',
                            boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Order Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredOrders.length === 0 ? (
                    <div style={{textAlign:'center', color:'#999', marginTop:'40px', fontSize: '14px'}}>အော်ဒါမရှိသေးပါ</div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} style={{ background: '#fff', borderRadius: '18px', padding: '18px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999', marginBottom: '10px' }}>
                                <span>ID: {order.orderId || order.id.slice(0,6)}</span>
                                <span>{order.orderDate}</span>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{order.name}</div>
                                <div style={{ color: '#007AFF', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                                    <i className="fas fa-phone-alt"></i> {order.phone}
                                </div>
                            </div>

                            {/* Item List Box */}
                            <div style={{ background: '#F9F9F9', borderRadius: '12px', padding: '12px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#bbb', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    <span style={{flex: 2}}>Item Name</span>
                                    <span style={{flex: 1, textAlign: 'center'}}>Qty</span>
                                    <span style={{flex: 1, textAlign: 'right'}}>Total</span>
                                </div>
                                {order.items.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                                        <span style={{ flex: 2, fontWeight: '500' }}>{item.name}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#777' }}>x{item.qty}</span>
                                        <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{(item.price * item.qty).toLocaleString()} Ks</span>
                                    </div>
                                ))}
                                {order.note && (
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee', fontSize: '12px', color: '#FF9500' }}>
                                        <strong>Note:</strong> {order.note}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>Total Amount:</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{order.totalPrice.toLocaleString()} Ks</div>
                                </div>

                                {/* Buttons based on Status */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {activeTab === 'New' && (
                                        <>
                                            <button onClick={() => updateStatus(order.id, 'Cancelled')} style={{ padding: '10px 15px', background: '#FF3B30', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' }}>Cancel</button>
                                            <button onClick={() => updateStatus(order.id, 'Cooking')} style={{ padding: '10px 15px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' }}>Accept</button>
                                        </>
                                    )}
                                    {activeTab === 'Cooking' && (
                                        <button onClick={() => updateStatus(order.id, 'Ready')} style={{ padding: '10px 20px', background: '#34C759', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' }}>Ready</button>
                                    )}
                                    {activeTab === 'Ready' && (
                                        <span style={{ color: '#34C759', fontWeight: 'bold', fontSize: '13px' }}><i className="fas fa-check-circle"></i> Completed</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
        }
                    
