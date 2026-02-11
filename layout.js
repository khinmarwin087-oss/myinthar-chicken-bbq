export const metadata = {
  title: 'My Website',
  description: 'Firebase VPN-Free Bridge',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

