"use client";
import { useEffect, useState } from 'react';
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import Link from 'next/link';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) {
                // Real-time listen လုပ်ဖို့ onSnapshot ကို သုံးထားပါတယ်
                const q = query(
                    collection(db, "orders"),
                    where("email", "==", u.email),
                    orderBy("orderDate", "desc")
                );

                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setOrders(data);
                    
                    // အကယ်၍ Detail View ဖွင့်ထားရင် status ပြောင်းတာနဲ့ ချက်ချင်းသိအောင် update လုပ်ပေးပါတယ်
                    if (selectedOrder) {
                        const updatedSelected = data.find(o => o.id === selectedOrder.id);
                        if (updatedSelected) setSelectedOrder(updatedSelected);
                    }
                    
                    setLoading(false);
                }, (error) => {
                    console.error("Firestore Error:", error);
                    setLoading(false);
                });

                return () => unsubscribeOrders();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, [selectedOrder?.id]); // selectedOrder id ပြောင်းရင် re-check လုပ်ဖို့

    // Status အလိုက် အရောင်သတ်မှတ်ချက်
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending': return { bg: '#FFF9E6', color: '#FFB800', progress: 1 };
            case 'Cooking': return { bg: '#E6F7FF', color: '#1890FF', progress: 2 };
            case 'Ready': return { bg: '#F6FFED', color: '#52C41A', progress: 3 };
            default: return { bg: '#F5F5F5', color: '#8C8C8C', progress: 1 };
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#007AFF' }}>ခဏစောင့်ပေးပါ...</div>;

    if (!user) return (
        <div style={{ textAlign: 'center', padding: '100px' }}>
            <p>အော်ဒါမှတ်တမ်းကြည့်ရန် Login အရင်ဝင်ပေးပါ</p>
            <Link href="/customer_menu" style={{ color: '#007AFF', fontWeight: 'bold' }}>Menu သို့သွားရန်</Link>
        </div>
    );

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                <Link href="/customer_menu" style={{ color: '#007AFF', textDecoration: 'none', fontSize: '20px', marginRight: '15px' }}>
                    <i className="fas fa-chevron-left"></i>
                </Link>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>My Orders</h2>
            </div>

            {/* Order List View */}
            {!selectedOrder ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {orders.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>မှာယူထားသော မှတ်တမ်းမရှိသေးပါ</p>
                    ) : (
                        orders.map(order => (
                            <div 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                style={{ background: '#fff', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #EBF2FF' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#bbb', fontSize: '13px', fontWeight: 'bold' }}>ID: {order.orderId || order.id.slice(0, 8).toUpperCase()}</span>
                                    <span style={{ color: '#bbb', fontSize: '13px' }}>{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''}</span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                                    {order.items?.[0]?.name} {order.items?.length > 1 ? `(+${order.items.length - 1} more)` : ''}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1A1A1A' }}>{(order.totalPrice || 0).toLocaleString()} Ks</span>
                                    <span style={{ 
                                        padding: '6px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
                                        backgroundColor: getStatusStyle(order.status).bg,
                                        color: getStatusStyle(order.status).color
                                    }}>
                                        {order.status || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Detail View (Tracking UI) */
                <div style={{ background: '#fff', borderRadius: '20px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Order Status</h3>
                        
                        {/* Status Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '10px' }}>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: '#007AFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 2 }}>
                                {getStatusStyle(selectedOrder.status).progress >= 1 ? '✓' : '1'}
                            </div>
                            <div style={{ width: '70px', height: '3px', background: getStatusStyle(selectedOrder.status).progress >= 2 ? '#007AFF' : '#eee', margin: '0 -2px' }}></div>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: getStatusStyle(selectedOrder.status).progress >= 2 ? '#007AFF' : '#fff', color: getStatusStyle(selectedOrder.status).progress >= 2 ? '#fff' : '#ccc', border: '2px solid', borderColor: getStatusStyle(selectedOrder.status).progress >= 2 ? '#007AFF' : '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 2 }}>
                                {getStatusStyle(selectedOrder.status).progress >= 2 ? '✓' : '2'}
                            </div>
                            <div style={{ width: '70px', height: '3px', background: getStatusStyle(selectedOrder.status).progress >= 3 ? '#007AFF' : '#eee', margin: '0 -2px' }}></div>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: getStatusStyle(selectedOrder.status).progress >= 3 ? '#007AFF' : '#fff', color: getStatusStyle(selectedOrder.status).progress >= 3 ? '#fff' : '#ccc', border: '2px solid', borderColor: getStatusStyle(selectedOrder.status).progress >= 3 ? '#007AFF' : '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', zIndex: 2 }}>
                                {getStatusStyle(selectedOrder.status).progress >= 3 ? '✓' : '3'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '230px', margin: '0 auto', fontSize: '10px', color: '#8E8E93', fontWeight: 'bold' }}>
                            <span>PLACED</span>
                            <span>COOKING</span>
                            <span>READY</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f5f5f5', paddingBottom: '15px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>ID: {selectedOrder.orderId}</div>
                            <div style={{ color: '#8E8E93', fontSize: '12px' }}>{new Date(selectedOrder.orderDate).toLocaleString()}</div>
                        </div>
                        <div style={{ color: getStatusStyle(selectedOrder.status).color, fontWeight: 'bold' }}>{selectedOrder.status}</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '15px' }}>Ordered Items</h4>
                        {selectedOrder.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#444' }}>
                                <span>{item.name} x {item.qty}</span>
                                <span style={{ fontWeight: 'bold' }}>{(item.price * item.qty).toLocaleString()} Ks</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '2px dashed #eee', paddingTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Amount</span>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#007AFF' }}>{(selectedOrder.totalPrice || 0).toLocaleString()} Ks</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', background: '#F9FAFF', padding: '15px', borderRadius: '12px', border: '1px solid #EBF2FF' }}>
                            <div style={{ marginBottom: '5px' }}><i className="fas fa-user" style={{ width: '20px' }}></i> {selectedOrder.name}</div>
                            <div style={{ marginBottom: '5px' }}><i className="fas fa-phone" style={{ width: '20px' }}></i> {selectedOrder.phone}</div>
                            {selectedOrder.note && <div><i className="fas fa-sticky-note" style={{ width: '20px' }}></i> {selectedOrder.note}</div>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                        <button onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', fontWeight: 'bold', color: '#666' }}>Back to List</button>
                        <a href={`tel:${selectedOrder.phone}`} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#007AFF', color: '#fff', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>Call Shop</a>
                    </div>
                </div>
            )}
        </div>
    );
                                }
                                        
