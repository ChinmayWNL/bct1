import './globals.css'
import './arcade-polish.css'
import './features.css'

export const metadata = {
  title: 'BlockChat Arcade — 8-Bit Web3 Messaging & Crypto Transfers',
  description: 'Decentralized 8-bit retro arcade messenger with end-to-end encryption, peer-to-peer voice & video calls, and instant crypto tipping powered by Ethereum and XMTP.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#12091f',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
