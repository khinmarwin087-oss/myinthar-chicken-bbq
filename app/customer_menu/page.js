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

    const deleteItem = (id) => {
        setCart(prev => prev.filter(c => c.id !== id));
    };

    const handleQtyInput = (id, val) => {
        const q = parseInt(val);
        setCart(prev => prev.map(c => c.id === id ? { ...c, qty: isNaN(q) || q < 1 ? 1 : q } : c));
    };

    const cartQty = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + (i.qty * i.price), 0);

    const handleOrder = async () => {
        if (!customerInfo.name || !customerInfo.phone) return alert("နာမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပေးပါ");
        try {
            const res = await fetch('/api/orders', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...customerInfo, items: cart, totalPrice: cartTotal }) 
            });
            if (res.ok) {
                alert("Order တင်ခြင်း အောင်မြင်ပါသည်");
                setCart([]); setShowCart(false);
            }
        } catch (e) { alert("Error placing order"); }
    };

    if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Loading...</div>;

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', paddingBottom: '100px', position: 'relative' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

            {/* Header Area */}
            <div style={{ background: '#fff', padding: '15px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #eee' }}>
                <Link href="/" style={{color:'#007AFF', textDecoration:'none', fontWeight:'bold', fontSize:'14px'}}>
                   <i className="fas fa-arrow-left"></i> Dashboard
                </Link>
                <div style={{position:'relative', marginTop:'15px'}}>
                    <i className="fas fa-search" style={{position:'absolute', left:'15px', top:'50%', transform:'translateY(-50%)', color:'#999'}}></i>
                    <input 
                        type="text" placeholder="ဟင်းပွဲရှာရန်..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{width:'100%', padding:'12px 12px 12px 42px', borderRadius:'12px', border:'1px solid #eee', background:'#F8F9FA', outline:'none'}}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '15px', paddingBottom: '5px' }}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCat(cat)}
                            style={{ background: activeCat === cat ? '#007AFF' : '#fff', color: activeCat === cat ? '#fff' : '#333', border: '1px solid #eee', padding: '8px 18px', borderRadius: '20px', fontWeight: '600', whiteSpace:'nowrap' }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {filteredMenu.map(item => (
                    <div key={item.id} style={{ background: '#fff', borderRadius: '18px', padding: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{position:'relative', width:'100%', height:'110px', borderRadius:'12px', overflow:'hidden'}}>
                            <Image src={item.image || 'https://via.placeholder.com/150'} fill style={{objectFit:'cover'}} alt={item.name} />
                        </div>
                        <div style={{fontWeight: 'bold', fontSize: '14px', margin: '10px 0 5px', height:'40px', overflow:'hidden'}}>{item.name}</div>
                        <div style={{color:'#007AFF', fontWeight:'800', fontSize:'15px', marginBottom:'10px'}}>{(Number(item.price) || 0).toLocaleString()} Ks</div>
                        <button onClick={() => addToCart(item)} style={{ width: '100%', background: '#007AFF', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold' }}>Add to Cart</button>
                    </div>
                ))}
            </div>

            {/* Floating Bottom Cart Bar */}
            {cartQty > 0 && !showCart && (
                <div style={{ position: 'fixed', bottom: '0', left: '0', right: '0', background: '#1A1A1A', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 15px rgba(0,0,0,0.2)', zIndex: 1000 }}>
                    <div style={{color:'#fff'}}>
                        <div style={{fontWeight:'bold', fontSize:'18px'}}>{cartTotal.toLocaleString()} Ks</div>
                        <div style={{fontSize:'12px', color:'#aaa'}}>{cartQty} items</div>
                    </div>
                    <button onClick={() => setShowCart(true)} style={{ background: '#007AFF', color: '#fff', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold' }}>View Cart</button>
                </div>
            )}

            {/* Cart Modal Overlay */}
            {showCart && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ background: '#fff', width: '100%', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', padding: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h2 style={{margin:0, fontSize:'20px'}}>Your Order</h2>
                            <i className="fas fa-times" onClick={() => setShowCart(false)} style={{fontSize:'24px', cursor:'pointer', color:'#666'}}></i>
                        </div>

                        {cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                                <div style={{position:'relative', width:'55px', height:'55px', flexShrink:0}}>
                                    <Image src={item.image || 'https://via.placeholder.com/150'} fill style={{borderRadius:'8px', objectFit:'cover'}} alt={item.name} />
                                </div>
                                <div style={{flex:1}}>
                                    <div style={{fontWeight:'600', fontSize:'14px'}}>{item.name}</div>
                                    <div style={{color:'#007AFF', fontSize:'13px', fontWeight:'bold'}}>{item.price.toLocaleString()} Ks</div>
                                </div>
                                <div style={{display:'flex', alignItems:'center', background:'#f5f5f5', borderRadius:'8px', padding:'3px'}}>
                                    <button onClick={() => removeFromCart(item.id)} style={{border:'none', background:'none', padding:'5px 10px'}}>-</button>
                                    <input type="number" value={item.qty} onChange={(e)=>handleQtyInput(item.id, e.target.value)} style={{width:'30px', textAlign:'center', border:'none', background:'none', fontWeight:'bold', fontSize:'14px'}} />
                                    <button onClick={() => addToCart(item)} style={{border:'none', background:'none', padding:'5px 10px'}}>+</button>
                                </div>
                                <i className="fas fa-trash-alt" onClick={() => deleteItem(item.id)} style={{color:'#ff4d4d', fontSize:'18px', padding:'5px'}}></i>
                            </div>
                        ))}

                        <div style={{ marginTop: '20px' }}>
                            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px', marginBottom:'20px'}}>
                                <span>Total:</span>
                                <span style={{color:'#007AFF'}}>{cartTotal.toLocaleString()} Ks</span>
                            </div>

                            <label style={labelStyle}>နာမည်</label>
                            <input placeholder="နာမည်ရိုက်ထည့်ပါ" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={inputStyle} />
                            
                            <label style={labelStyle}>ဖုန်းနံပါတ်</label>
                            <input type="tel" placeholder="ဖုန်းနံပါတ်ရိုက်ထည့်ပါ" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={inputStyle} />

                            <div style={{display:'flex', gap:'15px'}}>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>ရက်စွဲ</label>
                                    <input type="date" value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} style={inputStyle} />
                                </div>
                                <div style={{flex:1}}>
                                    <label style={labelStyle}>အချိန်</label>
                                    <input type="time" value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} style={inputStyle} />
                                </div>
                            </div>

                            <label style={labelStyle}>မှတ်ချက် (Special Note)</label>
                            <textarea placeholder="မှတ်ချက်ရှိပါက ရေးပေးပါ..." value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} style={{...inputStyle, height:'70px'}} />
                            
                            <button onClick={handleOrder} style={{ width: '100%', background: '#007AFF', color: '#fff', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>Confirm Order</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', color: '#666', marginBottom: '6px', marginTop: '12px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', background: '#F9F9F9', outline:'none' };
                    
