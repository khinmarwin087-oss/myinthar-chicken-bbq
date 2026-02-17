"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db, auth } from "../../lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"; 

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
                .content-area { padding: 130px 15px 100px 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .menu-card { background: white; border-radius: 15px; padding: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .cart-bar { position: fixed; bottom: 20px; left: 15px; right: 15px; background: #1C1C1E; padding: 15px; border-radius: 15px; color: white; display: flex; justify-content: space-between; align-items: center; z-index: 999; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: flex-end; }
                .cart-modal { background: white; width: 100%; border-top-left-radius: 25px; border-top-right-radius: 25px; padding: 20px; max-height: 90vh; overflow-y: auto; box-sizing: border-box; }
                .qty-input { width: 40px; border: 1px solid #DDD; text-align: center; border-radius: 5px; padding: 3px; font-size: 14px; }
                .form-input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #DDD; margin-bottom: 10px; box-sizing: border-box; font-size: 14px; }
            `}</style>

            {/* Fixed Header */}
            <div className="sticky-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold' }}>
                        <i className="fas fa-arrow-left"></i> Back
                    </Link>
                    <div style={{ fontWeight: '800', fontSize: '18px' }}>YNS Kitchen</div>
                    {user ? (
                        <img src={user.photoURL} onClick={handleLogout} style={{ width: '30px', borderRadius: '50%' }} />
                    ) : (
                        <i className="fas fa-user-circle" onClick={handleLogin} style={{ fontSize: '24px', color: '#8E8E93' }}></i>
                    )}
                </div>
                <div className="category-bar">
                    {categories.map(cat => (
                        <button key={cat} className={`cat-btn ${activeCat === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)}>{cat}</button>
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

            {/* Success Voucher */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '20px', boxSizing: 'border-box' }}>
                        <div style={{ textAlign: 'center', color: '#34C759' }}>
                            <i className="fas fa-check-circle" style={{ fontSize: '50px' }}></i>
                            <h2 style={{ margin: '10px 0' }}>Order Success!</h2>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.8', borderTop: '1px dashed #DDD', paddingTop: '15px' }}>
                            <div><b>Order ID:</b> {orderSuccess.orderId}</div>
                            <div><b>Name:</b> {orderSuccess.name}</div>
                            <div><b>Phone:</b> {orderSuccess.phone}</div>
                            <div><b>Date/Time:</b> {orderSuccess.date} | {orderSuccess.time}</div>
                            {orderSuccess.note && <div><b>Note:</b> {orderSuccess.note}</div>}
                            <div style={{ borderTop: '1px solid #F2F2F7', margin: '10px 0' }}></div>
                            {orderSuccess.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{it.name} x {it.qty}</span>
                                    <span>{(it.price * it.qty).toLocaleString()} Ks</span>
                                </div>
                            ))}
                            <div style={{ borderTop: '2px solid #007AFF', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                                <span>Total Amount:</span>
                                <span style={{ color: '#007AFF' }}>{orderSuccess.totalPrice.toLocaleString()} Ks</span>
                            </div>
                        </div>
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#8E8E93', marginTop: '20px' }}>Thank you for choosing YNS Kitchen!</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <Link href="/history" style={{ flex: 1, padding: '12px', background: '#F2F2F7', textAlign: 'center', borderRadius: '10px', textDecoration: 'none', color: '#1C1C1E', fontWeight: 'bold' }}>History</Link>
                            <button onClick={() => setOrderSuccess(null)} style={{ flex: 1, padding: '12px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>Home</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
