"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CustomerMenu() {
    const [menuData, setMenuData] = useState([]);
    const [filteredMenu, setFilteredMenu] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [activeCat, setActiveCat] = useState('All');
    const [cart, setCart] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // VPN မလိုဘဲ Data ယူမည့်နေရာ (api/data ကို posts အစား menu ဖတ်ခိုင်းရမယ်)
        fetch('/api/data')
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    setMenuData(json.data);
                    setFilteredMenu(json.data);
                    const cats = new Set(['All']);
                    json.data.forEach(item => { if (item.category) cats.add(item.category); });
                    setCategories(Array.from(cats));
                }
            })
            .catch(err => console.log("Error fetching data:", err));
    }, []);

    const addToCart = (item) => {
        const id = item.id;
        const newCart = { ...cart };
        const price = typeof item.price === 'string' ? parseInt(item.price.replace(/,/g, '')) : (item.price || 0);
        if (!newCart[id]) newCart[id] = { name: item.name, price: price, image: item.image, qty: 1 };
        else newCart[id].qty += 1;
        setCart(newCart);
    };

    const cartQty = Object.values(cart).reduce((s, i) => s + i.qty, 0);
    const cartTotal = Object.values(cart).reduce((s, i) => s + (i.qty * i.price), 0);

    return (
        <div style={{ background: '#F8F9FC', minHeight: '100vh', paddingBottom: '100px' }}>
            {/* Font Awesome Link ကို ဒီမှာ ထည့်ထားပေးတယ် */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            <div style={{ background: 'white', padding: '20px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#007AFF', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-chevron-left"></i> <span>Dashboard သို့ ပြန်ရန်</span>
                </Link>
                <h1 style={{ margin: '15px 0 0', fontSize: '24px', fontWeight: '800' }}>Our Menu</h1>
            </div>

            <div style={{ padding: '15px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => {
                            setActiveCat(cat);
                            setFilteredMenu(cat === 'All' ? menuData : menuData.filter(m => m.category === cat));
                        }}
                        style={{
                            background: activeCat === cat ? '#007AFF' : 'white',
                            color: activeCat === cat ? 'white' : '#1C1C1E',
                            border: 'none', padding: '8px 20px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div style={{ padding: '10px 15px', display: 'grid', gridTemplate-columns: '1fr 1fr', gap: '12px' }}>
                {filteredMenu.length > 0 ? filteredMenu.map(item => (
                    <div key={item.id} style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                        <img src={item.image || 'https://via.placeholder.com/150'} style={{ width: '100%', height: '110px', borderRadius: '15px', object-fit: 'cover' }} />
                        <b style={{ display: 'block', margin: '8px 0', fontSize: '14px' }}>{item.name || item.title}</b>
                        <span style={{ color: '#007AFF', fontWeight: '800' }}>{parseInt(item.price || 0).toLocaleString()} Ks</span>
                        <button 
                            onClick={() => addToCart(item)}
                            style={{ width: '100%', background: '#007AFF', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: '700', marginTop: '10px' }}
                        >
                            Add to Cart
                        </button>
                    </div>
                )) : (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#8E8E93' }}>
                        <i className="fas fa-hamburger" style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }}></i>
                        <p>Menu များ ထည့်သွင်းနေပါသည်...</p>
                    </div>
                )}
            </div>

            {cartQty > 0 && (
                <div style={{ position: 'fixed', bottom: '20px', left: '15px', right: '15px', background: '#1C1C1E', color: 'white', padding: '15px 20px', borderRadius: '22px', display: 'flex', justify-content: 'space-between', align-items: 'center', zIndex: 500 }}>
                    <div><b>{cartTotal.toLocaleString()} Ks</b><br/><small>{cartQty} Items</small></div>
                    <button style={{ background: '#007AFF', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700' }}>View Cart</button>
                </div>
            )}
        </div>
    );
}
