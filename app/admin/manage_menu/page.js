"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ManageMenu() {
    const [menuData, setMenuData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '', image: '' });
    const [searchCat, setSearchCat] = useState("");

    const filteredDisplayMenu = menuData.filter(item => 
        item.category?.toLowerCase().includes(searchCat.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchCat.toLowerCase())
    );

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/data');
            const json = await res.json();
            if (json.success) setMenuData(json.data);
        } catch (error) {
            console.error("Fetch Error:", error);
        }
        setLoading(false);
    };

    useEffect(() => { fetchMenu(); }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.price) return alert("အမည်နှင့် ဈေးနှုန်းထည့်ပါ");
        const method = editId ? 'PUT' : 'POST';
        const res = await fetch('/api/data', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editId ? { ...formData, id: editId } : formData)
        });
        if (res.ok) {
            setShowForm(false);
            setEditId(null);
            setFormData({ name: '', price: '', stock: '', category: '', image: '' });
            fetchMenu();
        }
    };

    const handleDelete = async (id) => {
        if (confirm("ဖျက်မှာ သေချာပါသလား?")) {
            const res = await fetch(`/api/data?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchMenu();
        }
    };

    const openEdit = (item) => {
        setEditId(item.id);
        setFormData({ name: item.name, price: item.price, stock: item.stock, category: item.category, image: item.image });
        setShowForm(true);
        window.scrollTo(0, 0);
    };

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            <div style={{ background: '#F2F2F7', minHeight: '100vh', padding: '15px', fontFamily: 'sans-serif' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link href="/admin" style={{ textDecoration: 'none', background: '#E5E5EA', color: '#1C1C1E', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' }}>
                            <i className="fas fa-chevron-left"></i> Dashboard
                        </Link>
                        <h2 style={{ margin: 0 }}>Menus</h2>
                    </div>
                    <button onClick={() => { setShowForm(!showForm); setEditId(null); setFormData({name:'', price:'', stock:'', category:'', image:''}); }} style={{ background: '#007AFF', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        <i className="fas fa-plus"></i> Add Menu
                    </button>
                </div>

                {/* Search Box */}
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="ရှာဖွေရန်..." 
                        value={searchCat} 
                        onChange={(e) => setSearchCat(e.target.value)} 
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                </div>

                {/* Form Section */}
                {showForm && (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '20px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0 }}>{editId ? 'ပြင်ဆင်ရန်' : 'အသစ်ထည့်ရန်'}</h3>
                        <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #E5E5EA', boxSizing: 'border-box' }} placeholder="Dish Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input type="number" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E5E5EA' }} placeholder="Price" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            <input type="number" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E5E5EA' }} placeholder="Stock" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                        </div>
                        <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #E5E5EA', boxSizing: 'border-box' }} placeholder="Category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                        <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #E5E5EA', boxSizing: 'border-box' }} placeholder="Image URL" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                        <button onClick={handleSave} style={{ width: '100%', background: '#007AFF', color: 'white', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>SAVE</button>
                        <button onClick={() => setShowForm(false)} style={{ width: '100%', background: 'none', border: 'none', color: '#FF3B30', padding: '10px', fontWeight: '600', cursor: 'pointer' }}>CANCEL</button>
                    </div>
                )}

                {/* List Section */}
                <div style={{ display: 'grid', gap: '12px' }}>
                    {loading ? <p style={{ textAlign: 'center' }}>Loading...</p> : 
                     filteredDisplayMenu.length > 0 ? filteredDisplayMenu.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '16px', gap: '12px' }}>
                            <img src={item.image || 'https://via.placeholder.com/55'} style={{ width: '55px', height: '55px', borderRadius: '10px', objectFit: 'cover' }} alt={item.name} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700' }}>{item.name}</div>
                                <div style={{ color: '#007AFF', fontWeight: '700' }}>{item.price} Ks</div>
                                <div style={{ fontSize: '11px', color: '#8E8E93' }}>{item.category} • Stock: {item.stock}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <i className="fas fa-edit" style={{ color: '#007AFF', cursor: 'pointer' }} onClick={() => openEdit(item)}></i>
                                <i className="fas fa-trash" style={{ color: '#FF3B30', cursor: 'pointer' }} onClick={() => handleDelete(item.id)}></i>
                            </div>
                        </div>
                    )) : <p style={{ textAlign: 'center', color: '#888' }}>ဟင်းပွဲမတွေ့ပါ</p>}
                </div>
            </div>
        </>
    );
}
