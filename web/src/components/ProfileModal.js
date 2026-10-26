'use client';
import { useState } from 'react';
import { PixelSliders, PixelClose, PixelEmoji, PixelWarning, PixelZap, PixelLock, PixelCheck } from './PixelIcons';

export default function ProfileModal({
  walletAddress,
  userProfile,
  profileFormUsername,
  setProfileFormUsername,
  profileFormAvatar,
  setProfileFormAvatar,
  isSavingProfile,
  arcadeRank,
  onSaveProfile,
  onDisconnect,
  onClose
}) {
  const [validationError, setValidationError] = useState('');

  const validateAndSubmit = (e, mode) => {
    e.preventDefault();
    setValidationError('');

    const cleanUsername = (profileFormUsername || '').trim();
    if (!cleanUsername) {
      setValidationError('Username is required.');
      return;
    }

    if (!userProfile.isRegistered && !/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      setValidationError('Username must be 3-20 characters long and contain only letters, numbers, or underscores.');
      return;
    }

    const cleanAvatar = (profileFormAvatar || '').trim();
    if (cleanAvatar) {
      const lower = cleanAvatar.toLowerCase();
      const isValid = 
        lower.startsWith('http://') || 
        lower.startsWith('https://') || 
        lower.startsWith('ipfs://') || 
        lower.startsWith('qm') || 
        lower.startsWith('bafy');
      
      if (!isValid) {
        setValidationError('Avatar must be a valid HTTPS URL or IPFS CID (Qm... / bafy...).');
        return;
      }
      if (lower.startsWith('javascript:') || lower.startsWith('data:text/html')) {
        setValidationError('Unsafe avatar URL scheme detected.');
        return;
      }
    }

    onSaveProfile(e, mode);
  };

  const getAvatarSrc = () => {
    const trimmed = (profileFormAvatar || '').trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${trimmed.replace('ipfs://', '')}`;
    return `https://ipfs.io/ipfs/${trimmed}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.05rem', fontFamily: 'var(--font-arcade)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span><PixelSliders size={18} color="var(--arcade-gold)" /></span> PLAYER LOADOUT &amp; PROFILE
          </div>
          <button className="modal-close-btn" onClick={onClose}><PixelClose size={16} /></button>
        </div>

        <form onSubmit={(e) => validateAndSubmit(e, 'local')}>
          {/* Avatar Preview */}
          <div className="profile-preview-box">
            <div className="profile-preview-avatar">
              {profileFormAvatar ? (
                <img 
                  src={getAvatarSrc()} 
                  alt="Avatar Preview" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span>{(profileFormUsername || walletAddress || '??').substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="profile-preview-text">
              <h4>{profileFormUsername ? `@${profileFormUsername}` : 'Set your username'}</h4>
              <p>{walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : ''}</p>
            </div>
          </div>

          {/* Arcade Rank & XP HUD */}
          {arcadeRank && (
            <div style={{
              background: 'var(--arcade-card)',
              border: '2px solid var(--arcade-border)',
              borderRadius: '4px',
              padding: '12px 14px',
              marginTop: '14px',
              boxShadow: 'var(--pixel-shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}><PixelEmoji char={arcadeRank.badge} size={24} /></span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.72rem', color: 'var(--arcade-gold)' }}>
                      LVL {arcadeRank.level} {arcadeRank.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--coffee-text-muted)' }}>
                      {arcadeRank.currentXp} XP accumulated
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.62rem', color: 'var(--arcade-green)' }}>
                    {arcadeRank.xpToNext > 0 ? `${arcadeRank.xpToNext} XP to Next` : 'MAX RANK'}
                  </span>
                </div>
              </div>
              <div className="arcade-xp-track" style={{ marginTop: '8px' }}>
                <div className="arcade-xp-fill" style={{ width: `${arcadeRank.progressPercent}%` }}></div>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Connected Wallet</label>
            <input 
              type="text" 
              className="form-control" 
              value={walletAddress || ''} 
              disabled 
              style={{ opacity: 0.65, fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Satoshi_99" 
              value={profileFormUsername} 
              disabled={userProfile.isRegistered}
              onChange={(e) => {
                setProfileFormUsername(e.target.value);
                setValidationError('');
              }}
              required
            />
            {userProfile.isRegistered && (
              <small style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PixelCheck size={12} color="#39ff14" />
                <span>Username permanently recorded on blockchain.</span>
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Avatar (Image HTTPS URL or IPFS CID)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="https://... or Qm..." 
              value={profileFormAvatar} 
              onChange={(e) => {
                setProfileFormAvatar(e.target.value);
                setValidationError('');
              }}
            />
          </div>

          {validationError && (
            <div className="crypto-error-banner" style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PixelWarning size={14} color="#ffd166" />
              <span>{validationError}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button 
              type="button" 
              className="modal-btn-primary"
              onClick={(e) => validateAndSubmit(e, 'local')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <PixelZap size={14} color="#ffd166" /> Save Profile (Instant & Free)
            </button>
            <button 
              type="button" 
              className="modal-btn-secondary"
              disabled={isSavingProfile}
              onClick={(e) => validateAndSubmit(e, 'contract')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {isSavingProfile ? "Submitting Transaction..." : (
                <>
                  <PixelLock size={14} color="#00f0ff" /> Register via Smart Contract (On-Chain)
                </>
              )}
            </button>
            <small style={{ color: '#64748b', fontSize: '0.72rem', textAlign: 'center' }}>
              On-chain registration calls UserRegistry smart contract (requires Sepolia or local Hardhat gas).
            </small>

            {onDisconnect && (
              <button 
                type="button" 
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  marginTop: '8px',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.confirm("Are you sure you want to disconnect your wallet?")) {
                    onDisconnect();
                    onClose();
                  }
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <PixelZap size={14} color="#ff6b6b" />
                  <span>Disconnect Wallet</span>
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
