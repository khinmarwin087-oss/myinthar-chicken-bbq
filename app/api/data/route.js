import admin from 'firebase-admin';
import { NextResponse } from 'next/server';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // \n ကို real line break အဖြစ် ပြောင်းပေးဖို့ လိုပါတယ်
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function GET() {
  try {
    const db = admin.firestore();
    // မင်းရဲ့ collection နာမည်က 'posts' ဖြစ်ရပါမယ်။ 
    // Firebase ထဲမှာ ဘာနာမည်ပေးထားလဲ ပြန်စစ်ပြီး ဒီမှာ လာပြင်ပါ။
    const snapshot = await db.collection('posts').get(); 
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
