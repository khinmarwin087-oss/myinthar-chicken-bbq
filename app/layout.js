export const metadata = {
  title: 'YNS Kitchen - Customer Dashboard',
  description: 'VPN-Free Food Ordering System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="my">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
