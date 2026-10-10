'use client';

export default function ProfileModal({
  walletAddress,
  userProfile,
  profileFormUsername,
  setProfileFormUsername,
  profileFormAvatar,
  setProfileFormAvatar,
  isSavingProfile,
  onSaveProfile,
  onClose
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.2rem' }}>
            <span>🆔</span> Web3 Identity Profile
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={(e) => onSaveProfile(e, 'local')}>
          {/* Avatar Preview */}
          <div className="profile-preview-box">
            <div className="profile-preview-avatar">
              {profileFormAvatar ? (
                <img 
                  src={profileFormAvatar.startsWith('http') ? profileFormAvatar : `https://ipfs.io/ipfs/${profileFormAvatar}`} 
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
              placeholder="e.g. Satoshi" 
              value={profileFormUsername} 
              disabled={userProfile.isRegistered}
              onChange={(e) => setProfileFormUsername(e.target.value)}
              required
            />
            {userProfile.isRegistered && (
              <small style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                ✓ Username permanently recorded on blockchain.
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Avatar (Image URL or IPFS CID)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="https://... or Qm..." 
              value={profileFormAvatar} 
              onChange={(e) => setProfileFormAvatar(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            <button 
              type="button" 
              className="modal-btn-primary"
              onClick={(e) => onSaveProfile(e, 'local')}
            >
              ⚡ Save Profile (Instant & Free)
            </button>
            <button 
              type="button" 
              className="modal-btn-secondary"
              disabled={isSavingProfile}
              onClick={(e) => onSaveProfile(e, 'contract')}
            >
              {isSavingProfile ? "Submitting Transaction..." : "⛓️ Register via Smart Contract (On-Chain)"}
            </button>
            <small style={{ color: '#64748b', fontSize: '0.72rem', textAlign: 'center' }}>
              On-chain registration calls UserRegistry smart contract (requires Sepolia or local Hardhat gas).
            </small>
          </div>
        </form>
      </div>
    </div>
  );
}
