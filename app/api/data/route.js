import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { NextRequest, NextResponse } from "next/server";

// Firebase Admin initialize (server-side အတွက်)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\
/g, '
'),
    }),
  });
}
const db = getFirestore(); // default export သုံး[web:6]

// 1. GET - Menu များ ဆွဲထုတ်ရန်
export async function GET() {
  try {
    const snapshot = await db.collection("menu").get();
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message });
  }
}

// 2. POST - Menu အသစ်ထည့်ရန်
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, error: "Data is missing" });
    
    const docRef = await db.collection("menu").add(body);
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message });
  }
}

// 3. PUT - Menu ပြန်ပြင်ရန်
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ success: false, error: "ID is missing" });
    
    await db.collection("menu").doc(id).update(updateData);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message });
  }
}

// 4. DELETE - Menu ဖျက်ရန်
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID is missing" });
    
    await db.collection("menu").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
