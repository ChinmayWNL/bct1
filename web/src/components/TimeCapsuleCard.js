'use client';
import { useState, useEffect } from 'react';
import { PixelHourglass, PixelChest, PixelLock, PixelZap, PixelEmoji, PixelUnlock, PixelEye, PixelWarning, PixelCamera, PixelGem, PixelCheck, PixelStar } from './PixelIcons';

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

const THEME_CONFIGS = {
  chronos: {
    color: '#ffd166',
    borderGlow: 'rgba(255, 209, 102, 0.4)',
    icon: '⏳',
    tag: 'CHRONOS VAULT'
  },
  birthday: {
    color: '#ff007f',
    borderGlow: 'rgba(255, 0, 127, 0.45)',
    icon: '🎁',
    tag: 'CELEBRATION VAULT'
  },
  classified: {
    color: '#00f0ff',
    borderGlow: 'rgba(0, 240, 255, 0.45)',
    icon: '👁️',
    tag: 'CLASSIFIED DOSSIER'
  },
  cosmic: {
    color: '#b026ff',
    borderGlow: 'rgba(176, 38, 255, 0.45)',
    icon: '💎',
    tag: 'COSMIC MEMORY BOX'
  }
};

export default function TimeCapsuleCard({
  capsuleData,
  isSent,
  isRecipient = true,
  onOpenCapsule,
  onPlayFanfare,
  onAddXp,
  onOpenLightbox
}) {
  const [now, setNow] = useState(0);
  const [hasOpenedLocally, setHasOpenedLocally] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = Math.max(0, (capsuleData.unlockTimestamp || 0) - (now || 0));
  const isTimeElapsed = now > 0 && remainingMs === 0;
  const isRevealed = hasOpenedLocally || Boolean(capsuleData.isOpened);
  const hasEth = capsuleData.ethAmount && parseFloat(capsuleData.ethAmount) > 0;
  const isUrgent = !isTimeElapsed && remainingMs <= 60000;

  // Calculate elapsed progress percentage
  const createdAt = capsuleData.createdAt || capsuleData.timestamp || ((capsuleData.unlockTimestamp || 0) - ((capsuleData.durationSeconds || 60) * 1000));
  const totalDuration = Math.max(1000, (capsuleData.unlockTimestamp || 0) - createdAt);
  const elapsed = Math.max(0, (now || createdAt) - createdAt);
  const percentElapsed = Math.min(100, Math.max(0, Math.floor((elapsed / totalDuration) * 100)));

  // Parse rich payload (JSON vs legacy plaintext)
  let parsedPayload = {
    text: capsuleData.sealedText || '',
    media: capsuleData.media || null,
    theme: capsuleData.theme || 'chronos'
  };

  if (capsuleData.sealedText && typeof capsuleData.sealedText === 'string') {
    const trimmed = capsuleData.sealedText.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        parsedPayload = {
          text: parsed.text || '',
          media: parsed.media || capsuleData.media || null,
          theme: parsed.theme || capsuleData.theme || 'chronos'
        };
      } catch {}
    }
  }

  const themeConfig = THEME_CONFIGS[parsedPayload.theme] || THEME_CONFIGS[capsuleData.theme] || THEME_CONFIGS.chronos;

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
    <div 
      className={`time-capsule-card ${isRevealed ? 'revealed' : isTimeElapsed ? 'ready' : 'locked'} theme-${parsedPayload.theme}`}
      style={{
        borderColor: isRevealed ? 'var(--arcade-neon-green, #39ff14)' : themeConfig.color,
        boxShadow: `0 0 18px ${isRevealed ? 'rgba(57, 255, 20, 0.35)' : themeConfig.borderGlow}, 3px 3px 0 #000`
      }}
    >
      {/* Header Row */}
      <div className="capsule-header-row">
        <div className="capsule-title-badge">
          <span style={{ display: 'inline-flex', alignItems: 'center' }}><PixelEmoji char={themeConfig.icon} size={18} /></span>
          <span style={{ color: themeConfig.color }}>{themeConfig.tag}</span>
          {capsuleData.isOnChain && (
            <span className="duel-onchain-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <PixelLock size={12} color="#00f0ff" /> VAULT #{capsuleData.onChainCapsuleId}
            </span>
          )}
          {hasEth && (
            <span className="duel-onchain-badge" style={{ color: '#ffd166', borderColor: '#ffd166' }}>
              Ξ {capsuleData.ethAmount} ETH
            </span>
          )}
        </div>
        <span className={`capsule-status-pill ${isRevealed ? 'opened' : isTimeElapsed ? 'ready' : 'sealed'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {isRevealed ? (
            <>
              <PixelCheck size={11} color="#39ff14" />
              <span>UNSEALED</span>
            </>
          ) : isTimeElapsed ? (
            'READY TO OPEN'
          ) : (
            'LOCKED'
          )}
        </span>
      </div>

      {/* Vault Center Visual */}
      <div className="capsule-vault-body">
        <div className={`capsule-chest-box ${isTimeElapsed && !isRevealed ? 'shake-pulse' : ''} ${isUrgent ? 'urgent-pulse' : ''}`}>
          <PixelChest 
            size={48} 
            color={isRevealed ? 'var(--arcade-neon-green, #39ff14)' : themeConfig.color} 
          />
        </div>

        {capsuleData.title && (
          <div className="capsule-custom-title" style={{ color: isRevealed ? '#fff' : themeConfig.color }}>
            &ldquo;{capsuleData.title}&rdquo;
          </div>
        )}

        {/* State 1: Locked & Counting Down */}
        {!isTimeElapsed && !isRevealed && (
          <div className="capsule-countdown-box">
            <div className="countdown-label" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {isUrgent ? (
                <>
                  <PixelZap size={12} color="#ff007f" />
                  <span>UNLOCK IMMINENT</span>
                  <PixelZap size={12} color="#ff007f" />
                </>
              ) : (
                'TIME UNTIL RETRIEVAL'
              )}
            </div>
            
            <div className={`countdown-digits font-arcade ${isUrgent ? 'urgent-text' : ''}`} style={{ color: isUrgent ? '#ff007f' : themeConfig.color }}>
              {formatCountdown(remainingMs)}
            </div>

            {/* Retro Progress Bar */}
            <div className="capsule-progress-track">
              <div 
                className="capsule-progress-fill" 
                style={{ 
                  width: `${percentElapsed}%`,
                  background: `linear-gradient(90deg, ${themeConfig.color}, #39ff14)`
                }}
              />
            </div>
            <div className="capsule-progress-meta">
              <span>{percentElapsed}% ELAPSED</span>
              <span>LOCKED ON-CHAIN</span>
            </div>

            <div className="countdown-subtext" style={{ marginTop: '8px' }}>
              <PixelLock size={12} color="var(--coffee-text-dim)" />
              <span>{capsuleData.isOnChain ? 'Smart contract strictly prevents early retrieval' : 'Cryptographically sealed'}</span>
            </div>
          </div>
        )}

        {/* State 2: Time Elapsed, Ready to Open */}
        {isTimeElapsed && !isRevealed && (
          <div className="capsule-ready-box">
            <div className="ready-text font-arcade" style={{ color: themeConfig.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <PixelStar size={12} color={themeConfig.color} />
              <span>TIMELOCK HAS EXPIRED!</span>
              <PixelStar size={12} color={themeConfig.color} />
            </div>

            {isRecipient ? (
              <button
                type="button"
                className="capsule-open-btn"
                onClick={handleOpenClick}
                disabled={isOpening}
                style={{
                  borderColor: themeConfig.color,
                  boxShadow: `0 0 16px ${themeConfig.borderGlow}, 3px 3px 0 #000`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <PixelUnlock size={16} color="#39ff14" />
                {isOpening 
                  ? 'CONFIRM IN WALLET...' 
                  : hasEth 
                    ? `OPEN VAULT & CLAIM ${capsuleData.ethAmount} ETH` 
                    : 'OPEN TIMELOCKED VAULT'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div className="countdown-subtext">
                  <span>Vault unlocked for recipient</span>
                </div>
                <button
                  type="button"
                  className="capsule-open-btn secondary"
                  onClick={handleOpenClick}
                  disabled={isOpening}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <PixelEye size={16} color="#00f0ff" /> {isOpening ? 'READING CONTRACT...' : 'VIEW PAYLOAD (AS SENDER)'}
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="countdown-subtext error-text" style={{ color: 'var(--arcade-neon-magenta, #ff007f)', marginTop: '8px' }}>
                <PixelWarning size={14} color="var(--arcade-neon-magenta, #ff007f)" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* State 3: Unsealed & Plaintext Revealed */}
        {isRevealed && (
          <div className="capsule-revealed-payload">
            <div className="payload-tag">
              <PixelZap size={14} color="var(--arcade-neon-green, #39ff14)" />
              <span className="font-arcade">DECRYPTED PAYLOAD:</span>
            </div>

            <div className="payload-content">
              {parsedPayload.text || 'No text message payload found.'}
            </div>

            {/* Attached Photo Memory */}
            {parsedPayload.media && (
              <div className="capsule-revealed-photo-wrap">
                <img 
                  src={parsedPayload.media} 
                  alt="Sealed Memory" 
                  className="capsule-revealed-photo"
                  onClick={() => onOpenLightbox && onOpenLightbox(parsedPayload.media)}
                  title="Click to expand"
                />
                <span className="photo-revealed-caption font-arcade" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <PixelCamera size={14} color="#00f0ff" /> UNSEALED PHOTO MEMORY
                </span>
              </div>
            )}

            {hasEth && (
              <div className="capsule-eth-claimed-banner font-arcade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <PixelGem size={14} color="#00f0ff" /> <span>{capsuleData.ethAmount} ETH CLAIMED TO WALLET</span>
              </div>
            )}

            <div className="payload-timestamp">
              Sealed: {new Date(createdAt).toLocaleString()} • Target: {new Date(capsuleData.unlockTimestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <div className="capsule-footer-meta">
        <span>ID: {capsuleData.capsuleId ? capsuleData.capsuleId.substring(0, 14) : 'capsule'}</span>
        <span>
          {isRevealed 
            ? 'UNSEALED' 
            : `TARGET: ${new Date(capsuleData.unlockTimestamp).toLocaleTimeString()}`}
        </span>
      </div>
    </div>
  );
}
