"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Image Warning Fix
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function CustomerMenu() {
    const [menuData, setMenuData] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [activeCat, setActiveCat] = useState('All');
    const [cart, setCart] = useState([]);
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
            } catch (error) { console.error("Error fetching menu:", error); }
            setLoading(false);
        };
        fetchMenus();
    }, []);

    // ✅ addToCart with functional update & price handling
    const addToCart = (item) => {
        setCart(prevCart => {
            const existing = prevCart.find(c => c.id === item.id);
            if (existing) {
                return prevCart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
            } else {
                const price = typeof item.price === "string" 
                    ? parseInt(item.price.replace(/,/g, "")) 
                    : item.price || 0;
                return [...prevCart, { ...item, price, qty: 1 }];
            }
        });
    };

    // ✅ removeFromCart safe version
    const removeFromCart = (id) => {
        setCart(prevCart => {
            const existing = prevCart.find(c => c.id === id);
            if (!existing) return prevCart;
            if (existing.qty > 1) {
                return prevCart.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
            } else {
                return prevCart.filter(c => c.id !== id);
            }
        });
    };

    const handleQtyChange = (id, value) => {
        const newQty = parseInt(value);
        setCart(prevCart => 
            prevCart.map(c => c.id === id ? { ...c, qty: isNaN(newQty) || newQty < 1 ? 1 : newQty } : c)
        );
    };

    const cartQty = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + (i.qty * i.price), 0);

    const handleOrder = async () => {
        if (!customerInfo.name || !customerInfo.phone) return alert("နာမည်နှင့် ဖုန်းနံပါတ် ဖြည့်ပေးပါ");
        if (cart.length === 0) return alert("Cart ထဲမှာ ဟင်းပွဲမရှိသေးပါ");
        const orderDetails = { ...customerInfo, items: cart, totalPrice: cartTotal, orderDate: new Date().toISOString() };
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderDetails)
            });
            const data = await res.json();
            if (data.success) {
                alert("Order တင်ခြင်း အောင်မြင်ပါသည်။");
                setCart([]);
                setCustomerInfo({ name: '', phone: '', note: '', date: '', time: '' });
            }
        } catch (e) { alert("Error: Order တင်မရပါ"); }
    };

    const inputStyle = { padding: '12px', borderRadius: '12px', border: '1px solid #E5E5EA', fontSize: '14px', outline: 'none' };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Menu...</div>;

    return (
        <div style={{ background: '#F8F9FC', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <div style={{ background: 'white', padding: '20px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold' }}>
                    <i className="fas fa-chevron-left"></i> Dashboard
                </Link>
                <h1 style={{ margin: '10px 0 0', fontSize: '22px' }}>Customer Menu</h1>
            </div>

            <div style={{ padding: '15px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                {categories.map(cat => (
                    <button key={cat} onClick={() => { setActiveCat(cat); setFilteredMenu(cat === 'All' ? menuData : menuData.filter(m => m.category === cat)); }}
                        style={{ background: activeCat === cat ? '#007AFF' : 'white', color: activeCat === cat ? 'white' : '#1C1C1E', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: '700' }}>
                        {cat}
                    </button>
                ))}
            </div>

            <div style={{ padding: '10px 15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {filteredMenu.map(item => {
                    // ✅ Price formatting fix
                    const displayPrice = typeof item.price === "string" ? parseInt(item.price.replace(/,/g, "")) : item.price || 0;
                    return (
                        <div key={item.id} style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                            <Image 
                                src={item.image || 'https://via.placeholder.com/150'} 
                                width={300} height={110} 
                                style={{ width: '100%', height: '110px', borderRadius: '15px', objectFit: 'cover' }}
                                alt={item.name}
                            />
                            <b style={{ display: 'block', margin: '8px 0', fontSize: '14px' }}>{item.name}</b>
                            <span style={{ color: '#007AFF', fontWeight: '800' }}>{displayPrice.toLocaleString()} Ks</span>
                            <button onClick={() => addToCart(item)} style={{ width: '100%', background: '#007AFF', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', marginTop: '10px', fontWeight: 'bold' }}>Add +</button>
                        </div>
                    );
                })}
            </div>

            {cartQty > 0 && (
                <div style={{ margin: '20px 15px', background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0 }}>Shopping Cart ({cartQty})</h3>
                    {cart.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{ flex: 1, fontSize: '14px' }}>{item.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => removeFromCart(item.id)} style={{ width: '25px', height: '25px', borderRadius: '5px', border: '1px solid #ddd' }}>-</button>
                                <input type="number" value={item.qty} onChange={(e) => handleQtyChange(item.id, e.target.value)} style={{ width: '40px', textAlign: 'center', border: '1px solid #ddd' }} />
                                <button onClick={() => addToCart(item)} style={{ width: '25px', height: '25px', borderRadius: '5px', border: '1px solid #ddd' }}>+</button>
                            </div>
                        </div>
                    ))}
                    <div style={{ textAlign: 'right', fontWeight: '800', fontSize: '18px', margin: '15px 0' }}>Total: {cartTotal.toLocaleString()} Ks</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input placeholder="Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={inputStyle} />
                        <input placeholder="Phone" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={inputStyle} />
                        <button onClick={handleOrder} style={{ background: '#34C759', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '800' }}>CONFIRM ORDER</button>
                    </div>
                </div>
            )}
        </div>
    );
                                                    }
             
