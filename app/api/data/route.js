import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { NextResponse } from "next/server";

// 1. GET - Menu များ ဆွဲထုတ်ရန်
export async function GET() {
    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// 2. POST - Menu အသစ်ထည့်ရန်
export async function POST(req) {
    try {
        const body = await req.json();
        // Firebase ထဲမှာ 'menu' ဆိုတဲ့ collection နာမည်နဲ့ သိမ်းမယ်
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
