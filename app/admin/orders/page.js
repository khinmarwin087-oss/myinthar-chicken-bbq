"use client";
import { useEffect, useState } from 'react';
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, updateDoc, doc, query, orderBy } from "firebase/firestore";

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('New'); // New, Cooking, Ready
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener သုံးထားလို့ order တက်တာနဲ့ ချက်ချင်းပြပါလိမ့်မယ်
        const q = query(collection(db, "orders"), orderBy("orderDate", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOrders(orderList);
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
        <div style={{ background: '#F4F7FE', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <a href="/admin" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold' }}>
                    <i className="fas fa-chevron-left"></i> Admin
                </a>
                <h2 style={{ flex: 1, textAlign: 'center', margin: 0 }}>Orders</h2>
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', background: '#E0E0E0', borderRadius: '12px', padding: '5px', marginBottom: '25px' }}>
                {['New', 'Cooking', 'Ready'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                            background: activeTab === tab ? '#fff' : 'transparent',
                            fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
                            boxShadow: activeTab === tab ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Order Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredOrders.length === 0 ? (
                    <div style={{textAlign:'center', color:'#999', marginTop:'20px'}}>အော်ဒါမရှိသေးပါ</div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                                <span>ID: {order.orderId || order.id.slice(0,5)}</span>
                                <span>{order.orderDate}</span>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{order.name}</div>
                                <div style={{ color: '#007AFF', fontWeight: 'bold', marginTop: '5px' }}>
                                    <i className="fas fa-phone-alt"></i> {order.phone}
                                </div>
                            </div>

                            <div style={{ background: '#F9F9F9', borderRadius: '12px', padding: '15px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginBottom: '10px', fontWeight: 'bold' }}>
                                    <span>ITEM NAME</span>
                                    <span>QTY</span>
                                    <span>TOTAL</span>
                                </div>
                                {order.items.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                        <span style={{ flex: 2, fontWeight: '500' }}>{item.name}</span>
                                        <span style={{ flex: 1, textAlign: 'center', color: '#999' }}>x{item.qty}</span>
                                        <span style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>{(item.price * item.qty).toLocaleString()} Ks</span>
                                    </div>
                                ))}
                                {order.note && (
                                    <div style={{ marginTop: '10px', padding: '8px', borderTop: '1px solid #eee', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                                        Note: {order.note}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#666' }}>Total:</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>{order.totalPrice.toLocaleString()} Ks</div>
                                </div>

                                {/* Action Buttons based on status */}
                                {activeTab === 'New' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => updateStatus(order.id, 'Cancelled')} style={{ padding: '12px 20px', background: '#FF3B30', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Cancel</button>
                                        <button onClick={() => updateStatus(order.id, 'Cooking')} style={{ padding: '12px 20px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Accept</button>
                                    </div>
                                )}
                                {activeTab === 'Cooking' && (
                                    <button onClick={() => updateStatus(order.id, 'Ready')} style={{ padding: '12px 25px', background: '#34C759', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>Ready</button>
                                )}
                                {activeTab === 'Ready' && (
                                    <div style={{ color: '#34C759', fontWeight: 'bold' }}><i className="fas fa-check-circle"></i> Completed</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        </div>
    );
            }
                  
