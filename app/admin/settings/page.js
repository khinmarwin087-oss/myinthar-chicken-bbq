"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const [newPass, setNewPass] = useState("");
  const router = useRouter();

  const handleUpdate = () => {
    if(newPass.length < 4) return alert("Password အနည်းဆုံး ၄ လုံးရှိရပါမည်");
    localStorage.setItem("adminPassword", newPass);
    alert("Password ပြောင်းလဲပြီးပါပြီ။");
    router.push("/admin");
  };

  return (
    <div style={{padding:20, fontFamily:'sans-serif'}}>
      <button onClick={() => router.back()} style={{background:'none', border:'none', fontSize:18, marginBottom:20}}>← Back</button>
      <h2>Settings</h2>
      <div style={{background:'#F2F2F7', padding:20, borderRadius:20, marginTop:20}}>
        <label style={{fontSize:13, fontWeight:'bold', color:'#8E8E93'}}>ADMIN PASSWORD ပြောင်းရန်</label>
        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Password အသစ်ရိုက်ပါ" style={{width:'100%', padding:15, borderRadius:12, border:'1px solid #DDD', marginTop:10, boxSizing:'border-box'}} />
        <button onClick={handleUpdate} style={{width:'100%', padding:15, background:'#007AFF', color:'#FFF', border:'none', borderRadius:12, marginTop:15, fontWeight:'bold'}}>Update Password</button>
      </div>
    </div>
  );
}

