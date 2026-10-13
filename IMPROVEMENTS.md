# BlockChat 2.0 — Non-UI Engineering & Architecture Improvements

This document details all technical, security, protocol, and performance improvements implemented across the BlockChat 2.0 codebase. All changes focus exclusively on non-UI aspects: architecture, Web3/blockchain mechanics, audio engineering, memory management, and data integrity.

---

## 1. Executive Summary

| Domain | Problem Identified | Implemented Solution | Impact |
| :--- | :--- | :--- | :--- |
| **Privacy & Security** | User wallet address transmitted to 3rd-party HTTP API (`api.qrserver.com`) to generate QR codes | Replaced with offline, client-side QR generation using `qrcode.toCanvas` | Zero external network calls; 100% private & offline-capable |
| **Audio Playback** | Changing playback speed (1x $\rightarrow$ 1.5x $\rightarrow$ 2x) reset voice note audio to 0:00; multiple audios played over each other | Decoupled `playbackSpeed` from `useEffect` audio re-instantiation; implemented app-wide single-track audio coordinator & waveform seeking | Audio keeps playing seamlessly across speed changes; no audio overlapping; waveform scrubbing enabled |
| **Web3 Wallet Sync** | Account switching or network changing in MetaMask was ignored; app stayed on stale account | Added EIP-1193 event listeners (`accountsChanged`, `chainChanged`) | Real-time wallet synchronization; prevents signing with wrong accounts |
| **Multi-Chain Support** | Smart contract registry hardcoded to local Hardhat address (`0x5FbD...`) | Added dynamic chain ID mapping (`getUserRegistryAddress(chainId)`) for Sepolia, Arbitrum, Base, Polygon, and Hardhat | Contract queries work dynamically across testnets and L2s |
| **Crypto Transfers** | `parseFloat` precision loss on small ETH values; ignored gas fees; optimistic receipt without confirmation tracking | Migrated to native `ethers.parseEther`/BigInt; added address format validation; gas buffer checking; dynamic `pending` $\rightarrow$ `confirmed` states | Safe financial precision; no unhandled out-of-gas errors; accurate explorer links by chain ID |
| **Receipt Display** | Sent ETH transactions displayed positive `+{amount} ETH` | Dynamic sign: `-{amount} ETH` on outgoing, `+{amount} ETH` on incoming | Accurate financial ledger display |
| **Message Authorization** | Client-side "delete" and "edit" accepted payloads without verifying sender | Sender verification check: `target.senderInboxId === message.senderInboxId` | Prevents unauthorized tampering or forgery of messages |
| **Stream Leaks** | Switching conversations created orphaned async generator stream loops | Introduced `activeStreamIdRef` cancellation guard | Halts background stream loops immediately on chat change |
| **Performance** | Synchronous JSON/regex parsing on every single render in drawer & message lists | Wrapped message parsing, conversation sorting, and filtering in `useMemo` | Eliminates UI lag and eliminates redundant CPU cycles |
| **Media Calling** | Voice calls (`callType === 'voice'`) never requested microphone audio | Configured media constraints to acquire audio on voice calls; fixed track mute states | Audio captured properly for voice calling; consistent mute states |
| **Input Validation** | Malicious URLs or malformed usernames accepted in Profile modal | Added regex validation for usernames and scheme sanitization for avatar URLs | Protects against XSS schemes (`javascript:`) and malformed CIDs |

---

## 2. Deep Dive: Component Modifications

### 2.1 [QRCodeModal.js](file:///s:/blockchain/web/src/components/QRCodeModal.js) — Offline Privacy Preservation
- **Previous behavior**: Rendered `<img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(address)}..." />`.
- **Vulnerability**: Every time the QR code modal opened, the user's wallet address and IP were transmitted in cleartext HTTP to an external third-party server.
- **Fix**:
  - Integrated `qrcode` npm package.
  - Generates the QR code directly into a `<canvas>` element via `QRCode.toCanvas`.
  - Added `try/catch` error boundary around clipboard writes (`navigator.clipboard.writeText`).

### 2.2 [VoiceNotePlayer.js](file:///s:/blockchain/web/src/components/VoiceNotePlayer.js) — Audio Lifecycle & Scrubbing
- **Previous behavior**: `useEffect` had `[audioUrl, playbackSpeed]` as dependencies. Whenever the user pressed the speed multiplier (`1.5x` or `2x`), the effect cleanup ran, paused the audio, cleared `audio.src = ''`, and created a new `Audio` object, resetting `currentTime` to `0`.
- **Fix**:
  - Removed `playbackSpeed` from the dependency array so the audio instance persists throughout speed adjustments.
  - Speed changes directly mutate `audioRef.current.playbackRate`.
  - **Single-Audio Coordinator**: Dispatches a `blockchat:audio-play` window event whenever a voice note starts playing, causing all other active players to pause.
  - **Waveform Seeking**: Added `handleWaveformSeek` which maps the click position on the waveform container to `currentTime = ratio * totalDuration`.

### 2.3 [CryptoReceipt.js](file:///s:/blockchain/web/src/components/CryptoReceipt.js) — Accurate Ledger & Chain Explorer Resolution
- **Previous behavior**:
  - Sent receipts displayed `+{amount} ETH` (positive sign).
  - Explorer URLs relied on fragile substring matching of `networkName` strings (e.g. `networkName.includes('sepolia')`).
  - Lacked transaction confirmation state.
- **Fix**:
  - Fixed amount display: `isSent ? -amount : +amount`.
  - Added EIP-155 `chainId` prop mapping (Sepolia: `11155111`, Arbitrum: `42161`, Base: `8453`, Optimism: `10`, Polygon: `137`, Mainnet: `1`).
  - Added dynamic transaction status badge (`pending` with pulse indicator vs `confirmed`).

### 2.4 [SendCryptoModal.js](file:///s:/blockchain/web/src/components/SendCryptoModal.js) — Financial Precision & Gas Awareness
- **Previous behavior**: Used `parseFloat(amount)` for balance comparison and validation. Floating point representation in JS can format small numbers to exponential strings (e.g., `1e-7`), causing `ethers.parseEther` to throw an error. Did not validate recipient format or account for gas fees.
- **Fix**:
  - Validated amount string with strict regex `/^\d+(\.\d{1,18})?$/`.
  - Converted amounts via native `ethers.parseEther` (BigInt).
  - Validated recipient address with `ethers.isAddress(recipientAddress)`.
  - Included gas fee buffer check against `userBalance`.
  - Returns optimistic broadcast hash with `status: 'pending'`, followed by background `tx.wait(1)` tracking to emit `status: 'confirmed'`.

### 2.5 [CallModal.js](file:///s:/blockchain/web/src/components/CallModal.js) & [IncomingCallModal.js](file:///s:/blockchain/web/src/components/IncomingCallModal.js) — Peer-to-Peer WebRTC Voice & Video Calling
- **Previous behavior**: Simulated calls locally with a static `setTimeout` after 2.6s. No signaling channel existed; calling a peer transmitted nothing, the receiver was never alerted, and no audio or video tracks flowed between devices.
- **Fix**:
  - **Decentralized XMTP Signaling Pipeline**: Exchanged WebRTC signaling payloads (`call_signal`) end-to-end encrypted over XMTP:
    - `offer`: Caller captures local camera/mic, sets local SDP offer, and transmits offer to receiver.
    - `answer`: Receiver sets remote SDP offer, generates local SDP answer, and returns answer to caller.
    - `candidate`: Gathers and exchanges network ICE candidates via Google STUN servers (`stun:stun.l.google.com:19302`).
    - `reject` / `end`: Synchronously terminates media tracks and closes peer connections on both ends.
  - **Incoming Call Dialog ([IncomingCallModal.js](file:///s:/blockchain/web/src/components/IncomingCallModal.js))**: Receiver gets an incoming ringing modal showing Caller ID, animated pulsing rings, ringtone chime, and circular Accept (📞) and Decline (✕) buttons.
  - **Bidirectional Media Streams**: Full remote video display with Picture-in-Picture (PiP) local preview, dedicated remote `<audio>` playback element, dynamic microphone mute toggles, and camera video toggles.
  - **BlockBot Companion Simulation**: When testing with BlockBot (`isDemoBot`), automatically simulates response after 2.2s so users can verify their camera and mic without a second device.

### 2.5.1 WebRTC Signaling State Machine & Media Pipeline Hardening
- **Problem Identified**:
  - **`InvalidStateError: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': Failed to set remote answer sdp: Called in wrong state: stable`**: In XMTP v3, `conversation.stream()` yields all messages including those sent by the local client. When the receiver accepted a call and dispatched an `answer` payload over XMTP, the receiver's own message stream echoed the `answer` back to itself. Because the receiver was already in `signalingState = 'stable'`, executing `pc.setRemoteDescription(answer)` violated the WebRTC state machine and crashed negotiation.
  - **Video Appearing Black**: Remote `<video>` was placed in `display: none` until `hasRemoteVideo` flipped, causing modern Chromium/WebKit rendering engines to halt video frame decoding. Additionally, unmuted `<video>` elements triggered browser Autoplay Policy blocks without user gesture on that specific DOM node.
  - **Voice Call Not Connecting**: Single-track arrivals (`event.streams[0] === undefined`) caused tracks to be discarded. In addition, `srcObject` assignments relied on transient synchronous refs without React state bindings, failing to attach across re-renders.
- **Implemented Fixes**:
  - **Loopback Filtering in `page.js`**: `processIncomingMessage` filters out any `call_signal` where `message.senderInboxId === xmtpClient?.inboxId`, `data.senderInboxId === xmtpClient?.inboxId`, or `data.senderAddress === account`.
  - **Signaling State Guards**: In `CallModal.js`, `handleSignalEvent` strictly validates `pc.signalingState === 'have-local-offer'` before invoking `pc.setRemoteDescription(answer)`. Answers received when already `stable` are safely dropped with a console warning.
  - **Media Stream State Hooks & Explicit Playback**: Stored `localStream` and `remoteStream` in React state (`useState`) with dedicated `useEffect` listeners binding `srcObject` and executing `.play().catch(...)`.
  - **Autoplay Compliance & Echo Prevention**: Remote `<video>` is `muted` with smooth opacity transitions (`opacity: hasRemoteVideo ? 1 : 0`), allowing background hardware decoding while eliminating Autoplay Policy rejections. Incoming audio is routed cleanly through a dedicated `<audio ref={remoteAudioRef} autoPlay playsInline />` element for both voice and video calls.
  - **Candidate Serialization & Fallback MediaStream**: Ensured candidates are serialized via `event.candidate.toJSON()` and tracks without container streams dynamically instantiate a fallback `new MediaStream([event.track])`. Attached `oniceconnectionstatechange` to track connection status changes immediately.

### 2.6 [ContactInfoDrawer.js](file:///s:/blockchain/web/src/components/ContactInfoDrawer.js) — Memoized Gallery & Audio Playback
- **Previous behavior**: Iterated through all messages and parsed JSON strings on every render without memoization. Voice notes in the media drawer could not be played.
- **Fix**:
  - Wrapped `photos`, `voiceNotes`, and `starredList` derivation in `useMemo([messages, starredMessages])`.
  - Embedded `<VoiceNotePlayer />` directly in the voice gallery tab so users can listen to archived voice notes.
  - Wrapped `handleCopy` in `try/catch`.

### 2.7 [ProfileModal.js](file:///s:/blockchain/web/src/components/ProfileModal.js) — Sanitization & Protocol Validation
- **Previous behavior**: Accepted arbitrary username strings and avatar URLs without validation.
- **Fix**:
  - Enforced username constraints: alphanumeric and underscores only (`^[a-zA-Z0-9_]{3,20}$`).
  - Sanitized avatar URLs: verified scheme (`https://`, `ipfs://`, `Qm...`, `bafy...`) and explicitly rejected `javascript:` or `data:text/html` injection vectors.
  - Provided immediate client-side error feedback banner.

### 2.8 [contracts.js](file:///s:/blockchain/web/src/app/contracts.js) — Multi-Chain Registry Mapping
- **Previous behavior**: Static contract address string defaulting only to Hardhat localhost.
- **Fix**:
  - Exported `USER_REGISTRY_ADDRESSES` dictionary keyed by standard chain IDs.
  - Exported `getUserRegistryAddress(chainId)` helper function for dynamic contract binding.

### 2.9 [page.js](file:///s:/blockchain/web/src/app/page.js) — Core Orchestration & Security Hardening
- **Stream Cancellation Guard**: `activeStreamIdRef` increments on every conversation switch. If a conversation change occurs while a stream is streaming, the async generator loop cleanly terminates, preventing zombie memory leaks.
- **EIP-1193 Provider Lifecycle**: Attached `accountsChanged` and `chainChanged` listeners on `window.ethereum`. Account switching re-initializes signers and address state; network switching triggers provider refresh.
- **Message Authorization for Deletes & Edits**: Added ownership verification in `processIncomingMessage`. Prevents forged control payloads from editing or deleting messages sent by other parties.
- **Disappearing Messages Sync**: Setting disappearing message intervals now broadcasts an XMTP configuration payload (`disappearing_config`) so counterparties automatically match the expiration settings.
- **Memoization**: `filteredConversations`, `pinnedCount`, and `visibleMessages` are wrapped in `useMemo` to eliminate re-rendering lag during typing and scrolling.

### 2.10 Reaction State Machine & Stream Echo Decoupling
- **Problem Identified**:
  - Reactions disappeared on the reacting user's screen moments after reacting, but remained visible to the recipient.
  - **Root Cause**: `handleAddReaction` optimistically toggled the emoji into local `reactionsMap`. When the reaction was broadcast over XMTP, the conversation stream echoed the message back to the sender. `processIncomingMessage` ran the identical toggle logic (`existing.includes(emoji) ? remove : add`) without checking `isFromSelf`. Because the emoji had just been added optimistically, the incoming echo found `existing.includes(emoji) === true` and promptly deleted it, causing the sender's reaction to vanish. Furthermore, reactions lacked per-user tracking, meaning reacting to a message could unintentionally toggle off another user's reaction of the same emoji.
- **Implemented Fix**:
  - **Self-Echo Filtering**: `processIncomingMessage` drops self-broadcast reaction messages (`message.senderInboxId === xmtpClient?.inboxId || data.senderAddress === walletAddress`).
  - **Per-User Reaction Matrix (`reactionUsersMapRef`)**: Reactions are tracked per-user per-message (`{ [targetId]: { [senderId]: emoji } }`).
  - **Explicit Action Semantics**: Payloads specify `action: 'add'` or `action: 'remove'`, guaranteeing deterministic idempotency.
  - **Pill Click-to-Toggle**: Users can click existing reaction pills under message bubbles to quickly toggle off or change their reactions.

---

## 3. Verification & Validation

- **Turbopack Dev Server**: All modified files compiled with 0 errors (`GET / 200`).
- **Offline QR Code**: Verified client-side canvas generation without 3rd-party network requests.
- **Voice Note Playback**: Audio playback rate changes seamlessly without resetting `currentTime`.
- **Contract & Chain Resolution**: Verified chain ID propagation to `CryptoReceipt` and contract address mapping.
