# HANDOVER — Medium-effort features

Project: BlockChat Arcade (`web/`, Next.js 16, React 19, vanilla CSS, XMTP, ethers v6).
Main files: `web/src/app/page.js` (all state/logic), `web/src/app/globals.css`,
`web/src/app/arcade-polish.css` (visual layer), `web/src/app/features.css` (new feature styles),
`web/src/components/*`, `web/src/utils/*`. All three CSS files are imported in `layout.js`.

Rules: keep the 8-bit arcade theme, don't break existing features, run `npm run build` in `web/` after each step.
Use PowerShell `Select-String` instead of grep_search on `globals.css` (CRLF).

## Feature status
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Message search + pinned | ALREADY EXISTED | in-chat search (`showInChatSearch`), pinned chats, starred msgs |
| 2 | Disappearing messages | ALREADY EXISTED | `disappearingTimer`, `disappearing_config` msg |
| 3 | Polls | DONE | `/poll Q \| A \| B`, `PollCard.js` with live vote bar calculations |
| 4 | Payment request / split bill | DONE | requests existed; `/split [eth] [people] [note]` added (reuses `crypto_request`) |
| 5 | Gift packets | DONE | `/gift [xp] [slots]`, `GiftPacketCard.js`. XP rewards with provably fair distribution |
| 6 | ENS resolution | ALREADY EXISTED | `lookupAddress` / `resolveName` in page.js |
| 7 | Backup / export | DONE | `/export [json\|txt]` downloads the open conversation |
| 8 | PWA + notifications | DONE | `public/manifest.webmanifest`, `icon.svg`, `sw.js`; `/notify` enables desktop alerts |
| 9 | Group lobbies (party rooms) | DONE | `startPartyLobbyChat()`, `/lobby` command, sidebar lobby button, multi-player banter, group tags & sender badges |

## How the pieces work
- **Polls & Gift Packets**: Hidden `{type:'interaction', kind:'poll_vote'|'gift_claim', targetId, choice, ts}` messages.
  Aggregated by `applyInteraction` (`utils/interactions.js`) into `interactions` state in page.js
  (loaded across chat history, `processIncomingMessage`, and local `sendInteraction`).
- **Cards**: `PollCard.js` and `GiftPacketCard.js` render inside message streams alongside duel/capsule cards.
- **Group Party Lobby**:
  - Accessible via the sidebar Alien button (`PixelAlien`) or `/lobby` command.
  - Multi-member room featuring `You`, `BlockBot AI 🤖`, `CypherPunk #42`, and `PixelKnight 🛡️`.
  - Non-self messages render retro arcade sender tags with color-coded classes (`.peer-knight`, `.peer-cypher`, `.peer-bot`).
  - Multi-user poll voting and gift packet claiming simulation triggers across different peers over staggered timeouts.
- **Split Bill**:
  - `/split [eth] [people] [note]` calculates per-person invoice share and broadcasts an on-chain/interactive `crypto_request` invoice card with "Pay ETH Now" action.
- **Backup & Export**:
  - `/export` or `/export txt` bundles visible messages into formatted JSON or plaintext log and downloads file directly via browser Blob API.
- **PWA & Desktop Alerts**:
  - `manifest.webmanifest`, pixel SVG `icon.svg`, non-caching passthrough `sw.js`.
  - `/notify` asks for system Notification permission and alerts user when tab is inactive/backgrounded.

## Smart Contracts & Duels
- **ArcadeDuelEscrow.sol**:
  - Implements wagered 1v1 RPS commit-reveal escrow with Keccak256 salt commitments.
  - Timeout forfeiture mechanism (`claimTimeout`) allows opponent to claim pot after 15 min if challenger refuses to reveal.
  - Full cancellation mechanism (`cancelDuel`) allows challenger to withdraw stake if unaccepted after 1 hr.
  - 9/9 unit tests passing with Hardhat (`npx hardhat test`).
- **Duel Game Synchronization Fix**:
  - **Root Cause**: Opponent's stream message handler omitted `opponentChoice` on incoming reveal payloads and was vulnerable to echo messages reverting `resolved` status back to `waiting_reveal`. Additionally, `ArcadeDuelCard` relied on a fallback `isSent` that misidentified the opponent as challenger, and historical messages pushed duplicate unmerged duel subactions.
  - **Fix Implemented**:
    1. Player identity detection now checks `isChallengerByAddr` and `isOpponentByAddr` explicitly before falling back to `isSent`.
    2. Incoming `reveal` and `respond` handlers in `page.js` never regress `resolved` status back to `waiting_reveal` and copy all duel choices and participant metadata.
    3. Added defensive winner calculation (`computedWinner`) and move normalization in `ArcadeDuelCard.js` so both players display the victory/defeat banner and round narrative consistently.
    4. Folded historical duel sub-actions (`challenger_committed`, `respond`, `reveal`) into the root challenge in `selectConversation`, preventing duplicate ghost cards on reload or chat switch.

## Verification & Build
- `npm run build` passes with code 0.
- `npx hardhat test` passes with 9/9 tests (code 0).
- Dev server running on `http://localhost:3000`.

## Log
- Created `utils/interactions.js`, `PollCard.js`, `GiftPacketCard.js`, `features.css`, PWA files.
- Wired polls, gift packets, split bill, export, notifications, and group party lobby into `page.js` and `layout.js`.
- Implemented `ArcadeDuelEscrow.sol`, deployment scripts, and unit tests.
- Fixed 1v1 Arcade Duel result display flaw across both players.
- Implemented `TimeCapsuleVault.sol` + tests, multi-contract `deploy.js`, `deployments.json`, and wired the capsule UI.

## On-chain rollout checklist (one contract at a time: build + `npx hardhat test` after each)
| Contract | Status |
|---|---|
| ArcadeDuelEscrow | DONE (9 tests, wired) |
| TimeCapsuleVault | DONE (6 tests, wired: `TimeCapsuleModal`, `TimeCapsuleCard`, `handleSendTimeCapsule`/`handleOpenTimeCapsule`) |
| InvoiceManager + SplitBill | DONE (8 tests, wired: `sendOnChainInvoice`, `handlePayOnChainInvoice`, `handleCancelOnChainInvoice`, status read from contract via `invoiceStatus`; `/split` = open invoice with `maxPayers = people-1`) |
| GiftPacketVault | DONE (8 tests, wired: `/gift [eth] [slots] [message]`, `handleSendGift`/`handleClaimGift`/`handleRefundGift`, `GiftPacketCard` on-chain variant; 24h expiry + creator refund; legacy XP cards still render) |
| PollRegistry | DONE (7 tests; `/poll` creates on-chain poll, `handleVotePoll`/`handleClosePoll`, PollCard on-chain variant; 24h deadline; legacy polls still render) |

Deploy all: `npx hardhat node` then `npx hardhat run scripts/deploy.js --network localhost`.
This writes `web/src/app/deployments.json`, which `contracts.js` reads (`getDeployedAddress`).
Add new contracts to the `CONTRACTS` array in `scripts/deploy.js`.
Decision: on-chain is REQUIRED for these features (no off-chain fallback). In the BlockBot chat, capsules are sealed to your own wallet.

