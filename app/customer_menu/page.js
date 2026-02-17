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
        try {
            await signOut(auth);
        } catch (e) {
            console.error(e);
        }
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
            
            // Price ကို Number ဖြစ်အောင် သေချာပြောင်းလဲခြင်း
            let price = 0;
            if (typeof item.price === "string") {
                price = parseInt(item.price.replace(/,/g, "")) || 0;
            } else {
                price = Number(item.price) || 0;
            }
            
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
        if (!user) {
            setAlertMessage("ကျေးဇူးပြု၍ အရင်ဆုံး Login ဝင်ပါ");
            setShowAlert(true);
            return;
        }

        if (cart.length === 0) {
            setAlertMessage("ဟင်းပွဲအရင်ရွေးပါ");
            setShowAlert(true);
            return;
        }
        if (!customerInfo.name || !customerInfo.phone) {
            setAlertMessage("နာမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပေးပါ");
            setShowAlert(true);
            return;
        }

        setIsProcessing(true);
        const orderDetails = { 
            ...customerInfo, 
            email: user ? user.email : "guest",
            items: cart, 
            totalPrice: cartTotal, 
            status: "New",
            orderDate: new Date().toISOString(),
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
            } else {
                throw new Error(data.error);
            }
        } catch (e) { 
            setAlertMessage("Order တင်ရတာ အဆင်မပြေဖြစ်သွားပါသည်: " + e.message);
            setShowAlert(true);
        }
        setIsProcessing(false);
    };

    if (loading) return <div style={{textAlign:'center', padding:'100px', color: '#007AFF', fontWeight: 'bold'}}>Loading Premium Menu...</div>;

    return (
        <div style={{ background: '#F2F2F7', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            <style jsx global>{`
                .category-item { padding: 8px 20px; border-radius: 20px; background: white; color: #8E8E93; font-weight: 600; font-size: 14px; white-space: nowrap; cursor: pointer; transition: all 0.3s; border: 1px solid transparent; }
                .category-item.active { background: #007AFF; color: white; box-shadow: 0 4px 12px rgba(0,122,255,0.3); }
                .menu-card { background: white; border-radius: 24px; padding: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: transform 0.2s; }
                .menu-card:active { transform: scale(0.96); }
                .cart-bar { position: fixed; bottom: 20px; left: 20px; right: 20px; background: rgba(28, 28, 30, 0.9); backdrop-filter: blur(15px); padding: 18px 25px; display: flex; justifyContent: space-between; alignItems: center; z-index: 1000; border-radius: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); animation: slideUp 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
                @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .glass-modal { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); width: 100%; border-top-left-radius: 35px; border-top-right-radius: 35px; padding: 30px 25px; maxHeight: 90vh; overflow-y: auto; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); }
            `}</style>

            {/* Header */}
            <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <Link href="/" style={{color:'#1C1C1E', textDecoration:'none', fontWeight:'800', fontSize:'20px'}}>
                       <i className="fas fa-chevron-left" style={{marginRight: '10px', fontSize: '16px'}}></i> Menu
                    </Link>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {user ? (
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '5px 12px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                                <Link href="/history" style={{ color: '#1C1C1E', fontSize: '18px' }}>
                                    <i className="fas fa-receipt"></i>
                                </Link>
                                <img 
                                    src={user.photoURL} 
                                    onClick={handleLogout}
                                    alt="profile"
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #007AFF', cursor: 'pointer' }} 
                                />
                            </div>
                        ) : (
                            <button onClick={handleLogin} style={{ 
                                background: '#007AFF', color: '#fff', border: 'none', padding: '8px 18px', 
                                borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,122,255,0.2)'
                            }}>
                                <i className="fab fa-google"></i> Login
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{position:'relative'}}>
                    <i className="fas fa-search" style={{position:'absolute', left:'18px', top:'50%', transform:'translateY(-50%)', color:'#AEAEB2' }}></i>
                    <input 
                        type="text" placeholder="Search delicious food..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{width:'100%', padding:'14px 14px 14px 48px', borderRadius:'18px', border:'none', background:'#F2F2F7', boxSizing:'border-box', outline: 'none', fontSize: '15px', fontWeight: '500' }}
                    />
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '15px', paddingBottom: '5px', scrollbarWidth: 'none' }}>
                    {categories.map(cat => (
                        <div 
                            key={cat} 
                            className={`category-item ${activeCat === cat ? 'active' : ''}`}
                            onClick={() => setActiveCat(cat)}
                        >
                            {cat}
                        </div>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', boxSizing: 'border-box', paddingBottom: cartQty > 0 ? '120px' : '40px' }}>
                {filteredMenu.map(item => (
                    <div key={item.id} className="menu-card">
                        <div style={{position:'relative', width:'100%', height:'120px', borderRadius:'18px', overflow:'hidden', background: '#F2F2F7'}}>
                            <img 
                                src={item.image || 'https://via.placeholder.com/150'} 
                                style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                                alt={item.name} 
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                        </div>
                        <div style={{fontWeight: '800', fontSize: '15px', marginTop: '12px', color: '#1C1C1E', height:'38px', overflow:'hidden', lineHeight: '1.2'}}>{item.name}</div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px'}}>
                            <div style={{color:'#007AFF', fontWeight:'900', fontSize:'16px'}}>{(Number(item.price) || 0).toLocaleString()} <span style={{fontSize: '10px'}}>Ks</span></div>
                            <button 
                                onClick={() => addToCart(item)} 
                                style={{ background: '#007AFF', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,122,255,0.2)' }}
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Cart Bar */}
            {cartQty > 0 && !showCart && (
                <div className="cart-bar" onClick={() => setShowCart(true)}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div style={{background: '#007AFF', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', position: 'relative'}}>
                            <i className="fas fa-shopping-basket" style={{fontSize: '20px'}}></i>
                            <span style={{position: 'absolute', top: '-5px', right: '-5px', background: '#FF3B30', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', border: '2px solid #1A1A1A'}}>{cartQty}</span>
                        </div>
                        <div>
                            <div style={{color:'#fff', fontWeight:'900', fontSize: '18px'}}>{cartTotal.toLocaleString()} Ks</div>
                            <div style={{fontSize:'11px', color:'#8E8E93', fontWeight: '600'}}>View your cart</div>
                        </div>
                    </div>
                    <i className="fas fa-chevron-right" style={{color: '#fff', opacity: 0.5}}></i>
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-modal">
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px', alignItems: 'center'}}>
                            <h2 style={{margin:0, fontWeight: '900'}}>My Order</h2>
                            <div onClick={() => setShowCart(false)} style={{background: '#F2F2F7', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
                                <i className="fas fa-times" style={{fontSize:'18px', color: '#8E8E93'}}></i>
                            </div>
                        </div>

                        <div style={{maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '5px'}}>
                            {cart.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '18px', alignItems: 'center', background: '#F8F9FA', padding: '12px', borderRadius: '18px' }}>
                                    <img src={item.image || 'https://via.placeholder.com/150'} style={{width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover'}} alt="item" />
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:'14px', fontWeight:'800', color: '#1C1C1E'}}>{item.name}</div>
                                        <div style={{fontSize:'13px', color: '#007AFF', fontWeight: '700'}}>{(item.price).toLocaleString()} Ks</div>
                                    </div>
                                    <div style={{display:'flex', alignItems:'center', background:'#fff', borderRadius:'12px', padding:'4px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
                                        <button onClick={() => removeFromCart(item.id)} style={{border:'none', background:'none', width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold'}}>-</button>
                                        <span style={{width:'30px', textAlign:'center', fontWeight:'800', fontSize: '14px'}}>{item.qty}</span>
                                        <button onClick={() => addToCart(item)} style={{border:'none', background:'none', width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold'}}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{background: '#F2F2F7', padding: '20px', borderRadius: '24px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                                <span style={{fontWeight: '700', color: '#8E8E93'}}>Total Amount</span>
                                <span style={{fontWeight: '900', color: '#007AFF', fontSize: '20px'}}>{cartTotal.toLocaleString()} Ks</span>
                            </div>

                            <label style={labelStyle}>Customer Name</label>
                            <input style={inputStyle} value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Enter your name" />
                            
                            <label style={labelStyle}>Phone Number</label>
                            <input style={inputStyle} value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="09xxxxxxx" />
                            
                            <div style={{display:'flex', gap:'15px'}}>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>Date</label>
                                    <input type="date" style={inputStyle} value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>Time</label>
                                    <input type="time" style={inputStyle} value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} />
                                </div>
                            </div>
                            
                            <label style={labelStyle}>Note (Optional)</label>
                            <textarea style={{...inputStyle, height:'60px', paddingTop: '12px'}} value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} placeholder="Any special requests?" />
                            
                            <button onClick={handleOrder} disabled={isProcessing} style={{ width: '100%', background: '#007AFF', color: '#fff', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: '900', fontSize: '16px', marginTop: '15px', boxShadow: '0 10px 25px rgba(0,122,255,0.3)' }}>
                                {isProcessing ? "Processing..." : "Confirm Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Voucher Modal */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '380px', borderRadius: '30px', padding: '30px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
                        <div style={{background: '#E8F9EE', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
                            <i className="fas fa-check" style={{color:'#34C759', fontSize:'40px'}}></i>
                        </div>
                        <h2 style={{margin:0, fontWeight: '900'}}>Order Placed!</h2>
                        <p style={{color: '#8E8E93', fontSize: '14px', marginTop: '5px'}}>Your order has been sent successfully.</p>
                        
                        <div style={{textAlign:'left', background:'#F2F2F7', padding:'20px', borderRadius:'20px', fontSize:'14px', marginTop: '25px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                                <span style={{color: '#8E8E93'}}>Order ID</span>
                                <span style={{fontWeight: '800'}}>{orderSuccess.orderId}</span>
                            </div>
                            <div style={{borderTop: '1px dashed #D1D1D6', margin: '10px 0'}}></div>
                            {orderSuccess.items.map((item, i) => (
                                <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom: '5px'}}>
                                    <span>{item.name} x {item.qty}</span>
                                    <span style={{fontWeight: '700'}}>{(item.price * item.qty).toLocaleString()} Ks</span>
                                </div>
                            ))}
                            <div style={{borderTop: '1px solid #D1D1D6', marginTop: '15px', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span style={{fontWeight: 'bold'}}>Total Amount</span>
                                <span style={{fontWeight: '900', color: '#007AFF', fontSize: '18px'}}>{orderSuccess.totalPrice.toLocaleString()} Ks</span>
                            </div>
                        </div>
                        
                        <div style={{marginTop:'30px', display:'flex', gap:'12px'}}>
                            <button onClick={() => setOrderSuccess(null)} style={{flex:1, padding:'15px', borderRadius:'15px', border:'none', background: '#F2F2F7', fontWeight: '700', color: '#1C1C1E'}}>Close</button>
                            <button onClick={() => window.print()} style={{flex:1, padding:'15px', borderRadius:'15px', background:'#007AFF', color:'#fff', border: 'none', fontWeight: '700', boxShadow: '0 8px 20px rgba(0,122,255,0.2)'}}>Print</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Box */}
            {showAlert && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }}>
                    <div style={{ background: '#fff', padding: '30px', borderRadius: '25px', textAlign: 'center', width: '100%', maxWidth: '320px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{background: '#FFF1F0', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
                            <i className="fas fa-exclamation-triangle" style={{ color: '#FF3B30', fontSize: '28px' }}></i>
                        </div>
                        <p style={{ fontSize: '16px', fontWeight: '800', color: '#1C1C1E', marginBottom: '25px', lineHeight: '1.4' }}>{alertMessage}</p>
                        <button onClick={() => setShowAlert(false)} style={{ width: '100%', padding: '15px', background: '#1C1C1E', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>Got it</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px', marginTop: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '15px', border: '1px solid #E5E5EA', fontSize: '15px', background: '#fff', boxSizing:'border-box', outline:'none', marginBottom: '5px', fontWeight: '600' };
