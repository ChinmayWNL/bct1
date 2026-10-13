import './globals.css'

export const metadata = {
  title: 'BlockChat — Sovereign Web3 Messaging & Crypto Transfers',
  description: 'End-to-end encrypted messaging, peer-to-peer voice & video calls, and instant crypto tipping powered by Ethereum and XMTP.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
