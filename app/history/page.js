"use client";
import { useEffect, useState } from 'react';
import { db, auth } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from 'next/link';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // User ရှိမရှိ စစ်ဆေးခြင်း
        const unsubscribeAuth = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) {
                // User ရဲ့ Email နဲ့ မှာထားတဲ့ အော်ဒါတွေကိုပဲ ဆွဲထုတ်ခြင်း
                const q = query(collection(db, "orders"), where("email", "==", u.email));
                const unsubscribeOrders = onSnapshot(q, (snapshot) => {
                    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // ရက်စွဲအလိုက် စီခြင်း
                    list.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
                    setOrders(list);
                });
                return () => unsubscribeOrders();
            }
        });
        return () => unsubscribeAuth();
    }, []);

    return (
        <div style={{ background: '#F8FAFF', minHeight: '100vh', padding: '20px' }}>
            {/* Header with Google Profile */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold' }}>
                    <i className="fas fa-arrow-left"></i> Back
                </Link>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>My Orders</h2>
                {user && (
                    <img src={user.photoURL} style={{ width: '35px', borderRadius: '50%', border: '2px solid #007AFF' }} />
                )}
            </div>

            {/* Orders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>မှာယူထားသော မှတ်တမ်းမရှိသေးပါ</div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} style={{ 
                            background: '#fff', borderRadius: '18px', padding: '18px', 
                            boxShadow: '0 10px 25px rgba(0,122,255,0.08)', border: '1px solid #EBF2FF' 
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#999' }}>#{order.id.substring(0, 7).toUpperCase()}</span>
                                <span style={{ 
                                    fontSize: '11px', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold',
                                    background: order.status === 'Ready' ? '#E8F9EE' : '#EBF2FF',
                                    color: order.status === 'Ready' ? '#34C759' : '#007AFF'
                                }}>
                                    {order.status || 'Pending'}
                                </span>
                            </div>

                            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' }}>
                                {order.items?.map(i => i.name).join(', ')}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                                <span style={{ color: '#007AFF', fontWeight: '800', fontSize: '18px' }}>{order.totalPrice?.toLocaleString()} Ks</span>
                                <span style={{ fontSize: '12px', color: '#999' }}>{new Date(order.orderDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
                }
