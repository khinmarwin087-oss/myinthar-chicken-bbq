import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { NextResponse } from "next/server";

// 1. GET - Menu များ ဆွဲထုတ်ရန်
export async function GET() {
    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        // ဤနေရာတွင် docs ဖြစ်ရပါမည် (Screenshot ထဲမှာ dacs လို့ မှားနေတာ တွေ့ပါတယ်)
        const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// 2. POST - Menu အသစ်ထည့်ရန် (SAVE ခလုတ် နှိပ်လျှင် ဤနေရာသို့ ရောက်လာမည်)
export async function POST(req) {
    try {
        const body = await req.json();
        const docRef = await addDoc(collection(db, "menu"), body);
        return NextResponse.json({ success: true, id: docRef.id });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// 3. PUT - Menu ပြန်ပြင်ရန်
export async function PUT(req) {
    try {
        const { id, ...data } = await req.json();
        const docRef = doc(db, "menu", id);
        await updateDoc(docRef, data);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// 4. DELETE - Menu ဖျက်ရန်
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const docRef = doc(db, "menu", id);
        await deleteDoc(docRef);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

