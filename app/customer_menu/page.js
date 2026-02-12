"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function CustomerMenu() {
    const [menuData, setMenuData] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [activeCat, setActiveCat] = useState('All');
    const [cart, setCart] = useState([]);
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', note: '', date: '', time: '' });
    const [loading, setLoading] = useState(true);

    // 1. Data Fetching
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "menu"));
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMenuData(data);
                setFilteredMenu(data);
                
                // Categories သတ်မှတ်ခြင်း
                const cats = new Set(['All']);
                data.forEach(item => { if (item.category) cats.add(item.category); });
                setCategories(Array.from(cats));
            } catch (error) {
                console.error("Error:", error);
            }
            setLoading(false);
        };
        fetchMenus();
    }, []);

    // 2. Add to Cart
    const addToCart = (item) => {
        const existing = cart.find(c => c.id === item.id);
        if (existing) {
            setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
        } else {
            const price = typeof item.price === 'string' ? parseInt(item.price.replace(/,/g, '')) : (item.price || 0);
            setCart([...cart, { ...item, price: price, qty: 1 }]);
        }
    };

    // 3. Remove/Decrease from Cart
    const removeFromCart = (id) => {
        const existing = cart.find(c => c.id === id);
        if (existing.qty > 1) {
            setCart(cart.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c));
        } else {
            setCart(cart.filter(c => c.id !== id));
        }
    };

    // 4. Quantity Change (Number Input)
    const handleQtyChange = (id, value) => {
        const newQty = parseInt(value);
        if (isNaN(newQty) || newQty < 1) {
            setCart(cart.map(c => c.id === id ? { ...c, qty: 1 } : c));
        } else {
            setCart(cart.map(c => c.id === id ? { ...c, qty: newQty } : c));
        }
    };

    // 5. Calculate Totals
    const cartQty = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + (i.qty * i.price), 0);

    // 6. Handle Order
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

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Menu...</div>;

    return (
        <div style={{ background: '#F8F9FC', minHeight: '100vh', paddingBottom: '100px', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            {/* Header */}
            <div style={{ background: 'white', padding: '20px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold' }}>
                    <i className="fas fa-chevron-left"></i> Dashboard သို့ ပြန်ရန်
                </Link>
                <h1 style={{ margin: '10px 0 0', fontSize: '22px' }}>Myinthar Chicken BBQ</h1>
            </div>

            {/* Category Filter */}
            <div style={{ padding: '15px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                {categories.map(cat => (
                    <button key={cat} onClick={() => { setActiveCat(cat); setFilteredMenu(cat === 'All' ? menuData : menuData.filter(m => m.category === cat)); }}
                        style={{ background: activeCat === cat ? '#007AFF' : 'white', color: activeCat === cat ? 'white' : '#1C1C1E', border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: '700', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Menu Grid */}
            <div style={{ padding: '10px 15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {filteredMenu.map(item => (
                    <div key={item.id} style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                        <img src={item.image || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '110px', borderRadius: '15px', objectFit: 'cover' }} />
                        <b style={{ display: 'block', margin: '8px 0', fontSize: '14px' }}>{item.name}</b>
                        <span style={{ color: '#007AFF', fontWeight: '800' }}>{item.price.toLocaleString()} Ks</span>
                        <button onClick={() => addToCart(item)} style={{ width: '100%', background: '#007AFF', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: '700', marginTop: '10px' }}>Add +</button>
                    </div>
                ))}
            </div>

            {/* Cart & Order Form Section */}
            {cartQty > 0 && (
                <div style={{ margin: '20px 15px', background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0 }}>Shopping Cart ({cartQty})</h3>
                    {cart.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <span style={{ flex: 1, fontSize: '14px' }}>{item.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => removeFromCart(item.id)} style={{ width: '25px', borderRadius: '5px', border: '1px solid #ddd' }}>-</button>
                                <input type="number" value={item.qty} onChange={(e) => handleQtyChange(item.id, e.target.value)} style={{ width: '40px', textAlign: 'center', border: '1px solid #ddd' }} />
                                <button onClick={() => addToCart(item)} style={{ width: '25px', borderRadius: '5px', border: '1px solid #ddd' }}>+</button>
                            </div>
                        </div>
                    ))}
                    <div style={{ textAlign: 'right', fontWeight: '800', fontSize: '18px', margin: '15px 0' }}>Total: {cartTotal.toLocaleString()} Ks</div>
                    
                    {/* Customer Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input placeholder="နာမည်" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={inputStyle} />
                        <input placeholder="ဖုန်းနံပါတ်" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={inputStyle} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="date" value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} style={{...inputStyle, flex: 1}} />
                            <input type="time" value={customerInfo.time} onChange={e => setCustomerInfo({...customerInfo, time: e.target.value})} style={{...inputStyle, flex: 1}} />
                        </div>
                        <textarea placeholder="မှတ်ချက် (Note)" value={customerInfo.note} onChange={e => setCustomerInfo({...customerInfo, note: e.target.value})} style={{...inputStyle, height: '60px'}} />
                        <button onClick={handleOrder} style={{ background: '#34C759', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: '800', fontSize: '16px' }}>CONFIRM ORDER</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = { padding: '12px', borderRadius: '12px', border: '1px solid #E5E5EA', fontSize: '14px', outline: 'none' };
    
