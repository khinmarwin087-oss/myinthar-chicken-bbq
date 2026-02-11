export const metadata = {
  title: 'Myinthar Chicken BBQ',
  description: 'VPN-Free Firebase Bridge',
}

export default function RootLayout({ children }) {
  return (
    <html lang="my">
      <head>
        {/* Google Fonts ထဲက ပြည်ထောင်စုဖောင့် သို့မဟုတ် ပုံမှန်ဖောင့်တစ်ခုခု ထည့်ခြင်း */}
        <link href="https://fonts.googleapis.com/css2?family=Padauk&family=Pyidaungsu&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: '"Pyidaungsu", "Padauk", sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
