import db from "@/lib/firebase"; // { } ကို ဖြုတ်ထားပါတယ်
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
        // body ထဲမှာ data ပါမပါ စစ်မယ်
        if (!body.name) return NextResponse.json({ success: false, error: "Data is missing" });
        
        const docRef = await addDoc(collection(db, "menu"), body);
        return NextResponse.json({ success: true, id: docRef.id });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// 3. PUT - Menu ပြန်ပြင်ရန်
export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, ...updateData } = body;
        if (!id) return NextResponse.json({ success: false, error: "ID is missing" });
        
        const docRef = doc(db, "menu", id);
        await updateDoc(docRef, updateData);
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
        if (!id) return NextResponse.json({ success: false, error: "ID is missing" });
        
        const docRef = doc(db, "menu", id);
        await deleteDoc(docRef);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
