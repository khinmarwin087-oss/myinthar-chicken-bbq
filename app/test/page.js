"use client";
import { useEffect, useState } from 'react';
// ဒီနေရာမှာ လမ်းကြောင်း (၃) မျိုး စမ်းကြည့်ပါမယ်
import { db } from "../lib/firebase"; 

export default function TestPage() {
  const [msg, setMsg] = useState("စစ်ဆေးနေဆဲ...");

  useEffect(() => {
    async function check() {
      try {
        if (!db) {
          setMsg("❌ Firebase DB ကို ရှာမတွေ့ပါ။ lib/firebase.js ဖိုင်ကို စစ်ပါ။");
          return;
        }
        setMsg("✅ Firebase ချိတ်ဆက်မှု အခြေခံ အောင်မြင်သည်။ Data ဖတ်ကြည့်ပါမည်...");
        
        // Firestore ထဲက orders collection ကို တကယ်လှမ်းဖတ်တာ
        const { collection, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, "orders"));
        
        setMsg(`✅ အားလုံးအိုကေသည်။ အော်ဒါ ${snap.docs.length} ခု ရှိပါသည်။`);
      } catch (err) {
        setMsg("⚠️ Error: " + err.message);
      }
    }
    check();
  }, []);

  return (
    <div style={{ padding: '30px', background: '#1a1a1a', color: '#00ff00', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h2>Firebase Connection Test</h2>
      <div style={{ padding: '15px', border: '1px solid #00ff00', borderRadius: '8px' }}>
        {msg}
      </div>
      <p style={{ color: '#888', marginTop: '20px' }}>
        * Error တက်ရင် စာသားကို အကုန်ကူးပြီး ပြန်ပြောပေးပါဗျာ။
      </p>
    </div>
  );
}
