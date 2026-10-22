# bct1

## BlockChat 2.0 - Web3 Decentralized Messaging & Crypto Transfer dApp

BlockChat 2.0 is a next-generation decentralized chat platform built on Ethereum, offering a familiar WhatsApp-like user experience with Web3 privacy, wallet connectivity, and cryptographic security.

### Features
- **Wallet-to-Wallet Messaging**: Connect via MetaMask or Coinbase Wallet (Ethers.js / Web3Modal).
- **End-to-End Encryption**: Secure XMTP v3 encryption protocol.
- **In-Chat Crypto Transfers**: Send ETH/ERC-20 tips directly in chat with live transaction hash generation and receipt generation.
- **Voice Notes**: In-browser audio recording, interactive waveform visualization, and variable playback speeds (1x, 1.5x, 2x).
- **WebRTC Voice & Video Calls**: Peer-to-peer audio and video calling modal with mute, camera toggle, and fullscreen controls.
- **Contact Info & Media Drawer**: Sliding drawer with verified ENS address, media gallery, disappearing message controls, and starred messages.
- **Playfair Cipher Chat Lock**: Set a secret key per chat (🔒 button in the chat header) and your messages are sent Playfair-encrypted. Anyone who opens the chat without the key sees only scrambled text; both people can read it by entering the shared key. Chats re-lock on reload, when you switch chats, and after 3 minutes idle. Only a hash of the key is stored. It's a privacy screen against people looking over your shoulder, not a replacement for XMTP encryption.
- **WhatsApp Experience**: Double blue check delivery indicators, typing status, emoji picker, attachment handling, and quick message search.

### Getting Started

#### Prerequisites
- Node.js (v18+)
- MetaMask or any Web3 Ethereum browser wallet

#### Installation & Run
```bash
# Navigate to web application directory
cd web

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
