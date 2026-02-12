"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db, auth } from "../../lib/firebase"; // auth ကိုပါ import ယူပါ
import { collection, getDocs } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"; // ဒါလေးထည့်ပါ


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


        const [user, setUser] = useState(null); // User state

    // Login ဝင်ထားရင် User ကိုမှတ်ထားမယ်
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) setCustomerInfo(prev => ({ ...prev, name: u.displayName }));
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); } 
        catch (e) { console.error(e); }
    };
    
    // Custom Alert States
    const [alertMessage, setAlertMessage] = useState(""); 
    const [showAlert, setShowAlert] = useState(false);

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
        if (!customerInfo.name || !customerInfo.phone) {
            setAlertMessage("ကျေးဇူးပြု၍ နာမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပေးပါ");
            setShowAlert(true);
            return;
        }
        if (cart.length === 0) {
            setAlertMessage("Cart ထဲမှာ ပစ္စည်းမရှိသေးပါ");
            setShowAlert(true);
            return;
        }

        setIsProcessing(true);
        const orderDetails = { 
            ...customerInfo, 
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
            }
        } catch (e) { 
            setAlertMessage("Order တင်ရတာ အဆင်မပြေဖြစ်သွားပါသည်");
            setShowAlert(true);
        }
        setIsProcessing(false);
    };

    if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Loading...</div>;

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Header */}
<div style={{ background: '#fff', padding: '15px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #eee' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{color:'#007AFF', textDecoration:'none', fontWeight:'bold', fontSize:'14px'}}>
           <i className="fas fa-arrow-left"></i> Dashboard
        </Link>

        {/* --- Google Login / Profile Section --- */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {user ? (
                <>
                    <Link href="/history" style={{ color: '#007AFF', fontSize: '18px' }}>
                        <i className="fas fa-history"></i>
                    </Link>
                    <img 
                        src={user.photoURL} 
                        onClick={() => auth.signOut()}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #007AFF', cursor: 'pointer' }} 
                    />
                </>
            ) : (
                <button onClick={handleLogin} style={{ 
                    background: '#fff', border: '1px solid #ddd', padding: '5px 10px', 
                    borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' 
                }}>
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={14} height={14} alt="g" />
                    Login
                </button>
            )}
        </div>
        {/* -------------------------------------- */}
    </div>

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

            {/* Floating Cart Bar */}
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
                                    <input type="number" value={item.qty} onChange={(e) => updateQty(item.id, e.target.value)} style={{width:'35px', textAlign:'center', border:'none', background:'none', fontWeight:'bold'}} />
                                    <button onClick={() => addToCart(item)} style={{border:'none', background:'none', padding:'5px 8px', fontSize: '16px'}}>+</button>
                                </div>
                                <i className="fas fa-trash-alt" onClick={() => deleteItem(item.id)} style={{color:'#FF3B30', padding: '5px', fontSize: '18px'}}></i>
                            </div>
                        ))}
                        
                        <div style={{marginTop:'25px'}}>
                            <label style={labelStyle}>နာမည်</label>
                            <input style={inputStyle} value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} placeholder="Customer Name" />
                            <label style={labelStyle}>ဖုန်းနံပါတ်</label>
                            <input style={inputStyle} value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} placeholder="09xxxxxxx" />
                            <div style={{display:'flex', gap:'15px'}}>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>ရက်စွဲ</label>
                                    <input type="date" style={inputStyle} value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>အချိန်</label>
                                    <input type="time" style={inputStyle} value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} />
                                </div>
                            </div>
                            <label style={labelStyle}>မှတ်ချက်</label>
                            <textarea style={{...inputStyle, height:'70px'}} value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} placeholder="မှတ်ချက်ရှိပါက ရေးပေးပါ" />
                            <button onClick={handleOrder} disabled={isProcessing} style={{ width: '100%', background: '#34C759', color: '#fff', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                                {isProcessing ? "Processing..." : "Confirm Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Voucher Modal */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '360px', borderRadius: '20px', padding: '25px', textAlign: 'center' }}>
                        <i className="fas fa-check-circle" style={{color:'#34C759', fontSize:'50px', marginBottom:'15px'}}></i>
                        <h3 style={{margin:0}}>Order Placed!</h3>
                        <div style={{textAlign:'left', background:'#f9f9f9', padding:'15px', borderRadius:'12px', fontSize:'13px', marginTop: '15px'}}>
                            <p><strong>ID:</strong> {orderSuccess.orderId}</p>
                            <p><strong>Name:</strong> {orderSuccess.name}</p>
                            {orderSuccess.items.map((item, i) => (
                                <div key={i} style={{display:'flex', justifyContent:'space-between'}}>
                                    <span>{item.name} x {item.qty}</span>
                                    <span>{(item.price * item.qty).toLocaleString()} Ks</span>
                                </div>
                            ))}
                            <div style={{borderTop: '1px solid #eee', marginTop: '10px', paddingTop: '10px', fontWeight: 'bold'}}>
                                Total: {orderSuccess.totalPrice.toLocaleString()} Ks
                            </div>
                        </div>
                        <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                            <button onClick={() => setOrderSuccess(null)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}}>Home</button>
                            <button onClick={() => window.print()} style={{flex:1, padding:'12px', borderRadius:'10px', background:'#007AFF', color:'#fff', border: 'none'}}>Download</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Box */}
            {showAlert && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', textAlign: 'center', width: '100%', maxWidth: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <i className="fas fa-exclamation-circle" style={{ color: '#FF3B30', fontSize: '40px', marginBottom: '15px' }}></i>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>{alertMessage}</p>
                        <button onClick={() => setShowAlert(false)} style={{ width: '100%', padding: '12px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }}>OK</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#8E8E93', marginBottom: '6px', marginTop: '12px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E5EA', fontSize: '15px', background: '#F9F9F9', boxSizing:'border-box', outline:'none', marginBottom: '5px' };
                    
