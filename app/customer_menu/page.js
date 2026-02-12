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

    // Search logic
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
        if (!customerInfo.name || !customerInfo.phone) return alert("Please fill Name and Phone");
        const orderDetails = { ...customerInfo, items: cart, totalPrice: cartTotal, orderDate: new Date().toISOString() };
        try {
            const res = await fetch('/api/orders', { method: 'POST', body: JSON.stringify(orderDetails) });
            if (res.ok) {
                alert("Order Successful!");
                setCart([]); setShowCart(false);
            }
        } catch (e) { alert("Error placing order"); }
    };

    if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Loading...</div>;

    return (
        <div style={{ background: '#F2F2F7', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            {/* Header Area */}
            <div style={{ background: 'white', padding: '15px', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                   <Link href="/" style={{color:'#007AFF', textDecoration:'none'}}><i className="fas fa-arrow-left"></i> Dashboard</Link>
                </div>
                
                <div style={{position:'relative', marginBottom:'15px'}}>
                    <i className="fas fa-search" style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'#8E8E93'}}></i>
                    <input 
                        type="text" placeholder="Search menu..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{width:'100%', padding:'12px 12px 12px 40px', borderRadius:'12px', border:'none', background:'#F2F2F7'}}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom:'5px' }}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCat(cat)}
                            style={{ background: activeCat === cat ? '#007AFF' : 'white', color: activeCat === cat ? 'white' : '#1C1C1E', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: '600', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', whiteSpace:'nowrap' }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {filteredMenu.map(item => (
                    <div key={item.id} style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{position:'relative', width:'100%', height:'120px'}}>
                            <Image src={item.image || 'https://via.placeholder.com/150'} fill style={{borderRadius:'15px', objectFit:'cover'}} alt={item.name} />
                        </div>
                        <b style={{ display: 'block', margin: '10px 0 5px', fontSize: '15px' }}>{item.name}</b>
                        <div style={{color:'#007AFF', fontWeight:'800', marginBottom:'10px'}}>{(Number(item.price) || 0).toLocaleString()} Ks</div>
                        <button onClick={() => addToCart(item)} style={{ width: '100%', background: '#007AFF', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: '700' }}>Add to Cart</button>
                    </div>
                ))}
            </div>

            {/* Floating Bottom Bar */}
            {cartQty > 0 && !showCart && (
                <div style={{ position: 'fixed', bottom: '20px', left: '15px', right: '15px', background: '#1C1C1E', borderRadius: '20px', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 200 }}>
                    <div style={{color:'white'}}>
                        <div style={{fontWeight:'bold', fontSize:'18px'}}>{cartTotal.toLocaleString()} Ks</div>
                        <div style={{fontSize:'12px', opacity:0.8}}>{cartQty} items</div>
                    </div>
                    <button onClick={() => setShowCart(true)} style={{ background: '#007AFF', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold' }}>View Cart</button>
                </div>
            )}

            {/* Cart Overlay Modal */}
            {showCart && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ background: 'white', width: '100%', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '25px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h2 style={{margin:0}}>Your Cart</h2>
                            <i className="fas fa-times" onClick={() => setShowCart(false)} style={{fontSize:'20px', cursor:'pointer'}}></i>
                        </div>

                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                                <div style={{position:'relative', width:'60px', height:'60px'}}>
                                    <Image src={item.image || 'https://via.placeholder.com/150'} fill style={{borderRadius:'10px', objectFit:'cover'}} alt={item.name} />
                                </div>
                                <div style={{flex:1}}>
                                    <div style={{fontWeight:'600'}}>{item.name}</div>
                                    <div style={{color:'#007AFF', fontSize:'14px'}}>{item.price.toLocaleString()} Ks</div>
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', background:'#F2F2F7', borderRadius:'10px', padding:'5px 10px'}}>
                                    <button onClick={() => removeFromCart(item.id)} style={{border:'none', background:'none'}}>-</button>
                                    <span style={{fontWeight:'bold'}}>{item.qty}</span>
                                    <button onClick={() => addToCart(item)} style={{border:'none', background:'none'}}>+</button>
                                </div>
                            </div>
                        ))}

                        <div style={{ borderTop: '1px solid #EEE', paddingTop: '15px', marginTop: '15px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px', marginBottom:'20px'}}>
                                <span>Total Amount:</span>
                                <span style={{color:'#007AFF'}}>{cartTotal.toLocaleString()} Ks</span>
                            </div>

                            <input placeholder="Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={inputStyle} />
                            <input placeholder="Phone" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={inputStyle} />
                            <div style={{display:'flex', gap:'10px'}}>
                                <input type="date" value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} style={{...inputStyle, flex:1}} />
                                <input type="time" value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} style={{...inputStyle, flex:1}} />
                            </div>
                            <textarea placeholder="Special Note" value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} style={{...inputStyle, height:'80px'}} />
                            
                            <button onClick={handleOrder} style={{ width: '100%', background: '#007AFF', color: 'white', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>Confirm Order</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5EA', fontSize: '14px', marginBottom: '10px', background: '#F9F9F9', outline:'none' };
                    
