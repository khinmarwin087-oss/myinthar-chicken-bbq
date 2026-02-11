"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, pending: 0 });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        // API မှတစ်ဆင့် Order အချက်အလက်များကို ယူပြီး Dashboard တွက်ချက်မည်
        fetch('/api/orders') // Order API (အဆင့် ၂ မှာ ဆောက်မယ်)
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    let rev = 0, ordCount = 0, pend = 0;
                    let custSet = new Set();

                    json.data.forEach(o => {
                        if (o.date === selectedDate) {
                            ordCount++;
                            if (o.status === 'Done') rev += parseInt(o.total || 0);
                            if (o.customerName) custSet.add(o.customerName);
                        }
                        if (o.status === 'Pending') pend++;
                    });

                    setStats({ revenue: rev, orders: ordCount, customers: custSet.size, pending: pend });
                }
            });
    }, [selectedDate]);

    return (
        <div style={{ background: '#F8F9FC', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#8E8E93', fontWeight: '600' }}>Mingalaba!</p>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>YNS Kitchen</h1>
                </div>
                <div style={{ width: '35px', height: '35px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <i className="fas fa-user"></i>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ border: 'none', background: '#fff', padding: '8px 12px', borderRadius: '10px', fontWeight: '700', color: '#007AFF' }} 
                />
            </div>

            <div style={{ background: 'linear-gradient(135deg, #007AFF, #00D2FF)', borderRadius: '20px', padding: '22px', color: 'white', position: 'relative', marginBottom: '15px', boxShadow: '0 10px 25px rgba(0, 122, 255, 0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '11px', opacity: 0.9, textTransform: 'uppercase' }}>Total Revenue</h3>
                <span style={{ fontSize: '32px', fontWeight: '800', display: 'block', margin: '8px 0' }}>{stats.revenue.toLocaleString()} Ks</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Updated just now</span>
                <i className="fas fa-chart-line" style={{ position: 'absolute', right: '15px', bottom: '15px', fontSize: '35px', opacity: 0.15 }}></i>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93' }}>TOTAL ORDERS</span><br/>
                    <span style={{ fontSize: '18px', fontWeight: '800' }}>{stats.orders}</span>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93' }}>CUSTOMERS</span><br/>
                    <span style={{ fontSize: '18px', fontWeight: '800' }}>{stats.customers}</span>
                </div>
            </div>

            <span style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Management</span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'white', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ color: '#007AFF' }}><i className="fas fa-shopping-basket"></i></div>
                        <div>
                            <b style={{ color: '#1C1C1E' }}>Orders {stats.pending > 0 && <span style={{ background: '#FF3B30', color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px' }}>{stats.pending}</span>}</b>
                            <span style={{ fontSize: '11px', color: '#8E8E93' }}>Live Orders</span>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/manage_menu" style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'white', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ color: '#5856D6' }}><i className="fas fa-utensils"></i></div>
                        <div>
                            <b style={{ color: '#1C1C1E' }}>Menus</b>
                            <span style={{ fontSize: '11px', color: '#8E8E93' }}>Edit Dishes</span>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
                              }
                            
