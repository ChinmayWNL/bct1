## 👾 BlockChat Arcade (BlockChat 2.0)
### Decentralized 8-Bit Retro Web3 Messenger & Interactive Arcade Hub

BlockChat Arcade is a next-generation decentralized chat platform built on Ethereum and XMTP v3, offering a familiar WhatsApp-like user experience fused with Web3 privacy, wallet connectivity, and an authentic **8-bit retro arcade aesthetic**.

👉 **For the complete in-depth documentation, architecture diagrams, and working feature breakdown, see [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md).**

### 🌟 Core Working Highlights
- **Wallet-to-Wallet Messaging**: Pure cryptographic authentication via MetaMask / Web3Modal and XMTP v3 E2EE.
- **Two-Layer Privacy (Playfair Cipher)**: In-chat secret key matrix shields messages from shoulder-surfers with automatic inactivity locking.
- **In-Chat Web3 Financials**: Instant ETH tips with block explorer receipts, interactive payment requests, and `/split` bill tools.
- **1v1 Arcade Duels (`/duel`)**: Interactive commit-reveal Cypher RPS duels with live victory narratives and XP rewards.
- **Timelocked Vault Capsules (`/capsule`)**: Digital vaults with real-time countdown clocks and unsealing fanfares.
- **In-Chat Live Polls (`/poll`) & XP Gift Packets (`/gift`)**: Interactive voting bars and provably fair red-envelope drops.
- **Copilot Slash Terminal (`/`)**: Autocomplete floating palette for `/gas`, `/price`, `/flip`, `/roll`, `/trivia`, and `/export`.
- **Multiplayer Arcade Party Lobby (`/lobby`)**: Multi-user lobby with simulated squad members (`BlockBot`, `CypherPunk #42`, `PixelKnight`).
- **WebRTC Voice & Video Calling**: P2P audio and video calls with camera flip, mute, and fullscreen controls.
- **Web Audio API Sound Studio**: Procedurally generated 8-bit chiptune sound effects with quick mute toggle.
- **PWA & Desktop Alerts (`/notify`)**: Installable desktop/mobile progressive web app with background notifications.
- **6 Retro Cabinet Themes**: Arcade Neon, Gameboy Classic, Cyberpunk 2077, Espresso, Latte, and Mocha with dynamic CRT scanlines.

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
