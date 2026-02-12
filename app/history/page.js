"use client";
import { useEffect, useState } from 'react';
import { db, auth } from "../../lib/firebase"; // လမ်းကြောင်းမှန်ပါတယ်
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from 'next/link';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // loading state ထည့်လိုက်တယ်

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) {
                // User ရဲ့ Email နဲ့ တိုက်စစ်ပြီး Query လုပ်ခြင်း
                const q = query(collection(db, "orders"), where("email", "==", u.email));
                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    // Sorting Logic ကို Error မတက်အောင် ပိုစိပ်စိပ်စစ်ထားတယ်
                    list.sort((a, b) => {
                        const dateA = a.orderDate ? new Date(a.orderDate) : 0;
                        const dateB = b.orderDate ? new Date(b.orderDate) : 0;
                        return dateB - dateA;
                    });
                    
                    setOrders(list);
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
    }, []);

    if (loading) return <div style={{textAlign:'center', padding:'100px', color:'#007AFF'}}>Loading...</div>;

    return (
        <div style={{ background: '#F8FAFF', minHeight: '100vh', padding: '20px' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold', fontSize: '14px' }}>
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>My Orders</h2>
                {user ? (
                    <img src={user.photoURL} style={{ width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #007AFF' }} alt="profile" />
                ) : (
                    <div style={{ width: '35px' }}></div>
                )}
            </div>

            {/* Orders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {!user ? (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                        <p style={{color:'#666'}}>မှတ်တမ်းကြည့်ရန် Login အရင်ဝင်ပေးပါ</p>
                        <Link href="/customer_menu" style={{color:'#007AFF', fontWeight:'bold'}}>Menu သို့သွားရန်</Link>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>မှာယူထားသော မှတ်တမ်းမရှိသေးပါ</div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} style={{ 
                            background: '#fff', borderRadius: '18px', padding: '18px', 
                            boxShadow: '0 8px 20px rgba(0,0,0,0.04)', border: '1px solid #EBF2FF' 
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold' }}>{order.orderId || order.id.substring(0,8).toUpperCase()}</span>
                                <span style={{ 
                                    fontSize: '10px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold',
                                    background: order.status === 'Ready' ? '#E8F9EE' : '#EBF2FF',
                                    color: order.status === 'Ready' ? '#34C759' : '#007AFF'
                                }}>
                                    {order.status || 'New'}
                                </span>
                            </div>

                            <div style={{ marginBottom: '12px' }}>
                                {order.items?.map((item, idx) => (
                                    <div key={idx} style={{ fontSize: '14px', color: '#444', marginBottom: '4px' }}>
                                        • {item.name} <span style={{color:'#999', fontSize:'12px'}}>x{item.qty}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F8F9FA', paddingTop: '12px' }}>
                                <div style={{ color: '#007AFF', fontWeight: '800', fontSize: '18px' }}>
                                    {(order.totalPrice || 0).toLocaleString()} <span style={{fontSize:'12px'}}>Ks</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#bbb' }}>
                                    {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ''}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
                                    }
                    
