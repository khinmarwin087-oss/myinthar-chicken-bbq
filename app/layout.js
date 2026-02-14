export const metadata = {
  title: 'YNS Kitchen Admin', // လူကြီးမင်း ကြိုက်နှစ်သက်ရာ Title ပေးပါ
  description: 'VPN-Free Food Ordering System',
  manifest: '/manifest.json', // 👈 ဒါက အရေးကြီးဆုံးပါ။
}

export default function RootLayout({ children }) {
  return (
    <html lang="my">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
        {/* iOS အတွက် icon ပေါ်အောင် ဒါလေးပါ ထည့်ပေးထားပါ */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>{children}</body>
    </html>
  )
}

