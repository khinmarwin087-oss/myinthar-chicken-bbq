importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// လူကြီးမင်း ပို့ပေးထားတဲ့ ID များဖြင့် အစားထိုးထားပါတယ်
const firebaseConfig = {
    apiKey: "AIzaSyB3SaXUOzDh9_DVbuupon7BsCgZfw5UzZ4",
    authDomain: "myrestaurantapp-a14d4.firebaseapp.com",
    databaseURL: "https://myrestaurantapp-a14d4-default-rtdb.asia-southeast1.firebaseddatabase.app",
    projectId: "myrestaurantapp-a14d4",
    storageBucket: "myrestaurantapp-a14d4.firebasestorage.app",
    messagingSenderId: "123788707874",
    appId: "1:123788707874:web:6593b827b284cc7cb9a27b",
    measurementId: "G-E8X5BR4NKP"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// နောက်ကွယ်မှာ ရှိနေချိန် (Background) Notification စာတက်လာအောင် လုပ်ဆောင်ခြင်း
messaging.onBackgroundMessage((payload) => {
  console.log('Background Message Received:', payload);
  const notificationTitle = payload.notification.title || "YNS Kitchen";
  const notificationOptions = {
    body: payload.notification.body || "အော်ဒါအသစ် ရောက်ရှိလာပါပြီ။",
    icon: '/icon-192.png' // Icon ပုံရှိဖို့ လိုပါတယ်
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

