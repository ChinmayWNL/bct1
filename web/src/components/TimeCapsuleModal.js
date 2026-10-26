'use client';
import { useState, useRef } from 'react';
import { PixelHourglass, PixelChest, PixelLock, PixelZap, PixelAlien, PixelCamera, PixelClose, PixelEmoji, PixelWarning, renderPixelText } from './PixelIcons';

const DURATION_PRESETS = [
  { label: '⚡ 30s (Test)', seconds: 30 },
  { label: '⏱️ 5 Mins', seconds: 300 },
  { label: '⏳ 1 Hour', seconds: 3600 },
  { label: '⭐ 24 Hours', seconds: 86400 },
  { label: '🔒 7 Days', seconds: 604800 }
];

const VAULT_THEMES = [
  {
    id: 'chronos',
    label: 'Chronos Vault',
    icon: '⏳',
    color: '#ffd166',
    borderGlow: 'rgba(255, 209, 102, 0.4)',
    tag: 'ANCIENT GOLDEN TIME-LOCK'
  },
  {
    id: 'birthday',
    label: 'Celebration Box',
    icon: '🎁',
    color: '#ff007f',
    borderGlow: 'rgba(255, 0, 127, 0.45)',
    tag: 'BIRTHDAY / HOLIDAY SURPRISE'
  },
  {
    id: 'classified',
    label: 'Classified Dossier',
    icon: '👁️',
    color: '#00f0ff',
    borderGlow: 'rgba(0, 240, 255, 0.45)',
    tag: 'TOP-SECRET ALPHA / LEAK'
  },
  {
    id: 'cosmic',
    label: 'Cosmic Memory',
    icon: '💎',
    color: '#b026ff',
    borderGlow: 'rgba(176, 38, 255, 0.45)',
    tag: 'ASTRAL TIME TRAVEL / LETTER'
  }
];

export default function TimeCapsuleModal({
  isOpen,
  onClose,
  onSendCapsule,
  activeConversation,
  walletAddress,
  groupMembers = [],
  addressProfiles = {}
}) {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('chronos');
  const [title, setTitle] = useState('');
  const [sealedText, setSealedText] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [photoData, setPhotoData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const isGroup = Boolean(
    activeConversation &&
    (activeConversation.isGroup ||
      Boolean(activeConversation.groupName) ||
      (activeConversation.name && !activeConversation.peerAddress))
  );

  // Recipient selection (in group chats or 1v1)
  const [selectedRecipient, setSelectedRecipient] = useState(() => {
    if (activeConversation?.isDemoBot) return walletAddress || '';
    if (!isGroup) return activeConversation?.peerAddress || walletAddress || '';
    // In group, default to first non-self member or self
    const nonSelf = groupMembers.find(m => {
      const addr = m.accountIdentifiers?.[0]?.identifier || m.inboxId || '';
      return addr && addr.toLowerCase() !== (walletAddress || '').toLowerCase();
    });
    const addr = nonSelf?.accountIdentifiers?.[0]?.identifier || nonSelf?.inboxId;
    return addr || walletAddress || '';
  });

  if (!isOpen) return null;

  const currentTheme = VAULT_THEMES.find(t => t.id === selectedTheme) || VAULT_THEMES[0];

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress to max 360px dimension to ensure it fits comfortably on-chain
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 360;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
        setPhotoData(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sealedText.trim()) {
      setErrorMsg('Please enter a secret message to seal inside the capsule.');
      return;
    }

    let durationSeconds = selectedDuration;
    if (customDateTime) {
      const chosenMs = new Date(customDateTime).getTime();
      const diffSec = Math.round((chosenMs - Date.now()) / 1000);
      if (diffSec < 10) {
        setErrorMsg('Custom date and time must be at least 10 seconds in the future.');
        return;
      }
      durationSeconds = diffSec;
    } else if (customMinutes && parseFloat(customMinutes) > 0) {
      durationSeconds = Math.round(parseFloat(customMinutes) * 60);
    }

    const unlockTimestamp = Date.now() + (durationSeconds * 1000);

    // Encode lightweight on-chain payload (secret text + theme metadata)
    // Photo memories are transmitted securely in the capsule message payload to avoid EVM storage limits
    const onChainPayload = JSON.stringify({
      text: sealedText.trim(),
      theme: selectedTheme,
      hasMedia: Boolean(photoData)
    });

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSendCapsule({
        title: title.trim() || currentTheme.label,
        sealedText: onChainPayload,
        unlockTimestamp,
        durationSeconds,
        ethAmount: ethAmount && parseFloat(ethAmount) > 0 ? ethAmount : '0',
        theme: selectedTheme,
        media: photoData || null,
        recipient: activeConversation?.isDemoBot
          ? (walletAddress || '0x71C8360537aaC1957e47192070D7C98C0B29b3B1')
          : (selectedRecipient || (isGroup ? walletAddress : (activeConversation?.peerAddress || walletAddress)))
      });
      setSealedText('');
      setTitle('');
      setEthAmount('');
      setPhotoData(null);
      onClose();
    } catch (err) {
      setErrorMsg(err?.reason || err?.shortMessage || err?.message || 'Transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card capsule-modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: currentTheme.color,
          boxShadow: `0 0 25px ${currentTheme.borderGlow}, 4px 4px 0 #000`
        }}
      >
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1rem', fontFamily: 'var(--font-arcade)', color: currentTheme.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelEmoji char={currentTheme.icon} size={22} />
            <span>SEAL TIMELOCKED CAPSULE</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><PixelClose size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 1. Vault Theme Selector */}
          <div>
            <div className="theme-section-title font-arcade" style={{ fontSize: '0.7rem', marginBottom: '8px', color: 'var(--arcade-gold)' }}>
              1. CHOOSE VAULT STYLE & THEME
            </div>
            <div className="capsule-theme-selector-grid">
              {VAULT_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`capsule-theme-pill ${selectedTheme === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTheme(t.id)}
                  style={{
                    borderColor: selectedTheme === t.id ? t.color : 'rgba(255, 255, 255, 0.1)',
                    background: selectedTheme === t.id ? `color-mix(in srgb, ${t.color} 18%, #14101e)` : 'rgba(20, 16, 30, 0.85)'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <PixelEmoji char={t.icon} size={22} />
                  </span>
                  <div className="theme-pill-text">
                    <span className="theme-pill-name font-arcade" style={{ color: selectedTheme === t.id ? t.color : '#e2e8f0' }}>{t.label}</span>
                    <span className="theme-pill-tag">{t.tag}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Recipient Selector in Groups or 1v1 */}
          {isGroup ? (
            <div>
              <div className="theme-section-title font-arcade" style={{ fontSize: '0.7rem', marginBottom: '6px', color: 'var(--arcade-neon-magenta)' }}>
                2. DEDICATE VAULT TO (GROUP MEMBER)
              </div>
              <div className="capsule-recipient-picker">
                <select
                  className="coffee-modal-input"
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  <option value={walletAddress}>Myself (Future Self Note / Vault)</option>
                  {groupMembers.map((m, idx) => {
                    const addr = m.accountIdentifiers?.[0]?.identifier || m.inboxId || '';
                    if (!addr || addr.toLowerCase() === (walletAddress || '').toLowerCase()) return null;
                    const prof = addressProfiles[addr.toLowerCase()];
                    const name = prof?.username ? `@${prof.username}` : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
                    return (
                      <option key={addr || idx} value={addr}>
                        {name} ({addr.slice(0, 8)}…)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          ) : (
            <div className="capsule-recipient-badge">
              <PixelLock size={14} color={currentTheme.color} />
              <span>
                Sealed for: <strong>{activeConversation?.isDemoBot ? 'Myself (Future Self Memory)' : (activeConversation?.peerAddress ? `${activeConversation.peerAddress.slice(0, 6)}…${activeConversation.peerAddress.slice(-4)}` : 'Recipient')}</strong>
              </span>
            </div>
          )}

          {/* 3. Unlock Duration & Date Picker */}
          <div>
            <div className="theme-section-title font-arcade" style={{ fontSize: '0.7rem', marginBottom: '8px', color: 'var(--arcade-neon-cyan)' }}>
              3. SELECT UNLOCK TIMELOCK
            </div>
            <div className="capsule-preset-grid">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.seconds}
                  type="button"
                  className={`capsule-preset-btn ${selectedDuration === p.seconds && !customMinutes && !customDateTime ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDuration(p.seconds);
                    setCustomMinutes('');
                    setCustomDateTime('');
                  }}
                  style={{
                    borderColor: selectedDuration === p.seconds && !customMinutes && !customDateTime ? currentTheme.color : undefined
                  }}
                >
                  {renderPixelText(p.label, 14)}
                </button>
              ))}
            </div>

            <div className="capsule-custom-time-row" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--coffee-text-muted)' }}>Minutes:</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="e.g. 15"
                  className="coffee-modal-input small"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    setCustomDateTime('');
                  }}
                  style={{ width: '85px', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--coffee-text-muted)' }}>Or Calendar Date:</span>
                <input
                  type="datetime-local"
                  className="coffee-modal-input small"
                  value={customDateTime}
                  onChange={(e) => {
                    setCustomDateTime(e.target.value);
                    setCustomMinutes('');
                  }}
                  style={{ fontSize: '0.76rem', padding: '6px 8px' }}
                />
              </div>
            </div>
          </div>

          {/* 4. Capsule Title / Hint */}
          <div>
            <label className="theme-section-title font-arcade" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '6px' }}>
              4. CAPSULE TEASER / HINT (OPTIONAL)
            </label>
            <input
              type="text"
              className="coffee-modal-input"
              placeholder={`e.g. ${currentTheme.tag.toLowerCase()}...`}
              maxLength={80}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 5. Secret Message Payload */}
          <div>
            <label className="theme-section-title font-arcade" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '6px' }}>
              5. SECRET MESSAGE (SEALED UNTIL UNLOCK)
            </label>
            <textarea
              className="coffee-modal-input"
              rows={3}
              placeholder="Type confidential wishes, future instructions, private keys, or alpha..."
              value={sealedText}
              onChange={(e) => setSealedText(e.target.value)}
              required
            />
          </div>

          {/* 6. Photo / Memory Attachment (Optional) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="theme-section-title font-arcade" style={{ fontSize: '0.7rem' }}>
                6. ATTACH PHOTO MEMORY (OPTIONAL)
              </label>
              {photoData && (
                <button
                  type="button"
                  className="remove-photo-text-btn"
                  onClick={() => setPhotoData(null)}
                  style={{ background: 'none', border: 'none', color: '#ff007f', fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <PixelClose size={12} color="#ff007f" />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />

            {photoData ? (
              <div className="capsule-modal-photo-preview">
                <img src={photoData} alt="Memory Preview" />
                <span className="photo-preview-badge font-arcade" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <PixelCamera size={14} color="#ffd166" />
                  <span>MEMORY PHOTO SEALED</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                className="capsule-attach-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <PixelCamera size={16} color="#ffd166" />
                <span>Attach Photo Memory (Sealed in Vault)</span>
              </button>
            )}
          </div>

          {/* 7. Optional Locked ETH Gift */}
          <div>
            <label className="theme-section-title font-arcade" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '6px' }}>
              7. LOCK ETH GIFT INSIDE (OPTIONAL)
            </label>
            <input
              type="number"
              min="0"
              step="0.001"
              className="coffee-modal-input"
              placeholder="0.00 ETH released to recipient upon unlock"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
            />
          </div>

          <div className="capsule-security-note">
            <PixelLock size={14} color={currentTheme.color} />
            <span>Smart contract strictly locks this payload and ETH on Ethereum. Nobody (including the UI) can open it early.</span>
          </div>

          {errorMsg && (
            <div className="capsule-security-note error" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PixelWarning size={14} color="#ff6b6b" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="coffee-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="modal-btn-primary"
              disabled={isSubmitting || !sealedText.trim()}
              style={{
                fontFamily: 'var(--font-arcade)',
                fontSize: '0.76rem',
                borderColor: currentTheme.color,
                boxShadow: `2px 2px 0 #000, 0 0 14px ${currentTheme.borderGlow}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {isSubmitting ? (
                  <>
                    <PixelHourglass size={14} color={currentTheme.color} />
                    <span>CONFIRM IN WALLET...</span>
                  </>
                ) : (
                  <>
                    <PixelLock size={14} color={currentTheme.color} />
                    <span>SEAL ON-CHAIN & DISPATCH</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
