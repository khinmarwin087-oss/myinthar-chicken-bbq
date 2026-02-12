"use client";
import { useEffect, useState } from 'react';
import { db, auth } from "../../lib/firebase"; // Path ကို သေချာပြန်စစ်ပေးပါ
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from 'next/link';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) {
                const q = query(collection(db, "orders"), where("email", "==", u.email));
                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    list.sort((a, b) => {
                        const dateA = a.orderDate ? new Date(a.orderDate) : 0;
                        const dateB = b.orderDate ? new Date(b.orderDate) : 0;
                        return dateB - dateA;
                    });
                    
                    setOrders(list);
                    // Detail ကြည့်နေတုန်း Status ပြောင်းရင် ချက်ချင်းသိအောင်လုပ်ခြင်း
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

    // Status အလိုက် အဆင့်ဆင့် အမှန်ခြစ်ပြရန် Logic
    const getStatusInfo = (status) => {
        switch (status) {
            case 'Pending': return { bg: '#FFF9E6', color: '#FFB800', step: 1, label: 'မှာယူမှုကို လက်ခံရရှိပါပြီ' };
            case 'Cooking': return { bg: '#E6F7FF', color: '#1890FF', step: 2, label: 'ချက်ပြုတ်နေပါသည်' };
            case 'Ready':   return { bg: '#F6FFED', color: '#52C41A', step: 3, label: 'အော်ဒါ အဆင်သင့်ဖြစ်ပါပြီ' };
            default:        return { bg: '#F5F5F5', color: '#8C8C8C', step: 1, label: 'စောင့်ဆိုင်းနေပါသည်' };
        }
    };

    if (loading) return <div style={{textAlign:'center', padding:'100px', color:'#007AFF'}}>ခဏစောင့်ပေးပါ...</div>;

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
                /* --- အော်ဒါစာရင်းကြည့်ရန် --- */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>မှာယူထားသော မှတ်တမ်းမရှိသေးပါ</div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ background: '#fff', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1px solid #EBF2FF' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#bbb', fontSize: '12px', fontWeight: 'bold' }}>ID: {order.orderId || order.id.substring(0,8).toUpperCase()}</span>
                                    <span style={{ color: '#bbb', fontSize: '12px' }}>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : ''}</span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
                                    {order.items?.[0]?.name} {order.items?.length > 1 ? `(+${order.items.length - 1} more)` : ''}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1A1A1A' }}>{(order.totalPrice || 0).toLocaleString()} Ks</span>
                                    <span style={{ 
                                        padding: '6px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold',
                                        backgroundColor: getStatusInfo(order.status).bg, color: getStatusInfo(order.status).color 
                                    }}>
                                        {order.status || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* --- အော်ဒါအသေးစိတ်နှင့် Tracking (ပုံထဲကအတိုင်း) --- */
                <div style={{ background: '#fff', borderRadius: '25px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Order {selectedOrder.status === 'Ready' ? 'Completed' : 'Placed'}</h3>
                        
                        {/* Progress Bar with Checkmarks */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            {/* Step 1: Placed */}
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#007AFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>✓</div>
                            
                            {/* Line 1-2 */}
                            <div style={{ width: '60px', height: '3px', background: getStatusInfo(selectedOrder.status).step >= 2 ? '#007AFF' : '#eee', margin: '0 -2px' }}></div>
                            
                            {/* Step 2: Cooking */}
                            <div style={{ 
                                width: '30px', height: '30px', borderRadius: '50%', 
                                background: getStatusInfo(selectedOrder.status).step >= 2 ? '#007AFF' : '#fff', 
                                color: getStatusInfo(selectedOrder.status).step >= 2 ? '#fff' : '#ccc',
                                border: '2px solid', borderColor: getStatusInfo(selectedOrder.status).step >= 2 ? '#007AFF' : '#eee',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 
                            }}>
                                {getStatusInfo(selectedOrder.status).step >= 2 ? '✓' : '2'}
                            </div>

                            {/* Line 2-3 */}
                            <div style={{ width: '60px', height: '3px', background: getStatusInfo(selectedOrder.status).step >= 3 ? '#007AFF' : '#eee', margin: '0 -2px' }}></div>

                            {/* Step 3: Ready */}
                            <div style={{ 
                                width: '30px', height: '30px', borderRadius: '50%', 
                                background: getStatusInfo(selectedOrder.status).step >= 3 ? '#007AFF' : '#fff', 
                                color: getStatusInfo(selectedOrder.status).step >= 3 ? '#fff' : '#ccc',
                                border: '2px solid', borderColor: getStatusInfo(selectedOrder.status).step >= 3 ? '#007AFF' : '#eee',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 
                            }}>
                                {getStatusInfo(selectedOrder.status).step >= 3 ? '✓' : '3'}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid #F5F5F5', paddingBottom: '15px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>ID: {selectedOrder.orderId || selectedOrder.id.substring(0,8).toUpperCase()}</div>
                            <div style={{ color: '#999', fontSize: '12px' }}>{selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : ''}</div>
                        </div>
                        <div style={{ color: '#007AFF', fontWeight: 'bold', fontSize: '14px' }}>{getStatusInfo(selectedOrder.status).label}</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>Items</h4>
                        {selectedOrder.items?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                                <span style={{ color: '#555' }}>{item.name} x {item.qty}</span>
                                <span style={{ fontWeight: 'bold' }}>{(item.price * item.qty).toLocaleString()} Ks</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '2px dashed #EEE', marginTop: '20px', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Amount</span>
                            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#007AFF' }}>{(selectedOrder.totalPrice || 0).toLocaleString()} Ks</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', background: '#F9FAFB', padding: '15px', borderRadius: '15px', lineHeight: '1.6' }}>
                            <div><i className="fas fa-user" style={{width: '20px'}}></i> Name: {selectedOrder.name}</div>
                            <div><i className="fas fa-phone" style={{width: '20px'}}></i> Phone: {selectedOrder.phone}</div>
                            {selectedOrder.note && <div style={{marginTop: '5px'}}><i className="fas fa-sticky-note" style={{width: '20px'}}></i> Note: {selectedOrder.note}</div>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                        <button onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '16px', borderRadius: '15px', border: '1px solid #EEE', background: '#FFF', fontWeight: 'bold', color: '#666' }}>Back</button>
                        <a href={`tel:${selectedOrder.phone}`} style={{ flex: 1.5, padding: '16px', borderRadius: '15px', background: '#007AFF', color: '#FFF', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,122,255,0.2)' }}>Call Shop</a>
                    </div>
                </div>
            )}
        </div>
    );
                                                                                                               }
