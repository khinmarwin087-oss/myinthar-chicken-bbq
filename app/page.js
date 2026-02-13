"use client";
import { useEffect, useState } from 'react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
// --- အသစ်ဖြည့်စွက်ချက် (မဖျက်ပါနဲ့) ---
// line 5 မှာ အောက်ပါအတိုင်း ပြင်ပါ
import { auth } from "../lib/firebase"; 
// ----------------------------------
import { db, auth } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Home() {
  const [currentDate, setCurrentDate] = useState("Loading date...");
  const [user, setUser] = useState(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const audioRef = useRef(null);
  
  useEffect(() => {
        // အသံဖိုင်အဖြစ် အသုံးပြုရန် (Public folder ထဲတွင် notification.mp3 ရှိရမည်)
        audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

        const q = query(collection(db, "orders"), where("status", "==", "pending"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // အော်ဒါအသစ်ရှိပါက အသံမြည်စေရန်
                audioRef.current.play().catch(e => console.log("Audio play failed:", e));
                
                // အနီစက်ပြရန်အတွက် Count သတ်မှတ်ခြင်း
                setNewOrderCount(snapshot.size);
  useEffect(() => {
    // ၁။ အသံဖိုင် Setup
    audioRef.current = new Audio('/soundreality-notification-3-158189.mp3');

                // Browser Notification ပြရန် (Dashboard ဖွင့်ထားလျှင်)
                if (Notification.permission === "granted") {
                    new Notification("အော်ဒါအသစ် တက်လာပါပြီ!", {
                        body: `ယခု အော်ဒါအသစ် ${snapshot.size} ခု ရှိနေပါသည်၊`,
                        icon: "/logo.png"
                    });
                }
            } else {
                setNewOrderCount(0);
            }
        });
    // ၂။ Pending Orders ကို စောင့်ကြည့်ခြင်း (Real-time)
    const q = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // အော်ဒါအသစ်ရှိရင် အသံမြည်စေရန်
        audioRef.current.play().catch(e => console.log("Audio play blocked:", e));
        setNewOrderCount(snapshot.size);

        // Notification Permission တောင်းရန်
        if (Notification.permission !== "denied") {
            Notification.requestPermission();
        // Browser Notification ပြရန်
        if (Notification.permission === "granted") {
          new Notification("အော်ဒါအသစ် တက်လာပါပြီ!", {
            body: `ယခု အော်ဒါအသစ် ${snapshot.size} ခု ရှိနေပါသည်၊`,
            icon: "/logo.png"
          });
        }
      } else {
        setNewOrderCount(0);
      }
    });

        return () => unsubscribe();
    }, []);
    return (
        <div>
            {/* Orders Icon တွင် အနီစက်ပြရန် */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <i className="fas fa-shopping-basket" style={{ fontSize: '24px' }}></i>
                {newOrderCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-5px', right: '-5px',
                        background: 'red', color: 'white', borderRadius: '50%',
                        padding: '2px 6px', fontSize: '10px', fontWeight: 'bold'
                    }}>
                        {newOrderCount}
                    </span>
                )}
            </div>
            <p>Orders Live</p>
        </div>
    );
}
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    // ၃။ User Authentication & Date
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
    return () => unsubscribe();
    // ၄။ Notification ခွင့်ပြုချက်တောင်းရန်
    if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
    return () => {
      unsubscribeOrders();
      unsubscribeAuth();
    };
  }, []);
  // ----------------------------------

  return (
    <>
@@ -84,13 +59,14 @@ export default function Home() {
        .welcome-header h1 { margin: 0; font-size: 24px; font-weight: 800; }
        .welcome-header p { margin: 5px 0 0; color: var(--gray); font-size: 14px; text-transform: capitalize; }
        .grid-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .stat-card { background: var(--pearl); padding: 20px; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-decoration: none; color: inherit; transition: 0.3s; border: 1px solid rgba(0,0,0,0.02); display: block; }
        .stat-card { background: var(--pearl); padding: 20px; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-decoration: none; color: inherit; transition: 0.3s; border: 1px solid rgba(0,0,0,0.02); display: block; position: relative; }
        .stat-card:active { transform: scale(0.95); background: #f9f9fb; }
        .icon-circle { width: 45px; height: 45px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; font-size: 20px; }
        .bg-blue { background: rgba(0, 122, 255, 0.1); color: var(--primary); }
        .bg-purple { background: rgba(175, 82, 222, 0.1); color: var(--accent); }
        .stat-card b { display: block; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .stat-card span { font-size: 10px; color: var(--gray); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .red-dot { position: absolute; top: 15px; right: 15px; background: #FF3B30; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; }
        .banner-card { background: linear-gradient(135deg, #007AFF, #00C7BE); border-radius: 24px; padding: 25px; color: white; margin-bottom: 25px; position: relative; overflow: hidden; box-shadow: 0 10px 20px rgba(0,122,255,0.2); }
        .banner-card h2 { margin: 0; font-size: 20px; font-weight: 800; }
        .section-title { font-size: 16px; font-weight: 800; margin-bottom: 15px; padding-left: 5px; }
@@ -116,6 +92,7 @@ export default function Home() {
            <div className="icon-circle bg-blue"><i className="fas fa-shopping-basket"></i></div>
            <span>Menu</span>
            <b>ဟင်းပွဲမှာယူရန်</b>
            {newOrderCount > 0 && <div className="red-dot">{newOrderCount}</div>}
        </Link>
        <Link href="/track" className="stat-card">
            <div className="icon-circle bg-purple"><i className="fas fa-truck-loading"></i></div>
@@ -132,19 +109,17 @@ export default function Home() {
        <i className="fas fa-chevron-right" style={{ color: '#C7C7CC', fontSize: '12px' }}></i>
      </Link>

      {/* --- ပြင်ဆင်ထားသော History Link (Folder နာမည်အတိုင်း href ပြောင်းထားသည်) --- */}
      <Link href="/history" className="action-item">
        <i className="fas fa-history" style={{ color: 'var(--orange)', width: '25px', textAlign: 'center' }}></i>
        <div style={{ flex: 1, fontWeight: 700, fontSize: '14px' }}>
          {user ? "Order History" : "Login to see History"}
        </div>
        <i className="fas fa-chevron-right" style={{ color: '#C7C7CC', fontSize: '12px' }}></i>
      </Link>
      {/* ------------------------------------------------------------------- */}

      <div className="footer-note" style={{ textAlign: 'center', marginTop: '40px', color: 'var(--gray)', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
          YNS KITCHEN • VERSION 2.0.1
      </div>
    </>
  );
          }
          }
