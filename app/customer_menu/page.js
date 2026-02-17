"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db, auth } from "../../lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"; 
// ၁။ Style Constants တွေကို Function ရဲ့ အပြင်မှာ ထားပါ
const detailRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#1C1C1E' };
const footerBtnStyle = (bg, color) => ({ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: bg, color: color, fontWeight: 'bold', textAlign: 'center', textDecoration: 'none', fontSize: '15px', cursor: 'pointer' });

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
    const [user, setUser] = useState(null);
    const [alertMessage, setAlertMessage] = useState(""); 
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) setCustomerInfo(prev => ({ ...prev, name: u.displayName }));
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
    };

    const handleLogout = async () => { try { await signOut(auth); window.location.reload(); } catch (e) { console.error(e); } };

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
        if (!user) return;
        setCart(prev => {
            const existing = prev.find(c => c.id === item.id);
            if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
            let price = typeof item.price === "string" ? parseInt(item.price.replace(/,/g, "")) || 0 : Number(item.price) || 0;
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
        if (val === "") {
            setCart(prev => prev.map(c => c.id === id ? { ...c, qty: "" } : c));
            return;
        }
        const newQty = parseInt(val);
        if (newQty >= 0) {
            setCart(prev => prev.map(c => c.id === id ? { ...c, qty: newQty } : c));
        }
    };

    const handleQtyBlur = (id, val) => {
        if (val === "" || parseInt(val) <= 0) {
            deleteItem(id);
        }
    };

    const deleteItem = (id) => setCart(prev => prev.filter(c => c.id !== id));
    const cartQty = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    const cartTotal = cart.reduce((s, i) => s + ((Number(i.qty) || 0) * i.price), 0);

    const handleOrder = async () => {
        if (!customerInfo.name || !customerInfo.phone) { setAlertMessage("အမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပေးပါ"); setShowAlert(true); return; }
        setIsProcessing(true);
        const orderDetails = { 
            ...customerInfo, 
            email: user.email, 
            items: cart, 
            totalPrice: cartTotal, 
            status: "Pending", 
            orderDate: new Date().toISOString(), 
            orderId: "ORD-" + Date.now().toString().slice(-6) 
        };
        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderDetails) });
            if (res.ok) { setOrderSuccess(orderDetails); setCart([]); setShowCart(false); }
        } catch (e) { console.error(e); }
        setIsProcessing(false);
    };

    return (
        <div style={{ background: '#F2F2F7', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            <style jsx global>{`
                .sticky-header { position: fixed; top: 0; left: 0; right: 0; background: white; z-index: 1000; padding: 10px 15px; border-bottom: 1px solid #E5E5EA; }
                .category-bar { display: flex; gap: 8px; overflow-x: auto; padding: 10px 0; scrollbar-width: none; }
                .cat-btn { padding: 6px 15px; border-radius: 15px; background: #F2F2F7; color: #8E8E93; font-size: 13px; font-weight: 600; white-space: nowrap; cursor: pointer; border: none; }
                .cat-btn.active { background: #007AFF; color: white; }
                .content-area { padding: 155px 15px 100px 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .menu-card { background: white; border-radius: 15px; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .cart-bar { position: fixed; bottom: 20px; left: 15px; right: 15px; background: #1C1C1E; padding: 15px; border-radius: 15px; color: white; display: flex; justify-content: space-between; align-items: center; z-index: 999; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: flex-end; }
                .cart-modal { background: white; width: 100%; border-top-left-radius: 25px; border-top-right-radius: 25px; padding: 20px; max-height: 90vh; overflow-y: auto; box-sizing: border-box; }
                .qty-input { width: 40px; border: 1px solid #DDD; text-align: center; border-radius: 5px; padding: 3px; font-size: 14px; }
                .form-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #DDD; margin-bottom: 10px; box-sizing: border-box; font-size: 14px; }
            `}</style>

            {/* Fixed Header */}
            <div className="sticky-header">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <Link href="/" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold', fontSize: '14px' }}>
            <i className="fas fa-arrow-left"></i> Back
        </Link>
        <div style={{ fontWeight: '800', fontSize: '16px' }}>YNS Kitchen</div>
        {user ? <img src={user.photoURL} onClick={handleLogout} style={{ width: '28px', borderRadius: '50%' }} /> : <i className="fas fa-user-circle" onClick={handleLogin} style={{ fontSize: '24px', color: '#CCC' }}></i>}
    </div>
    
    {/* Search Input */}
    <div style={{ position: 'relative', marginBottom: '10px' }}>
        <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#AEAEB2', fontSize: '12px' }}></i>
        <input type="text" placeholder="Search food..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '12px', border: 'none', background: '#F2F2F7', boxSizing: 'border-box', outline: 'none', fontSize: '14px' }} />
    </div>

    {/* Category Bar (ဘေးဆွဲလို့ရအောင် ပြင်ထားသည်) */}
    <div className="category-bar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        {categories.map(cat => (
            <button key={cat} className={`cat-btn ${activeCat === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{cat}</button>
        ))}
    </div>
</div>


            {/* Menu Grid */}
            <div className="content-area">
                {filteredMenu.map(item => (
                    <div key={item.id} className="menu-card">
                        <img src={item.image} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '10px' }} />
                        <div style={{ fontSize: '14px', fontWeight: 'bold', margin: '8px 0', height: '34px', overflow: 'hidden' }}>{item.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#007AFF', fontWeight: 'bold' }}>{Number(item.price).toLocaleString()}K</span>
                            <button 
                                onClick={() => addToCart(item)} 
                                disabled={!user}
                                style={{ background: user ? '#007AFF' : '#CCC', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '5px' }}
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Bar */}
            {cartQty > 0 && (
                <div className="cart-bar" onClick={() => setShowCart(true)}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ background: '#007AFF', padding: '2px 8px', borderRadius: '5px' }}>{cartQty}</span>
                        <b>{cartTotal.toLocaleString()} Ks</b>
                    </div>
                    <span>View Cart <i className="fas fa-shopping-cart"></i></span>
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div className="modal-overlay">
                    <div className="cart-modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>My Selection</h3>
                            <i className="fas fa-times" onClick={() => setShowCart(false)}></i>
                        </div>
                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center', borderBottom: '1px solid #F2F2F7', paddingBottom: '10px' }}>
                                <img src={item.image} style={{ width: '40px', height: '40px', borderRadius: '5px' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.name}</div>
                                    <div style={{ fontSize: '12px', color: '#007AFF' }}>{item.price.toLocaleString()} Ks</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <button onClick={() => removeFromCart(item.id)} style={{ border: 'none', background: '#F2F2F7', width: '25px', height: '25px' }}>-</button>
                                    <input 
                                        type="number" 
                                        className="qty-input" 
                                        value={item.qty} 
                                        onChange={(e) => updateQty(item.id, e.target.value)}
                                        onBlur={(e) => handleQtyBlur(item.id, e.target.value)}
                                    />
                                    <button onClick={() => addToCart(item)} style={{ border: 'none', background: '#F2F2F7', width: '25px', height: '25px' }}>+</button>
                                </div>
                                <i className="fas fa-trash" onClick={() => deleteItem(item.id)} style={{ color: '#FF3B30', padding: '5px' }}></i>
                            </div>
                        ))}
                        <div style={{ marginTop: '20px', background: '#F9F9F9', padding: '15px', borderRadius: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '10px' }}>
                                <span>Total:</span>
                                <span style={{ color: '#007AFF' }}>{cartTotal.toLocaleString()} Ks</span>
                            </div>
                            <input className="form-input" placeholder="Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                            <input className="form-input" placeholder="Phone" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="date" className="form-input" value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} />
                                <input type="time" className="form-input" value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} />
                            </div>
                            <textarea className="form-input" placeholder="Note (Special request...)" value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} />
                            <button onClick={handleOrder} disabled={isProcessing} style={{ width: '100%', padding: '15px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
                                {isProcessing ? "Sending..." : "Confirm Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ၂။ Success Voucher Section */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 5000, overflowY: 'auto', padding: '20px' }}>
                    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                        {/* Header Area */}
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{ background: '#34C759', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                <i className="fas fa-check" style={{ color: 'white', fontSize: '30px' }}></i>
                            </div>
                            <h2 style={{ margin: 0, fontWeight: '900' }}>ORDER SUCCESS</h2>
                            <p style={{ color: '#8E8E93', fontSize: '13px' }}>Thank you for your order!</p>
                        </div>

                        {/* Customer Details Section */}
                        <div style={{ borderBottom: '1px dashed #E5E5EA', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div style={detailRowStyle}><span>Order ID:</span> <b>{orderSuccess.orderId}</b></div>
                            <div style={detailRowStyle}><span>Customer:</span> <b>{orderSuccess.name}</b></div>
                            <div style={detailRowStyle}><span>Phone:</span> <b>{orderSuccess.phone}</b></div>
                            <div style={detailRowStyle}><span>Order Time:</span> <b>{new Date().toLocaleTimeString()}</b></div>
                            <div style={detailRowStyle}><span>Pick up Date:</span> <b>{orderSuccess.date}</b></div>
                            <div style={detailRowStyle}><span>Pick up Time:</span> <b>{orderSuccess.time}</b></div>
                            {orderSuccess.note && (
                                <div style={{ ...detailRowStyle, alignItems: 'flex-start' }}>
                                    <span>Note:</span> 
                                    <b style={{ textAlign: 'right', flex: 1, marginLeft: '20px' }}>{orderSuccess.note}</b>
                                </div>
                            )}
                        </div>

                        {/* Items Table Section */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', borderBottom: '2px solid #F2F2F7', paddingBottom: '8px', fontSize: '11px', fontWeight: 'bold', color: '#8E8E93', letterSpacing: '0.5px' }}>
                                <span style={{ flex: 2 }}>ITEM NAME</span>
                                <span style={{ flex: 1, textAlign: 'center' }}>QTY</span>
                                <span style={{ flex: 1, textAlign: 'right' }}>PRICE</span>
                            </div>
                            {orderSuccess.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', padding: '12px 0', borderBottom: '1px solid #F2F2F7', fontSize: '14px', alignItems: 'center' }}>
                                    <span style={{ flex: 2, fontWeight: '600', color: '#1C1C1E' }}>{it.name}</span>
                                    <span style={{ flex: 1, textAlign: 'center', color: '#8E8E93' }}>{it.qty}</span>
                                    <span style={{ flex: 1, textAlign: 'right', fontWeight: '800' }}>{(it.price * it.qty).toLocaleString()}K</span>
                                </div>
                            ))}
                        </div>

                        {/* Total Section */}
                        <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: '#1C1C1E' }}>TOTAL AMOUNT</span>
                                <span style={{ color: '#007AFF' }}>{orderSuccess.totalPrice.toLocaleString()} Ks</span>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div style={{ display: 'flex', gap: '15px', paddingBottom: '30px' }}>
                            <Link href="/history" style={footerBtnStyle('#F2F2F7', '#1C1C1E')}>History</Link>
                            <button onClick={() => setOrderSuccess(null)} style={footerBtnStyle('#007AFF', '#fff')}>Order More</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
