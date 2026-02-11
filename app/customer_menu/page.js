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
    const [orderSuccess, setOrderSuccess] = useState(null);

    // ၁။ VPN မလိုဘဲ Data ယူခြင်း
    useEffect(() => {
        fetch('/api/data')
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    setMenuData(json.data);
                    setFilteredMenu(json.data);
                    const cats = new Set(['All']);
                    json.data.forEach(item => { if (item.category) cats.add(item.category); });
                    setCategories(Array.from(cats));
                }
            });
    }, []);

    // ၂။ Cart Logic များ
    const addToCart = (item) => {
        const id = item.id;
        const newCart = { ...cart };
        const price = typeof item.price === 'string' ? parseInt(item.price.replace(/,/g, '')) : item.price;
        
        if (!newCart[id]) {
            newCart[id] = { name: item.name, price: price, image: item.image, qty: 1 };
        } else {
            newCart[id].qty += 1;
        }
        setCart(newCart);
    };

    const updateQty = (id, delta) => {
        const newCart = { ...cart };
        newCart[id].qty += delta;
        if (newCart[id].qty <= 0) delete newCart[id];
        setCart(newCart);
    };

    const cartQty = Object.values(cart).reduce((s, i) => s + i.qty, 0);
    const cartTotal = Object.values(cart).reduce((s, i) => s + (i.qty * i.price), 0);

    // ၃။ Filter Logic
    const filterCat = (cat) => {
        setActiveCat(cat);
        if (cat === 'All') setFilteredMenu(menuData);
        else setFilteredMenu(menuData.filter(m => m.category === cat));
    };

    return (
        <div className="menu-page">
            <style jsx global>{`
                :root { --pearl: #ffffff; --bg: #F8F9FC; --primary: #007AFF; --text: #1C1C1E; --gray: #8E8E93; }
                body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); margin: 0; padding-bottom: 100px; }
                .header { background: white; padding: 15px 20px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
                .categories { padding: 15px; display: flex; gap: 10px; overflow-x: auto; }
                .cat-item { background: white; padding: 8px 18px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; cursor: pointer; }
                .cat-item.active { background: var(--primary); color: white; }
                .menu-container { padding: 10px 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .food-card { background: white; border-radius: 20px; padding: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
                .food-img { width: 100%; height: 110px; border-radius: 15px; object-fit: cover; }
                .food-name { font-weight: 700; font-size: 14px; margin: 8px 0 4px; display: block; height: 35px; overflow: hidden; }
                .food-price { color: var(--primary); font-weight: 800; font-size: 13px; }
                .add-btn { background: var(--primary); color: white; border: none; width: 100%; padding: 10px; border-radius: 12px; font-weight: 700; margin-top: 10px; }
                .cart-bar { position: fixed; bottom: 20px; left: 15px; right: 15px; background: var(--text); color: white; padding: 15px 20px; border-radius: 22px; display: flex; justify-content: space-between; align-items: center; z-index: 500; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; }
                .modal-content { background: white; width: 100%; border-radius: 30px 30px 0 0; padding: 25px; max-height: 80vh; overflow-y: auto; }
            `}</style>

            <div className="header">
                <Link href="/" style={{textDecoration:'none', color:'black', fontSize:'14px'}}>
                    <i className="fas fa-arrow-left"></i> Dashboard
                </Link>
                <h2 style={{margin:'10px 0 0'}}>Our Menu</h2>
            </div>

            <div className="categories">
                {categories.map(cat => (
                    <div 
                        key={cat} 
                        className={`cat-item ${activeCat === cat ? 'active' : ''}`}
                        onClick={() => filterCat(cat)}
                    >
                        {cat}
                    </div>
                ))}
            </div>

            <div className="menu-container">
                {filteredMenu.map(item => (
                    <div className="food-card" key={item.id}>
                        <img src={item.image || 'https://via.placeholder.com/150'} className="food-img" />
                        <b className="food-name">{item.name}</b>
                        <span className="food-price">{parseInt(item.price).toLocaleString()} Ks</span>
                        <button className="add-btn" onClick={() => addToCart(item)}>Add to Cart</button>
                    </div>
                ))}
            </div>

            {cartQty > 0 && (
                <div className="cart-bar">
                    <div>
                        <b>{cartTotal.toLocaleString()} Ks</b><br/>
                        <small>{cartQty} Items</small>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{background:'var(--primary)', color:'white', border:'none', padding:'10px 20px', borderRadius:'12px', fontWeight:'700'}}
                    >
                        View Cart
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Your Cart</h3>
                        {Object.keys(cart).map(id => (
                            <div key={id} style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', alignItems:'center'}}>
                                <div>
                                    <div style={{fontWeight:'700'}}>{cart[id].name}</div>
                                    <div style={{color:'var(--primary)', fontSize:'12px'}}>{(cart[id].qty * cart[id].price).toLocaleString()} Ks</div>
                                </div>
                                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                    <button onClick={() => updateQty(id, -1)} style={{width:'30px', height:'30px', borderRadius:'50%', border:'1px solid #ddd'}}>-</button>
                                    <span>{cart[id].qty}</span>
                                    <button onClick={() => updateQty(id, 1)} style={{width:'30px', height:'30px', borderRadius:'50%', border:'1px solid #ddd'}}>+</button>
                                </div>
                            </div>
                        ))}
                        <button 
                            style={{width:'100%', background:'var(--primary)', color:'white', padding:'15px', borderRadius:'15px', border:'none', fontWeight:'800', marginTop:'20px'}}
                            onClick={() => alert('Order တင်ခြင်း Feature ကို Backend ချိတ်ဆက်နေဆဲဖြစ်ပါသည်။')}
                        >
                            Confirm Order ({cartTotal.toLocaleString()} Ks)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

