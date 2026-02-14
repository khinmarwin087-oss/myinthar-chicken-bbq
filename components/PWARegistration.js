"use client";
import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then((reg) => console.log("PWA Service Worker Active!", reg.scope))
          .catch((err) => console.log("Service Worker Error:", err));
      });
    }
  }, []);

  return null; // UI မရှိတဲ့အတွက် ဘာမှမပြပါဘူး
}
