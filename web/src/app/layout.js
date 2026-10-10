import './globals.css'

export const metadata = {
  title: 'Decentralized WhatsApp',
  description: 'Web3 messaging application using XMTP',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
