import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { NextResponse } from "next/server";

// Menu အားလုံးကို ပြန်ဖတ်ရန်
export async function GET() {
    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        const data = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// Menu အသစ်သိမ်းရန်
export async function POST(req) {
    try {
        const body = await req.json();
        // Firebase Collection နာမည် "menu" ထဲကို ထည့်မယ်
        const docRef = await addDoc(collection(db, "menu"), body);
        return NextResponse.json({ success: true, id: docRef.id });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}

// Menu ပြန်ပြင်ရန်
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

// Menu ဖျက်ရန်
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        await deleteDoc(doc(db, "menu", id));
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
