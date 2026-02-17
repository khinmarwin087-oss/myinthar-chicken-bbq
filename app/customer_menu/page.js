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
            if (u) {
                setCustomerInfo(prev => ({ ...prev, name: u.displayName }));
            } else {
                setCustomerInfo({ name: '', phone: '', note: '', date: '', time: '' });
                setCart([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try { 
            await signInWithPopup(auth, provider); 
        } catch (e) { 
            console.error(e);
            setAlertMessage("Login ဝင်မရဖြစ်နေပါသည်");
            setShowAlert(true);
        }
    };

    const handleLogout = async () => {
        try { await signOut(auth); } catch (e) { console.error(e); }
    };

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
        if (!user) {
            setAlertMessage("ဟင်းပွဲမှာယူရန် အရင်ဆုံး Google ဖြင့် Login ဝင်ပေးပါ");
            setShowAlert(true);
            return;
        }
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
        const newQty = parseInt(val);
        if (isNaN(newQty) || newQty <= 0) {
            // value မရှိလျှင် သို့မဟုတ် 0 ဖြစ်လျှင် မပြောင်းလဲသေးဘဲ ထားမည် (သို့မဟုတ် delete လုပ်မည်)
            return; 
        }
        setCart(prev => prev.map(c => c.id === id ? { ...c, qty: newQty } : c));
    };

    const deleteItem = (id) => {
        setCart(prev => prev.filter(c => c.id !== id));
    };

    const cartQty = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + (i.qty * i.price), 0);

    const handleOrder = async () => {
        if (!user || cart.length === 0 || !customerInfo.name || !customerInfo.phone) {
            setAlertMessage("အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပေးပါ");
            setShowAlert(true);
            return;
        }
        setIsProcessing(true);
        const orderDetails = { ...customerInfo, email: user.email, items: cart, totalPrice: cartTotal, status: "New", orderDate: new Date().toISOString(), orderId: "ORD-" + Math.floor(1000 + Math.random() * 9000) };
        try {
            const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderDetails) });
            const data = await res.json();
            if (data.success) { setOrderSuccess({...orderDetails, id: data.id}); setCart([]); setShowCart(false); }
        } catch (e) { setAlertMessage("Error: " + e.message); setShowAlert(true); }
        setIsProcessing(false);
    };

    return (
        <div style={{ background: '#F2F2F7', minHeight: '100vh', width: '100%', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            <style jsx global>{`
                .category-item { padding: 8px 20px; border-radius: 20px; background: white; color: #8E8E93; font-weight: 600; cursor: pointer; transition: 0.3s; border: 1px solid transparent; }
                .category-item.active { background: #007AFF; color: white; }
                .menu-card { background: white; border-radius: 20px; padding: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
                .cart-bar { position: fixed; bottom: 20px; left: 15px; right: 15px; background: #1C1C1E; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; border-radius: 20px; color: white; cursor: pointer; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: flex-end; }
                .glass-modal { background: white; width: 100%; border-top-left-radius: 30px; border-top-right-radius: 30px; padding: 25px; max-height: 95vh; overflow-y: auto; }
                .qty-input { width: 45px; border: 1px solid #E5E5EA; text-align: center; border-radius: 8px; padding: 5px 0; font-weight: bold; font-size: 14px; -moz-appearance: textfield; }
                .qty-input::-webkit-outer-spin-button, .qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            `}</style>

            {/* Header, Search, Categories (ဒီအတိုင်းထားပါသည်) */}
            <div style={{ background: 'white', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{fontWeight:'800', fontSize:'20px'}}>YNS Kitchen Menu</div>
                    {user ? <img src={user.photoURL} onClick={handleLogout} style={{ width: '35px', borderRadius: '50%', cursor: 'pointer' }} /> : <button onClick={handleLogin} style={{ background: '#007AFF', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '15px' }}>Login</button>}
                </div>
                <input type="text" placeholder="Search food..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'12px', border:'none', background:'#F2F2F7', outline: 'none' }} />
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '10px', paddingBottom: '5px' }}>
                    {categories.map(cat => <div key={cat} className={`category-item ${activeCat === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)}>{cat}</div>)}
                </div>
            </div>

            {/* Menu Grid */}
            <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', paddingBottom: '100px' }}>
                {filteredMenu.map(item => (
                    <div key={item.id} className="menu-card">
                        <img src={item.image || 'https://via.placeholder.com/150'} style={{width: '100%', height: '110px', objectFit: 'cover', borderRadius:'15px'}} alt={item.name} />
                        <div style={{fontWeight: '700', fontSize: '14px', margin: '8px 0'}}>{item.name}</div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div style={{color:'#007AFF', fontWeight:'700'}}>{Number(item.price).toLocaleString()} Ks</div>
                            <button onClick={() => addToCart(item)} style={{ background: '#007AFF', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '8px' }}><i className="fas fa-plus"></i></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Cart Bar */}
            {cartQty > 0 && !showCart && (
                <div className="cart-bar" onClick={() => setShowCart(true)}>
                    <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                        <div style={{background:'#007AFF', padding:'8px 12px', borderRadius:'12px'}}>{cartQty}</div>
                        <div style={{fontWeight:'bold'}}>{cartTotal.toLocaleString()} Ks</div>
                    </div>
                    <div>View Cart <i className="fas fa-chevron-right" style={{marginLeft:'5px'}}></i></div>
                </div>
            )}

            {/* Cart Modal - UI Fixes */}
            {showCart && (
                <div className="modal-overlay">
                    <div className="glass-modal">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                            <h3 style={{margin:0}}>My Selection</h3>
                            <i className="fas fa-times" onClick={() => setShowCart(false)} style={{fontSize:'20px', color:'#8E8E93'}}></i>
                        </div>

                        {/* Cart Items List */}
                        <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '20px' }}>
                            {cart.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '12px', marginBottom: '15px', alignItems: 'center', background: '#F8F9FA', padding: '10px', borderRadius: '15px' }}>
                                    <img src={item.image || 'https://via.placeholder.com/150'} style={{width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover'}} alt="item" />
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:'14px', fontWeight:'700'}}>{item.name}</div>
                                        <div style={{fontSize:'13px', color: '#007AFF'}}>{item.price.toLocaleString()} Ks</div>
                                    </div>
                                    
                                    {/* +/- and Input Control */}
                                    <div style={{display:'flex', alignItems:'center', background:'white', borderRadius:'10px', padding:'3px', border:'1px solid #E5E5EA'}}>
                                        <button onClick={() => removeFromCart(item.id)} style={{border:'none', background:'none', padding:'0 8px', fontWeight:'bold'}}>-</button>
                                        <input 
                                            type="number" 
                                            className="qty-input"
                                            value={item.qty} 
                                            onChange={(e) => updateQty(item.id, e.target.value)}
                                            onBlur={(e) => { if(!e.target.value || e.target.value <= 0) deleteItem(item.id) }} 
                                        />
                                        <button onClick={() => addToCart(item)} style={{border:'none', background:'none', padding:'0 8px', fontWeight:'bold'}}>+</button>
                                    </div>

                                    {/* Delete Button */}
                                    <button onClick={() => deleteItem(item.id)} style={{border:'none', background:'#FFF1F0', color:'#FF3B30', padding:'8px 10px', borderRadius:'10px'}}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {/* Order Form */}
                        <div style={{ background: '#F2F2F7', padding: '15px', borderRadius: '20px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', fontWeight:'bold'}}>
                                <span>Total:</span>
                                <span style={{color:'#007AFF', fontSize:'18px'}}>{cartTotal.toLocaleString()} Ks</span>
                            </div>

                            <input style={inputStyle} value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Name" />
                            <input style={inputStyle} value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="Phone (09...)" />
                            
                            <div style={{display:'flex', gap:'10px'}}>
                                <input type="date" style={inputStyle} value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} />
                                <input type="time" style={inputStyle} value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} />
                            </div>
                            
                            <textarea style={{...inputStyle, height:'60px'}} value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} placeholder="Special Note..." />
                            
                            <button onClick={handleOrder} disabled={isProcessing} style={{ width: '100%', background: '#007AFF', color: '#fff', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                                {isProcessing ? "Sending..." : "Confirm Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success and Alert Modals (ဒီအတိုင်းထားပါသည်) */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '350px', borderRadius: '25px', padding: '25px', textAlign: 'center' }}>
                        <i className="fas fa-check-circle" style={{color:'#34C759', fontSize:'50px', marginBottom:'15px'}}></i>
                        <h3>Ordered Successfully!</h3>
                        <div style={{textAlign:'left', background:'#F2F2F7', padding:'15px', borderRadius:'15px', fontSize:'13px', margin:'15px 0'}}>
                            <div><b>ID:</b> {orderSuccess.orderId}</div>
                            <div><b>Total:</b> {orderSuccess.totalPrice.toLocaleString()} Ks</div>
                        </div>
                        <button onClick={() => setOrderSuccess(null)} style={{ width:'100%', padding:'12px', borderRadius:'12px', border:'none', background:'#007AFF', color:'white', fontWeight:'bold' }}>Done</button>
                    </div>
                </div>
            )}

            {showAlert && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', width: '80%' }}>
                        <p style={{ fontWeight: 'bold' }}>{alertMessage}</p>
                        <button onClick={() => setShowAlert(false)} style={{ padding: '10px 30px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '10px' }}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginBottom: '10px', fontSize: '14px', outline: 'none' };
                    
