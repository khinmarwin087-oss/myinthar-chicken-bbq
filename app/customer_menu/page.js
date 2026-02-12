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
    const [orderSuccess, setOrderSuccess] = useState(null); // Voucher Data
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
        <div style={{ background: '#F8F9FA', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
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
                        style={{width:'100%', padding:'12px 12px 12px 42px', borderRadius:'12px', border:'1px solid #eee', background:'#F8F9FA', boxSizing:'border-box' }}
                    />
                </div>
            </div>

            {/* Menu Grid */}
            <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                {filteredMenu.map(item => (
                    <div key={item.id} style={{ background: '#fff', borderRadius: '15px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                        <div style={{position:'relative', width:'100%', height:'100px', borderRadius:'10px', overflow:'hidden'}}>
                            <Image src={item.image || 'https://via.placeholder.com/150'} fill style={{objectFit:'cover'}} alt={item.name} />
                        </div>
                        <div style={{fontWeight: 'bold', fontSize: '13px', margin: '8px 0', height:'35px', overflow:'hidden'}}>{item.name}</div>
                        <div style={{color:'#007AFF', fontWeight:'bold', fontSize:'14px'}}>{(Number(item.price) || 0).toLocaleString()} Ks</div>
                        <button onClick={() => addToCart(item)} style={{ width: '100%', background: '#007AFF', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold' }}>Add +</button>
                    </div>
                ))}
            </div>

            {/* Floating Cart Button */}
            {cartQty > 0 && !showCart && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1A1A1A', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{color:'#fff'}}>
                        <div style={{fontWeight:'bold'}}>{cartTotal.toLocaleString()} Ks</div>
                        <div style={{fontSize:'12px', color:'#aaa'}}>{cartQty} items</div>
                    </div>
                    <button onClick={() => setShowCart(true)} style={{ background: '#007AFF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>View Cart</button>
                </div>
            )}

            {/* Cart Modal */}
            {showCart && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ background: '#fff', width: '100%', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                            <h3 style={{margin:0}}>Shopping Cart</h3>
                            <i className="fas fa-times" onClick={() => setShowCart(false)} style={{fontSize:'20px'}}></i>
                        </div>
                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', borderBottom: '1px solid #f5f5f5', paddingBottom: '10px' }}>
                                <div style={{flex:1, fontSize:'14px', fontWeight:'500'}}>{item.name} x {item.qty}</div>
                                <div style={{fontWeight:'bold'}}>{(item.price * item.qty).toLocaleString()} Ks</div>
                            </div>
                        ))}
                        
                        <div style={{marginTop:'20px'}}>
                            <label style={labelStyle}>နာမည်</label>
                            <input style={inputStyle} value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                            
                            <label style={labelStyle}>ဖုန်းနံပါတ်</label>
                            <input style={inputStyle} value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />

                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
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
                            <textarea style={{...inputStyle, height:'60px'}} value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} />

                            <button onClick={handleOrder} disabled={isProcessing} style={{ width: '100%', background: '#34C759', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', marginTop: '10px' }}>
                                {isProcessing ? "Processing..." : "Confirm Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Voucher Modal */}
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '350px', borderRadius: '15px', padding: '25px', position: 'relative', textAlign: 'center' }}>
                        <i className="fas fa-check-circle" style={{color:'#34C759', fontSize:'50px', marginBottom:'15px'}}></i>
                        <h3 style={{margin:'0 0 5px 0'}}>Order Successful!</h3>
                        <p style={{fontSize:'12px', color:'#666', marginBottom:'20px'}}>Voucher ID: {orderSuccess.orderId}</p>
                        
                        <div style={{textAlign:'left', background:'#f9f9f9', padding:'15px', borderRadius:'10px', fontSize:'13px'}}>
                            <p><strong>Name:</strong> {orderSuccess.name}</p>
                            <p><strong>Phone:</strong> {orderSuccess.phone}</p>
                            <p><strong>Pickup:</strong> {orderSuccess.date} | {orderSuccess.time}</p>
                            <hr style={{border:'0.5px dashed #ccc'}} />
                            {orderSuccess.items.map(item => (
                                <div key={item.id} style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                                    <span>{item.name} x {item.qty}</span>
                                    <span>{(item.price * item.qty).toLocaleString()} Ks</span>
                                </div>
                            ))}
                            <hr style={{border:'0.5px dashed #ccc'}} />
                            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'15px'}}>
                                <span>Total:</span>
                                <span>{orderSuccess.totalPrice.toLocaleString()} Ks</span>
                            </div>
                        </div>

                        <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
                            <button onClick={() => setOrderSuccess(null)} style={{flex:1, padding:'12px', borderRadius:'10px', border:'1px solid #ddd', background:'#fff', fontWeight:'bold'}}>Back Home</button>
                            <button onClick={() => window.print()} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', background:'#007AFF', color:'#fff', fontWeight:'bold'}}>Download</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '10px', boxSizing:'border-box', outline:'none' };
             
