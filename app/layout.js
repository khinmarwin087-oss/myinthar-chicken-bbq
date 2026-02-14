import "./globals.css"; // လူကြီးမင်းမှာရှိတဲ့ CSS ဖိုင်ကို ထည့်ပါ
import PWARegistration from "../components/PWARegistration";

export const metadata = {
  title: 'YNS Kitchen', 
  description: 'VPN-Free Food Ordering System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'YNS Kitchen',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="my">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        {/* iOS Icon များအတွက် */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#007AFF" />
      </head>
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
