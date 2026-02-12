"use client";
import { useEffect, useState } from 'react';
import { db, auth } from "../lib/firebase"; // Path ပြန်ပြင်ထားတယ်
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from 'next/link';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // Detail view အတွက်

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) {
                // Firestore 'orders' collection ထဲက data ကို real-time ယူမယ်
                const q = query(collection(db, "orders"), where("email", "==", u.email));
                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    // ရက်စွဲအလိုက် စီမယ်
                    list.sort((a, b) => {
                        const dateA = a.orderDate ? new Date(a.orderDate) : 0;
                        const dateB = b.orderDate ? new Date(b.orderDate) : 0;
                        return dateB - dateA;
                    });
                    
                    setOrders(list);
                    if (selectedOrder) {
                        const updated = list.find(o => o.id === selectedOrder.id);
                        if (updated) setSelectedOrder(updated);
                    }
                    setLoading(false);
                });
                return () => unsubscribeOrders();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [selectedOrder?.id]);

    // UI အတွက် Status အရောင်သတ်မှတ်ချက်
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { bg: '#FFF9E6', color: '#FFB800', step: 1 };
            case 'Cooking': return { bg: '#E6F7FF', color: '#1890FF', step: 2 };
            case 'Ready': return { bg: '#F6FFED', color: '#52C41A', step: 3 };
            default: return { bg: '#F5F5F5', color: '#8C8C8C', step: 1 };
        }
    };

    if (loading) return <div style={{textAlign:'center', padding:'100px', color:'#007AFF'}}>Loading...</div>;

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                <Link href="/customer_menu" style={{ color: '#007AFF', fontSize: '20px', marginRight: '15px' }}>
                    <i className="fas fa-chevron-left"></i>
                </Link>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>My Orders</h2>
            </div>

            {!selectedOrder ? (
                /* --- Order List (ပုံစံသစ်) --- */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>မှာယူထားသော မှတ်တမ်းမရှိသေးပါ</div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ background: '#fff', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#bbb', fontSize: '13px', fontWeight: 'bold' }}>ID: {order.orderId || order.id.substring(0,8).toUpperCase()}</span>
                                    <span style={{ color: '#bbb', fontSize: '13px' }}>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : ''}</span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                                    {order.items?.[0]?.name} {order.items?.length > 1 ? `(+${order.items.length - 1} more)` : ''}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{(order.totalPrice || 0).toLocaleString()} Ks</span>
                                    <span style={{ padding: '6px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', backgroundColor: getStatusStyle(order.status).bg, color: getStatusStyle(order.status).color }}>
                                        {order.status || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* --- Order Detail View (Tracking UI) --- */
                <div style={{ background: '#fff', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h4 style={{ color: '#999', marginBottom: '10px' }}>Order Placed</h4>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: '#007AFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                            <div style={{ width: '60px', height: '3px', background: getStatusStyle(selectedOrder.status).step >= 2 ? '#007AFF' : '#eee' }}></div>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: getStatusStyle(selectedOrder.status).step >= 2 ? '#007AFF' : '#fff', border: '2px solid #eee' }}></div>
                            <div style={{ width: '60px', height: '3px', background: getStatusStyle(selectedOrder.status).step >= 3 ? '#007AFF' : '#eee' }}></div>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: getStatusStyle(selectedOrder.status).step >= 3 ? '#007AFF' : '#fff', border: '2px solid #eee' }}></div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>ID: {selectedOrder.orderId || selectedOrder.id.substring(0,8).toUpperCase()}</div>
                            <div style={{ color: '#999', fontSize: '12px' }}>{selectedOrder.orderDate}</div>
                        </div>
                        <div style={{ color: '#007AFF', fontWeight: 'bold' }}>{selectedOrder.status === 'Ready' ? 'Ready for Pickup' : 'Processing'}</div>
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>Items</h4>
                        {selectedOrder.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>{item.name} x {item.qty}</span>
                                <span style={{ fontWeight: 'bold' }}>{(item.price * item.qty).toLocaleString()} Ks</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid #eee', marginTop: '15px', paddingTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Amount</span>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#007AFF' }}>{(selectedOrder.totalPrice || 0).toLocaleString()} Ks</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', background: '#f9f9f9', padding: '10px', borderRadius: '10px' }}>
                            <div>Name: {selectedOrder.name}</div>
                            <div>Phone: {selectedOrder.phone}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                        <button onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #eee', background: '#fff' }}>Back</button>
                        <a href={`tel:${selectedOrder.phone}`} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#007AFF', color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>Call Shop</a>
                    </div>
                </div>
            )}
        </div>
    );
                                        }
                
