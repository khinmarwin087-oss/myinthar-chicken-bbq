"use client";
import { useEffect, useState } from 'react';
import { db } from "../lib/firebase"; 
import { collection, getDocs } from "firebase/firestore";

export default function TestPage() {
    const [messages, setMessages] = useState([]);

    const log = (text) => {
        setMessages(prev => [...prev, text]);
    };

    useEffect(() => {
        const checkData = async () => {
            log("⏳ Firebase ကို စစ်ဆေးနေပါပြီ...");
            try {
                const querySnapshot = await getDocs(collection(db, "orders"));
                log("✅ Firebase ချိတ်ဆက်မှု အောင်မြင်သည်!");
                log("📊 စုစုပေါင်း အော်ဒါအရေအတွက်: " + querySnapshot.docs.length);

                if (querySnapshot.docs.length > 0) {
                    const data = querySnapshot.docs[0].data();
                    log("📝 ပထမဆုံး အော်ဒါမှ Status: " + (data.status || "မရှိပါ"));
                    log("📅 ပထမဆုံး အော်ဒါမှ Date: " + (data.date || "မရှိပါ"));
                } else {
                    log("❌ Database ထဲမှာ အော်ဒါ လုံးဝမရှိသေးပါ။");
                }
            } catch (error) {
                log("⚠️ အမှားတွေ့ရှိသည်: " + error.message);
            }
        };
        checkData();
    }, []);

    return (
        <div style={{ padding: '20px', background: '#1a1a1a', color: '#00ff00', minHeight: '100vh', fontFamily: 'monospace', fontSize: '14px' }}>
            <h2 style={{ color: '#fff' }}>System Debugger</h2>
            <hr style={{ borderColor: '#333' }} />
            {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>{m}</div>
            ))}
            <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px', background: '#444', color: '#fff', border: 'none', borderRadius: '5px' }}>
                ထပ်စစ်မည်
            </button>
        </div>
    );
  }

