'use client';
import { useState } from 'react';
import { PixelSwords, PixelCoin, PixelTrophy, PixelZap } from './PixelIcons';

export const MOVES = [
  { id: 'rock', label: 'ROCK', icon: '✊', beats: 'scissors' },
  { id: 'paper', label: 'PAPER', icon: '✋', beats: 'rock' },
  { id: 'scissors', label: 'SCISSORS', icon: '✌️', beats: 'paper' }
];

export function determineRpsWinner(challengerMove, opponentMove) {
  if (!challengerMove || !opponentMove) return null;
  const c = challengerMove.toLowerCase();
  const o = opponentMove.toLowerCase();
  if (c === o) return 'draw';
  const moveObj = MOVES.find(m => m.id === c);
  if (moveObj && moveObj.beats === o) {
    return 'challenger';
  }
  return 'opponent';
}

export function getRpsNarrative(challengerMove, opponentMove, winner, challengerName = '1P', opponentName = '2P') {
  if (!challengerMove || !opponentMove) return '';
  const c = challengerMove.toLowerCase();
  const o = opponentMove.toLowerCase();
  if (winner === 'draw') {
    return `Both players threw ${c.toUpperCase()} — It's a draw!`;
  }
  const rules = {
    'rock:scissors': 'Rock crushes Scissors!',
    'scissors:paper': 'Scissors cuts Paper!',
    'paper:rock': 'Paper covers Rock!'
  };
  const winningMove = winner === 'challenger' ? c : o;
  const losingMove = winner === 'challenger' ? o : c;
  const winnerName = winner === 'challenger' ? challengerName : opponentName;
  const key = `${winningMove}:${losingMove}`;
  const action = rules[key] || `${winningMove.toUpperCase()} beats ${losingMove.toUpperCase()}!`;
  return `${action} ${winnerName} takes the round!`;
}

export default function ArcadeDuelCard({
  duelData,
  currentAddress,
  currentInboxId,
  isSent,
  onLockChallengerMove,
  onRespondMove,
  onStartNewDuel,
  onClaimTimeout,
  chainId
}) {
  const [selectedMove, setSelectedMove] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Player identity detection with robust address / inbox matching
  const isChallengerByAddr = Boolean(
    (currentAddress && duelData.challenger && currentAddress.toLowerCase() === duelData.challenger.toLowerCase()) ||
    (currentInboxId && duelData.challengerInboxId && currentInboxId === duelData.challengerInboxId)
  );
  const isOpponentByAddr = Boolean(
    (currentAddress && duelData.opponent && currentAddress.toLowerCase() === duelData.opponent.toLowerCase()) ||
    (currentInboxId && duelData.opponentInboxId && currentInboxId === duelData.opponentInboxId)
  );

  let isChallenger = false;
  if (isChallengerByAddr) {
    isChallenger = true;
  } else if (isOpponentByAddr) {
    isChallenger = false;
  } else {
    isChallenger = Boolean(isSent);
  }
  const isOpponent = !isChallenger;

  const status = duelData.status || 'waiting_challenger_pick';
  const isWaitingChallenger = status === 'waiting_challenger_pick';
  const isWaitingOpponent = status === 'waiting_opponent' || status === 'pending';
  const isWaitingReveal = status === 'waiting_reveal';
  const isResolved = status === 'resolved';

  const formatShort = (addr) => {
    if (!addr) return 'Player';
    if (addr === 'BlockBot' || addr === 'BlockBot AI 🤖') return 'BlockBot';
    if (addr.startsWith('0x') && addr.length === 42) {
      return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    }
    return addr;
  };

  const challengerName = isChallenger ? 'YOU (P1)' : formatShort(duelData.challenger);
  const opponentName = isOpponent ? 'YOU (P2)' : (duelData.opponent ? formatShort(duelData.opponent) : 'Player 2');

  // Challenger picks initial hand
  const handleChallengerPick = async (moveId) => {
    if (isSubmitting) return;
    setSelectedMove(moveId);
    setIsSubmitting(true);
    try {
      if (onLockChallengerMove) {
        await onLockChallengerMove(duelData.duelId, moveId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opponent picks defending hand
  const handleOpponentPick = async (moveId) => {
    if (isSubmitting) return;
    setSelectedMove(moveId);
    setIsSubmitting(true);
    try {
      if (onRespondMove) {
        await onRespondMove(duelData.duelId, moveId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Normalized moves to eliminate casing or whitespace disparities
  const challengerMoveId = duelData.challengerChoice ? String(duelData.challengerChoice).toLowerCase().trim() : null;
  const opponentMoveId = duelData.opponentChoice ? String(duelData.opponentChoice).toLowerCase().trim() : null;

  const challengerMoveIcon = MOVES.find(m => m.id === challengerMoveId)?.icon || '❓';
  const opponentMoveIcon = MOVES.find(m => m.id === opponentMoveId)?.icon || '❓';

  // Compute winner defensively so both players resolve even if one message lacked the precomputed winner
  const computedWinner = duelData.winner ||
    (challengerMoveId && opponentMoveId ? determineRpsWinner(challengerMoveId, opponentMoveId) : null);

  const isUserWinner =
    (computedWinner === 'challenger' && isChallenger) ||
    (computedWinner === 'opponent' && isOpponent);

  const narrativeText = isResolved
    ? getRpsNarrative(challengerMoveId, opponentMoveId, computedWinner, challengerName, opponentName)
    : '';

  return (
    <div className={`arcade-duel-card ${isResolved ? 'resolved' : 'active'}`}>
      {/* Top Header Marquee */}
      <div className="duel-header-row">
        <div className="duel-title-badge">
          <PixelSwords size={16} color="var(--arcade-neon-magenta, #ff007f)" />
          <span>CYPHER RPS DUEL</span>
          {duelData.isOnChain && (
            <span className="duel-onchain-badge">
              ⛓️ ESCROW #{duelData.onChainDuelId || '1'}
            </span>
          )}
        </div>
        <span className="duel-crypto-pill">
          {duelData.wagerAmount && parseFloat(duelData.wagerAmount) > 0 ? (
            <>
              <PixelCoin size={14} color="var(--arcade-gold, #ffd166)" />
              <span>{duelData.wagerAmount} ETH BOUNTY</span>
            </>
          ) : (
            <>
              <PixelZap size={14} color="var(--arcade-neon-cyan, #00f0ff)" />
              <span>100 XP BATTLE</span>
            </>
          )}
        </span>
      </div>

      {/* VS Matchup Roster */}
      <div className="duel-roster-row">
        <div className={`duel-player-pill ${isChallenger ? 'self' : ''}`}>
          <span className="player-tag">1P</span>
          <span className="player-name">{challengerName}</span>
          {isResolved && duelData.challengerChoice ? (
            <span className="revealed-move-icon">{challengerMoveIcon}</span>
          ) : duelData.challengerChoice ? (
            <span className="revealed-move-icon" title="Secret Hand Locked">🔒</span>
          ) : null}
        </div>

        <div className="duel-vs-badge">VS</div>

        <div className={`duel-player-pill ${isOpponent ? 'self' : ''}`}>
          <span className="player-tag">2P</span>
          <span className="player-name">{opponentName}</span>
          {isResolved && duelData.opponentChoice ? (
            <span className="revealed-move-icon">{opponentMoveIcon}</span>
          ) : duelData.opponentChoice ? (
            <span className="revealed-move-icon" title="Hand Locked">🔒</span>
          ) : null}
        </div>
      </div>

      {/* Dynamic Status / Interactive Arena */}
      <div className="duel-arena-box">
        {/* State 1: Waiting for Challenger (Player 1) to Choose their Secret Hand */}
        {isWaitingChallenger && (
          <div className="duel-action-prompt">
            {isChallenger ? (
              <>
                <div className="prompt-label">★ STEP 1: CHOOSE YOUR HAND TO THROW ★</div>
                <div className="duel-buttons-row">
                  {MOVES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`duel-move-btn ${selectedMove === m.id ? 'active' : ''}`}
                      disabled={isSubmitting}
                      onClick={() => handleChallengerPick(m.id)}
                    >
                      <span className="move-emoji">{m.icon}</span>
                      <span className="move-name">{m.label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--coffee-text-dim)', marginTop: '6px' }}>
                  Your hand will be cryptographically locked with Keccak-256 before P2 defends
                </div>
              </>
            ) : (
              <div className="duel-waiting-message">
                <div className="pulse-spinner"></div>
                <span>Player 1 is selecting their move... ⏳</span>
              </div>
            )}
          </div>
        )}

        {/* State 2: Waiting for Opponent (Player 2) to Defend */}
        {isWaitingOpponent && (
          <div className="duel-state-waiting">
            {isOpponent ? (
              <div className="duel-action-prompt">
                <div className="prompt-label">★ STEP 2: CHOOSE YOUR HAND TO DEFEND ★</div>
                <div className="duel-buttons-row">
                  {MOVES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`duel-move-btn ${selectedMove === m.id ? 'active' : ''}`}
                      disabled={isSubmitting}
                      onClick={() => handleOpponentPick(m.id)}
                    >
                      <span className="move-emoji">{m.icon}</span>
                      <span className="move-name">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="duel-waiting-message">
                <div className="pulse-spinner"></div>
                <span>
                  {duelData.challengerChoice
                    ? `You locked in ${duelData.challengerChoice.toUpperCase()}! Waiting for ${opponentName}...`
                    : `Encrypted commitment broadcasted! Awaiting ${opponentName}...`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* State 3: Waiting for Cryptographic Reveal */}
        {isWaitingReveal && (
          <div className="duel-waiting-message">
            <div className="pulse-spinner"></div>
            <span>Both hands locked! Decrypting cryptographic commitment...</span>
            {isOpponent && duelData.isOnChain && duelData.onChainDuelId && onClaimTimeout && (
              <button
                type="button"
                className="duel-timeout-btn font-arcade"
                onClick={() => onClaimTimeout(duelData.duelId, duelData.onChainDuelId)}
              >
                ⏰ CLAIM FORFEITURE (IF TIMED OUT)
              </button>
            )}
          </div>
        )}

        {/* State 4: Resolved Victory / Draw / Defeat */}
        {isResolved && (
          <div className="duel-resolved-banner">
            {computedWinner === 'draw' ? (
              <div className="duel-result-tag draw">
                <span>🤝</span> DRAW! STALEMATE (+25 XP)
              </div>
            ) : (
              <div className={`duel-result-tag ${isUserWinner ? 'victory' : 'defeat'}`}>
                {isUserWinner ? (
                  <>
                    <PixelTrophy size={16} color="var(--arcade-gold, #ffd166)" />
                    <span>VICTORY! +100 ARCADE XP!</span>
                  </>
                ) : (
                  <>
                    <span>💀</span>
                    <span>DEFEAT (+25 XP CONSOLATION)</span>
                  </>
                )}
              </div>
            )}

            <div className="duel-summary-text">
              <span>{challengerName}: <strong>{challengerMoveId ? challengerMoveId.toUpperCase() : 'LOCKED'}</strong> {challengerMoveIcon}</span>
              <span> vs </span>
              <span>{opponentName}: <strong>{opponentMoveId ? opponentMoveId.toUpperCase() : 'LOCKED'}</strong> {opponentMoveIcon}</span>
            </div>

            {narrativeText ? (
              <div style={{ fontSize: '0.72rem', color: 'var(--arcade-neon-green)', fontWeight: 600, marginBottom: '8px' }}>
                ★ {narrativeText}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--arcade-neon-cyan)', fontWeight: 600, marginBottom: '8px' }}>
                ★ Round concluded provably fair!
              </div>
            )}

            {onStartNewDuel && (
              <button
                type="button"
                className="duel-rematch-btn"
                onClick={onStartNewDuel}
              >
                <span>⚔️</span> PLAY REMATCH
              </button>
            )}
          </div>
        )}
      </div>

      {(duelData.createTxHash || duelData.settleTxHash) && (
        <div className="duel-tx-row" style={{ padding: '0 8px 6px' }}>
          {duelData.createTxHash && (
            <span className="duel-tx-link">
              📜 Escrow Lock: {duelData.createTxHash.slice(0, 12)}...
            </span>
          )}
          {duelData.settleTxHash && (
            <span className="duel-tx-link settle">
              🏆 On-Chain Payout: {duelData.settleTxHash.slice(0, 12)}...
            </span>
          )}
        </div>
      )}

      <div className="duel-footer-hash">
        <span>COMMIT: {duelData.commitHash ? `${duelData.commitHash.substring(0, 14)}...` : '0xkeccak256'}</span>
        <span>{duelData.isOnChain ? '⛓️ VERIFIED ON-CHAIN' : 'PROVABLY FAIR'}</span>
      </div>
    </div>
  );
}
