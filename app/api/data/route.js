import admin from 'firebase-admin';
import { NextResponse } from 'next/server';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export async function GET() {
  const db = admin.firestore();
  const snapshot = await db.collection('your-collection').get(); // မင်းရဲ့ collection နာမည်ပြောင်းပါ
  const data = snapshot.docs.map(doc => doc.data());
  return NextResponse.json(data);
}

