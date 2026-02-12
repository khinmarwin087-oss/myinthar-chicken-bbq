"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function CustomerMenu() {
    const [menuData, setMenuData] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [activeCat, setActiveCat] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', note: '', date: '', time: '' });
    const [loading, setLoading] = useState(true);
    const [orderSuccess, setOrderSuccess] = useState(null); 
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "menu"));
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMenuData(data);
                setFilteredMenu(data);
                const cats = new Set(['All']);
                data.forEach(item => { if (item.category) cats.add(item.category); });
                setCategories(Array.from(cats));
            } catch (error) { console.error("Error:", error); }
            setLoading(false);
        };
        fetchMenus();
    }, []);

    useEffect(() => {
        let results = menuData;
        if (activeCat !== 'All') results = results.filter(m => m.category === activeCat);
        if (searchTerm) results = results.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredMenu(results);
    }, [searchTerm, activeCat, menuData]);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(c => c.id === item.id);
            if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
            const price = typeof item.price === "string" ? parseInt(item.price.replace(/,/g, "")) : item.price || 0;
            return [...prev, { ...item, price, qty: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => {
            const existing = prev.find(c => c.id === id);
            if (existing?.qty > 1) return prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
            return prev.filter(c => c.id !== id);
        });
    };

    const updateQty = (id, val) => {
        const newQty = parseInt(val) || 0;
        if (newQty <= 0) return deleteItem(id);
        setCart(prev => prev.map(c => c.id === id ? { ...c, qty: newQty } : c));
    };

    const deleteItem = (id) => {
        setCart(prev => prev.filter(c => c.id !== id));
    };

    const cartQty = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + (i.qty * i.price), 0);

    const handleOrder = async () => {
        if (!customerInfo.name || !customerInfo.phone) return alert("နာမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပေးပါ");
        setIsProcessing(true);
        const orderDetails = { 
            ...customerInfo, 
            items: cart, 
            totalPrice: cartTotal, 
            orderDate: new Date().toLocaleString(),
            orderId: "ORD-" + Math.floor(1000 + Math.random() * 9000)
        };

        try {
            const res = await fetch('/api/orders', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderDetails) 
            });
            const data = await res.json();
            if (data.success) {
                setOrderSuccess({...orderDetails, id: data.id});
                setCart([]);
                setShowCart(false);
            }
        } catch (e) { alert("Error placing order"); }
        setIsProcessing(false);
    };

    if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Loading...</div>;

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Header */}
            <div style={{ background: '#fff', padding: '15px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #eee' }}>
                <Link href="/" style={{color:'#007AFF', textDecoration:'none', fontWeight:'bold', fontSize:'14px'}}>
                   <i className="fas fa-arrow-left"></i> Dashboard
                </Link>
                <div style={{position:'relative', marginTop:'15px'}}>
                    <i className="fas fa-search" style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'#999' }}></i>
                    <input 
                        type="text" placeholder="ဟင်းပွဲရှာရန်..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{width:'100%', padding:'12px 12px 12px 42px', borderRadius:'12px', border:'1px solid #eee', background:'#F8F9FA', boxSizing:'border-box', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Menu Grid */}
            <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', boxSizing: 'border-box' }}>
                {filteredMenu.map(item => (
                    <div key={item.id} style={{ background: '#fff', borderRadius: '15px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                        <div style={{position:'relative', width:'100%', height:'90px', borderRadius:'10px', overflow:'hidden'}}>
                            <Image src={item.image || 'https://via.placeholder.com/150'} fill style={{objectFit:'cover'}} alt={item.name} />
                        </div>
                        <div style={{fontWeight: 'bold', fontSize: '13px', margin: '8px 0', height:'35px', overflow:'hidden', lineHeight: '1.2'}}>{item.name}</div>
                        <div style={{color:'#007AFF', fontWeight:'bold', fontSize:'14px'}}>{(Number(item.price) || 0).toLocaleString()} Ks</div>
                        <button onClick={() => addToCart(item)} style={{ width: '100%', background: '#007AFF', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold' }}>Add +</button>
                    </div>
                ))}
            </div>

            {/* Floating Cart Button */}
            {cartQty > 0 && !showCart && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1A1A1A', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                    <div style={{color:'#fff'}}>
                        <div style={{fontWeight:'bold', fontSize: '16px'}}>{cartTotal.toLocaleString()} Ks</div>
                        <div style={{fontSize:'12px', color:'#aaa'}}>{cartQty} items</div>
                    </div>
                    <button onClick={() => setShowCart(true)} style={{ background: '#007AFF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>View Cart</button>
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ background: '#fff', width: '100%', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', padding: '20px', maxHeight: '95vh', overflowY: 'auto', boxSizing: 'border-box' }}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems: 'center'}}>
                            <h3 style={{margin:0}}>My Cart</h3>
                            <i className="fas fa-times" onClick={() => setShowCart(false)} style={{fontSize:'22px', padding: '5px'}}></i>
                        </div>

                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', borderBottom: '1px solid #f5f5f5', paddingBottom: '12px' }}>
                                <div style={{flex:1}}>
                                    <div style={{fontSize:'14px', fontWeight:'bold', marginBottom: '4px'}}>{item.name}</div>
                                    <div style={{fontSize:'13px', color: '#007AFF'}}>{(item.price).toLocaleString()} Ks</div>
                                </div>
                                
                                <div style={{display:'flex', alignItems:'center', background:'#f5f5f5', borderRadius:'8px', padding:'2px 5px'}}>
                                    <button onClick={() => removeFromCart(item.id)} style={{border:'none', background:'none', padding:'5px 8px', fontSize: '16px'}}>-</button>
                                    <input 
                                        type="number" 
                                        value={item.qty} 
                                        onChange={(e) => updateQty(item.id, e.target.value)}
                                        style={{width:'35px', textAlign:'center', border:'none', background:'none', fontWeight:'bold', fontSize:'14px'}} 
                                    />
                                    <button onClick={() => addToCart(item)} style={{border:'none', background:'none', padding:'5px 8px', fontSize: '16px'}}>+</button>
                                </div>

                                <i className="fas fa-trash-alt" onClick={() => deleteItem(item.id)} style={{color:'#FF3B30', padding: '5px', fontSize: '18px'}}></i>
                            </div>
                        ))}
                        
                        <div style={{marginTop:'25px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px', marginBottom:'20px'}}>
                                <span>Total Amount:</span>
                                <span style={{color:'#007AFF'}}>{cartTotal.toLocaleString()} Ks</span>
                            </div>

                            <label style={labelStyle}>နာမည်</label>
                            <input style={inputStyle} value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Customer Name" />
                            
                            <label style={labelStyle}>ဖုန်းနံပါတ်</label>
                            <input style={inputStyle} value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="09xxxxxxx" />

                            <div style={{display:'flex', gap:'15px', marginBottom:'10px'}}>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>ရက်စွဲ</label>
                                    <input type="date" style={inputStyle} value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>အချိန်</label>
                                    <input type="time" style={inputStyle} value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} />
                                </div>
                            </div>

                            <label style={labelStyle}>မှတ်ချက် (Special Note)</label>
                            <textarea style={{...inputStyle, height:'70px'}} value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} placeholder="Extra spicy, no onions, etc." />

                            <button onClick={handleOrder} disabled={isProcessing} style={{ width: '100%', background: '#34C759', color: '#fff', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                                {isProcessing ? "Processing..." : "Confirm Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Voucher Modal */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '360px', borderRadius: '20px', padding: '25px', textAlign: 'center', boxSizing: 'border-box' }}>
                        <i className="fas fa-check-circle" style={{color:'#34C759', fontSize:'50px', marginBottom:'15px'}}></i>
                        <h3 style={{margin:'0 0 10px 0'}}>Order Placed!</h3>
                        
                        <div style={{textAlign:'left', background:'#f9f9f9', padding:'15px', borderRadius:'12px', fontSize:'13px', lineHeight: '1.6'}}>
                            <div style={{borderBottom: '1px dashed #ddd', paddingBottom: '10px', marginBottom: '10px'}}>
                                <div><strong>ID:</strong> {orderSuccess.orderId}</div>
                                <div><strong>Name:</strong> {orderSuccess.name}</div>
                                <div><strong>Phone:</strong> {orderSuccess.phone}</div>
                                <div><strong>Date/Time:</strong> {orderSuccess.date} | {orderSuccess.time}</div>
                            </div>
                            {orderSuccess.items.map(item => (
                                <div key={item.id} style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                    <span>{item.name} x {item.qty}</span>
                                    <span>{(item.price * item.qty).toLocaleString()} Ks</span>
                                </div>
                            ))}
                            <div style={{borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px', display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'15px'}}>
                                <span>Total:</span>
                                <span>{orderSuccess.totalPrice.toLocaleString()} Ks</span>
                            </div>
                            {orderSuccess.note && <div style={{marginTop: '10px', fontSize: '11px', color: '#666'}}>Note: {orderSuccess.note}</div>}
                        </div>

                        <div style={{marginTop:'25px', display:'flex', gap:'10px'}}>
                            <button onClick={() => setOrderSuccess(null)} style={{flex:1, padding:'14px', borderRadius:'12px', border:'1px solid #ddd', background:'#fff', fontWeight:'bold'}}>Home</button>
                            <button onClick={() => window.print()} style={{flex:1, padding:'14px', borderRadius:'12px', border:'none', background:'#007AFF', color:'#fff', fontWeight:'bold'}}>Voucher</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8E8E93', marginBottom: '6px', marginTop: '12px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E5EA', fontSize: '15px', background: '#F9F9F9', boxSizing:'border-box', outline:'none' };
                
