import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        
        // Order data တွေကို firebase ထဲက "orders" collection ထဲသိမ်းမယ်
        const orderData = {
            ...body,
            status: "pending", // အော်ဒါအသစ်ဆိုတော့ စောင့်ဆိုင်းဆဲလို့ သတ်မှတ်မယ်
            createdAt: serverTimestamp() // တင်တဲ့အချိန်ကို မှတ်မယ်
        };

        const docRef = await addDoc(collection(db, "orders"), orderData);
        return NextResponse.json({ success: true, id: docRef.id });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

