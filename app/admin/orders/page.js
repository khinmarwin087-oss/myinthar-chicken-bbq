"use client";
import { useEffect, useState } from 'react';
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, updateDoc, doc, query } from "firebase/firestore";
import Link from 'next/link';

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('New'); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // query ထဲမှာ orderBy မသုံးဘဲ client side sorting သုံးခြင်းက Index error ကင်းဝေးစေပါတယ်
        const q = query(collection(db, "orders"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orderList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // အသစ်ဆုံးကို အပေါ်ကပြဖို့ createdAt သို့မဟုတ် orderDate နဲ့ sort လုပ်ပါ
            orderList.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.orderDate);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.orderDate);
                return dateB - dateA;
            });

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

    // Filter logic ကို Screenshot ထဲက data နဲ့ ကိုက်အောင် ပြင်ထားပါတယ်
    const filteredOrders = orders.filter(order => {
        const status = order.status?.toLowerCase();
        if (activeTab === 'New') {
            // Firestore ထဲမှာ 'pending' လို့ ရှိနေတာကြောင့် နှစ်မျိုးလုံးကို ခွင့်ပြုပေးလိုက်ပါမယ်
            return status === 'new' || status === 'pending' || !status;
        }
        return status === activeTab.toLowerCase();
    });

    if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading Orders...</div>;

    return (
        <div style={{ background: '#F4F7FE', minHeight: '100vh', padding: '15px' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
                <Link href="/admin" style={{ position: 'absolute', left: 0, textDecoration: 'none', color: '#007AFF', fontWeight: 'bold' }}>
                    <i className="fas fa-chevron-left"></i> Admin
                </Link>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>Orders</h2>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#E0E0E0', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
                {['New', 'Cooking', 'Ready'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                        background: activeTab === tab ? '#fff' : 'transparent',
                        fontWeight: 'bold', color: activeTab === tab ? '#000' : '#666', transition: '0.3s'
                    }}>{tab}</button>
                ))}
            </div>

            {/* Order Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredOrders.length === 0 ? (
                    <div style={{textAlign:'center', color:'#999', marginTop: '50px', fontSize: '16px'}}>အော်ဒါမရှိသေးပါ</div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#999', marginBottom: '10px'}}>
                                <span>ID: {order.orderId || order.id.substring(0,6)}</span>
                                <span>{order.orderDate || 'No Date'}</span>
                            </div>
                            <div style={{fontSize:'19px', fontWeight:'bold', marginBottom:'5px'}}>{order.name}</div>
                            <div style={{color:'#007AFF', marginBottom:'15px', display:'flex', alignItems:'center', gap: '5px'}}>
                                <i className="fas fa-phone-alt"></i> {order.phone}
                            </div>
                            
                            <div style={{background:'#F8F9FA', padding:'15px', borderRadius:'15px'}}>
                                {order.items?.map((item, i) => (
                                    <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'14px', marginBottom:'8px'}}>
                                        <span>{item.name} <span style={{color:'#999'}}>x{item.qty}</span></span>
                                        <span style={{fontWeight:'500'}}>{(item.price * item.qty).toLocaleString()} Ks</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'20px'}}>
                                <div style={{fontWeight:'bold', fontSize:'20px', color: '#1A1A1A'}}>{(order.totalPrice || 0).toLocaleString()} Ks</div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    {(activeTab === 'New') && (
                                        <button 
                                            onClick={() => updateStatus(order.id, 'Cooking')}
                                            style={{background:'#007AFF', color:'#fff', border:'none', padding:'10px 22px', borderRadius:'12px', fontWeight:'bold'}}
                                        >
                                            Accept
                                        </button>
                                    )}
                                    {activeTab === 'Cooking' && (
                                        <button 
                                            onClick={() => updateStatus(order.id, 'Ready')}
                                            style={{background:'#34C759', color:'#fff', border:'none', padding:'10px 22px', borderRadius:'12px', fontWeight:'bold'}}
                                        >
                                            Ready
                                        </button>
                                    )}
                                </div>
                            </div>
                            {order.note && <div style={{marginTop: '15px', fontSize: '13px', color: '#666', fontStyle: 'italic'}}>Note: {order.note}</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
                    }
                                        
