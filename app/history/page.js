"use client";
import { useEffect, useState } from 'react';
import { db, auth } from "../../lib/firebase"; 
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
                    list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
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

    // PDF/Voucher Download Function
    const handleDownloadVoucher = () => {
        window.print(); // Browser ရဲ့ Print Dialog ကို ခေါ်သုံးခြင်း (Save as PDF ရသည်)
    };

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
        <div style={{ background: '#FDFDFD', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            {/* Print သီးသန့် Style */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; }
                    #voucher-content, #voucher-content * { visibility: visible; }
                    #voucher-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                    .no-print { display: none !important; }
                }
            `}} />

            {/* Header */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#fff', borderBottom: '1px solid #eee' }}>
                <button 
                    onClick={() => selectedOrder ? setSelectedOrder(null) : window.location.href='/customer_menu'} 
                    style={{ border: 'none', background: 'none', color: '#007AFF', fontSize: '20px' }}
                >
                    <i className="fas fa-chevron-left"></i>
                </button>
                <h2 style={{ margin: '0 auto 0 15px', fontSize: '18px', fontWeight: 'bold' }}>My Orders</h2>
            </div>

            {!selectedOrder ? (
                /* --- Compact Order List --- */
                <div className="no-print" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>မှတ်တမ်းမရှိသေးပါ</div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} onClick={() => setSelectedOrder(order)} style={{ background: '#fff', borderRadius: '12px', padding: '12px 15px', border: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#bbb', fontSize: '11px', fontWeight: 'bold' }}>ID: {order.orderId || order.id.substring(0,8).toUpperCase()}</span>
                                    <span style={{ color: '#bbb', fontSize: '11px' }}>{order.orderDate}</span>
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                                    {order.items?.[0]?.name} {order.items?.length > 1 ? `(+${order.items.length - 1} more)` : ''}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{(order.totalPrice || 0).toLocaleString()} Ks</span>
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', backgroundColor: getStatusInfo(order.status).bg, color: getStatusInfo(order.status).color }}>
                                        {order.status || 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* --- Detail View & Voucher Content --- */
                <div id="voucher-content" style={{ background: '#fff', minHeight: '100vh', padding: '20px' }}>
                    <div className="no-print" style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Order Tracking</h4>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: '#007AFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div>
                            <div style={{ width: '50px', height: '2px', background: getStatusInfo(selectedOrder.status).step >= 2 ? '#007AFF' : '#eee' }}></div>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: getStatusInfo(selectedOrder.status).step >= 2 ? '#007AFF' : '#fff', color: getStatusInfo(selectedOrder.status).step >= 2 ? '#fff' : '#ccc', border: '2px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{getStatusInfo(selectedOrder.status).step >= 2 ? '✓' : '2'}</div>
                            <div style={{ width: '50px', height: '2px', background: getStatusInfo(selectedOrder.status).step >= 3 ? '#007AFF' : '#eee' }}></div>
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', background: getStatusInfo(selectedOrder.status).step >= 3 ? '#007AFF' : '#fff', color: getStatusInfo(selectedOrder.status).step >= 3 ? '#fff' : '#ccc', border: '2px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{getStatusInfo(selectedOrder.status).step >= 3 ? '✓' : '3'}</div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, color: '#007AFF' }}>YNS Kitchen</h2>
                        <p style={{ fontSize: '12px', color: '#666' }}>ကျေးဇူးတင်ပါသည်၊ နောက်လည်း အားပေးပါဦး</p>
                    </div>

                    <div style={{ marginBottom: '20px', borderBottom: '1px solid #f5f5f5', paddingBottom: '15px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>ID: {selectedOrder.orderId || selectedOrder.id.substring(0,8).toUpperCase()}</div>
                        <div style={{ color: '#007AFF', fontSize: '13px', fontWeight: 'bold' }}>{getStatusInfo(selectedOrder.status).label}</div>
                        <div style={{ color: '#999', fontSize: '11px', marginTop: '5px' }}>
                            Order Time: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt.toMillis()).toLocaleString() : selectedOrder.orderDate}
                        </div>
                    </div>

                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '8px 0' }}>Item Name</th>
                                <th style={{ padding: '8px 0', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '8px 0', textAlign: 'right' }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder.items?.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #fafafa' }}>
                                    <td style={{ padding: '10px 0' }}>{item.name}</td>
                                    <td style={{ padding: '10px 0', textAlign: 'center' }}>x{item.qty}</td>
                                    <td style={{ padding: '10px 0', textAlign: 'right' }}>{(item.price * item.qty).toLocaleString()} Ks</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #eee', paddingTop: '15px' }}>
                        <span style={{ fontWeight: 'bold' }}>Total Amount</span>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#007AFF' }}>{(selectedOrder.totalPrice || 0).toLocaleString()} Ks</span>
                    </div>

                    {/* Customer Info Box */}
<div style={{ marginTop: '20px', background: '#F9FAFB', padding: '15px', borderRadius: '12px', fontSize: '12px' }}>
    <div style={{ marginBottom: '5px' }}>
        <strong>Customer:</strong> {selectedOrder.name}
    </div>
    <div style={{ marginBottom: '5px' }}>
        <strong>Phone:</strong> {selectedOrder.phone}
    </div>
    
    {/* Database ထဲက field နာမည်အတိုင်း date နဲ့ time ကို သုံးထားပါတယ် */}
    {selectedOrder.date && (
        <div style={{ marginTop: '5px' }}>
            <strong>Pick-up Date:</strong> {selectedOrder.date}
        </div>
    )}
    {selectedOrder.time && (
        <div style={{ marginTop: '5px' }}>
            <strong>Pick-up Time:</strong> {selectedOrder.time}
        </div>
    )}

    {/* Note ရှိမှသာ ပြသမည် */}
    {selectedOrder.note && (
        <div style={{ marginTop: '5px' }}>
            <strong>Note:</strong> {selectedOrder.note}
        </div>
    )}
</div>
                

                    {/* Action Buttons (Hide when printing) */}
                    <div className="no-print" style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDownloadVoucher} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #007AFF', background: '#fff', color: '#007AFF', fontWeight: 'bold' }}>
                                <i className="fas fa-download"></i> Voucher
                            </button>
                            <Link href="/customer_menu" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #eee', background: '#f5f5f5', color: '#333', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>
                                <i className="fas fa-home"></i> Home
                            </Link>
                        </div>
                        <a href={`tel:${selectedOrder.phone}`} style={{ padding: '14px', borderRadius: '10px', background: '#007AFF', color: '#fff', textAlign: 'center', textDecoration: 'none', fontWeight: 'bold' }}>
                            Call Shop
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
                        }
                                    
