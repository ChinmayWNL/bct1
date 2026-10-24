'use client';
import { useState, useEffect } from 'react';
import { PixelHourglass, PixelChest, PixelLock, PixelZap } from './PixelIcons';

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function TimeCapsuleCard({
  capsuleData,
  isSent,
  isRecipient = true,
  onOpenCapsule,
  onPlayFanfare,
  onAddXp
}) {
  const [now, setNow] = useState(Date.now());
  const [hasOpenedLocally, setHasOpenedLocally] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = Math.max(0, (capsuleData.unlockTimestamp || 0) - now);
  const isTimeElapsed = remainingMs === 0;
  const isRevealed = hasOpenedLocally || capsuleData.isOpened;
  const hasEth = capsuleData.ethAmount && parseFloat(capsuleData.ethAmount) > 0;

  const handleOpenClick = async () => {
    if (!isTimeElapsed || isOpening) return;
    setIsOpening(true);
    setErrorMsg('');
    try {
      if (onOpenCapsule) await onOpenCapsule(capsuleData.capsuleId);
      setHasOpenedLocally(true);
      if (onPlayFanfare) onPlayFanfare();
      if (onAddXp) onAddXp(50, 'Time Capsule Unsealed');
    } catch (err) {
      setErrorMsg(err?.reason || err?.shortMessage || err?.message || 'Could not open capsule');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className={`time-capsule-card ${isRevealed ? 'revealed' : isTimeElapsed ? 'ready' : 'locked'}`}>
      {/* Header */}
      <div className="capsule-header-row">
        <div className="capsule-title-badge">
          <PixelHourglass size={15} color="var(--arcade-gold, #ffd166)" />
          <span>TIMELOCKED VAULT</span>
          {capsuleData.isOnChain && (
            <span className="duel-onchain-badge">⛓️ VAULT #{capsuleData.onChainCapsuleId}</span>
          )}
          {hasEth && (
            <span className="duel-onchain-badge">Ξ {capsuleData.ethAmount} ETH</span>
          )}
        </div>
        <span className={`capsule-status-pill ${isRevealed ? 'opened' : isTimeElapsed ? 'ready' : 'sealed'}`}>
          {isRevealed ? 'UNSEALED' : isTimeElapsed ? 'READY TO OPEN' : 'SEALED'}
        </span>
      </div>

      {/* Vault Center Visual */}
      <div className="capsule-vault-body">
        <div className={`capsule-chest-box ${isTimeElapsed && !isRevealed ? 'shake-pulse' : ''}`}>
          <PixelChest size={44} color={isRevealed ? 'var(--arcade-neon-cyan, #00f0ff)' : 'var(--arcade-gold, #ffd166)'} />
        </div>

        {capsuleData.title && (
          <div className="capsule-custom-title">
            &ldquo;{capsuleData.title}&rdquo;
          </div>
        )}

        {/* State 1: Locked & Counting Down */}
        {!isTimeElapsed && !isRevealed && (
          <div className="capsule-countdown-box">
            <div className="countdown-label">TIME UNTIL RETRIEVAL</div>
            <div className="countdown-digits font-arcade">
              {formatCountdown(remainingMs)}
            </div>
            <div className="countdown-subtext">
              <PixelLock size={12} color="var(--coffee-text-dim)" />
              <span>{capsuleData.isOnChain ? 'Sealed by smart contract until target time' : 'Cryptographically sealed until target timestamp'}</span>
            </div>
          </div>
        )}

        {/* State 2: Time Elapsed, Ready to Open */}
        {isTimeElapsed && !isRevealed && (
          <div className="capsule-ready-box">
            <div className="ready-text">★ TIMELOCK HAS EXPIRED! ★</div>
            {isRecipient ? (
              <button
                type="button"
                className="capsule-open-btn"
                onClick={handleOpenClick}
                disabled={isOpening}
              >
                <span>🔓</span> {isOpening ? 'CONFIRM IN WALLET...' : (hasEth ? `OPEN VAULT & CLAIM ${capsuleData.ethAmount} ETH` : 'OPEN TIMELOCKED VAULT')}
              </button>
            ) : (
              <div className="countdown-subtext">
                <span>Only the recipient can open this vault</span>
              </div>
            )}
            {errorMsg && (
              <div className="countdown-subtext" style={{ color: 'var(--arcade-neon-magenta, #ff007f)' }}>
                <span>⚠ {errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* State 3: Unsealed & Plaintext Revealed */}
        {isRevealed && (
          <div className="capsule-revealed-payload">
            <div className="payload-tag">
              <PixelZap size={14} color="var(--arcade-neon-green, #39ff14)" />
              <span>DECRYPTED PAYLOAD:</span>
            </div>
            <div className="payload-content">
              {capsuleData.sealedText || 'No payload content found.'}
            </div>
            <div className="payload-timestamp">
              Sealed: {new Date(capsuleData.createdAt || capsuleData.timestamp || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      <div className="capsule-footer-meta">
        <span>ID: {capsuleData.capsuleId ? capsuleData.capsuleId.substring(0, 12) : 'capsule'}</span>
        <span>{isRevealed ? '🔓 UNLOCKED' : `TARGET: ${new Date(capsuleData.unlockTimestamp).toLocaleTimeString()}`}</span>
      </div>
    </div>
  );
}
