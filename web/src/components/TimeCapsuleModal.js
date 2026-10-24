'use client';
import { useState } from 'react';
import { PixelHourglass, PixelChest, PixelLock } from './PixelIcons';

const DURATION_PRESETS = [
  { label: '⚡ 30s (Test)', seconds: 30 },
  { label: '⏱️ 2 Mins', seconds: 120 },
  { label: '⏳ 10 Mins', seconds: 600 },
  { label: '🔒 1 Hour', seconds: 3600 }
];

export default function TimeCapsuleModal({
  isOpen,
  onClose,
  onSendCapsule
}) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customMinutes, setCustomMinutes] = useState('');
  const [title, setTitle] = useState('');
  const [sealedText, setSealedText] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sealedText.trim()) {
      setErrorMsg('Please enter a secret message to seal inside the capsule.');
      return;
    }

    let durationSeconds = selectedDuration;
    if (customMinutes && parseFloat(customMinutes) > 0) {
      durationSeconds = Math.round(parseFloat(customMinutes) * 60);
    }

    const unlockTimestamp = Date.now() + (durationSeconds * 1000);

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSendCapsule({
        title: title.trim(),
        sealedText: sealedText.trim(),
        unlockTimestamp,
        durationSeconds,
        ethAmount: ethAmount && parseFloat(ethAmount) > 0 ? ethAmount : '0'
      });
      setSealedText('');
      setTitle('');
      setEthAmount('');
      onClose();
    } catch (err) {
      setErrorMsg(err?.reason || err?.shortMessage || err?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card capsule-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.05rem', fontFamily: 'var(--font-arcade)' }}>
            <PixelHourglass size={18} color="var(--arcade-gold)" />
            <span>SEAL TIMELOCKED CAPSULE</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Preset Duration Buttons */}
          <div className="theme-section-title" style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.72rem', marginTop: '10px' }}>
            SELECT UNLOCK DURATION
          </div>
          <div className="capsule-preset-grid">
            {DURATION_PRESETS.map((p) => (
              <button
                key={p.seconds}
                type="button"
                className={`capsule-preset-btn ${selectedDuration === p.seconds && !customMinutes ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDuration(p.seconds);
                  setCustomMinutes('');
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="custom-duration-row">
            <span style={{ fontSize: '0.75rem', color: 'var(--coffee-text-muted)' }}>Or custom minutes:</span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              placeholder="e.g. 5"
              className="coffee-modal-input small"
              value={customMinutes}
              onChange={(e) => {
                setCustomMinutes(e.target.value);
              }}
              style={{ width: '90px' }}
            />
          </div>

          {/* Capsule Title / Teaser */}
          <div style={{ marginTop: '14px' }}>
            <label className="theme-section-title" style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.72rem', display: 'block', marginBottom: '6px' }}>
              CAPSULE TEASER / HINT (OPTIONAL)
            </label>
            <input
              type="text"
              className="coffee-modal-input"
              placeholder="e.g. Secret Alpha for NFT Mint..."
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Secret Message Payload */}
          <div style={{ marginTop: '14px' }}>
            <label className="theme-section-title" style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.72rem', display: 'block', marginBottom: '6px' }}>
              SECRET MESSAGE PAYLOAD (SEALED)
            </label>
            <textarea
              className="coffee-modal-input"
              rows={4}
              placeholder="Type your secret message, private key phrase, or confession..."
              value={sealedText}
              onChange={(e) => setSealedText(e.target.value)}
              required
            />
          </div>

          {/* Optional ETH gift locked in the vault */}
          <div style={{ marginTop: '14px' }}>
            <label className="theme-section-title" style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.72rem', display: 'block', marginBottom: '6px' }}>
              LOCK ETH GIFT INSIDE (OPTIONAL)
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              className="coffee-modal-input"
              placeholder="0.00 ETH released to recipient at unlock"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
            />
          </div>

          <div className="capsule-security-note">
            <PixelLock size={14} color="var(--arcade-gold)" />
            <span>The TimeCapsuleVault smart contract enforces the unlock time on-chain. Nobody can open it early, and any ETH is released to the recipient only at unlock.</span>
          </div>

          {errorMsg && (
            <div className="capsule-security-note" style={{ borderColor: 'var(--arcade-neon-magenta, #ff007f)', color: 'var(--arcade-neon-magenta, #ff007f)' }}>
              <span>⚠ {errorMsg}</span>
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="coffee-btn-secondary"
              onClick={onClose}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="modal-btn-primary"
              disabled={isSubmitting || !sealedText.trim()}
              style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.78rem' }}
            >
              {isSubmitting ? '⏳ CONFIRM IN WALLET...' : '🔒 SEAL ON-CHAIN & DISPATCH'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
