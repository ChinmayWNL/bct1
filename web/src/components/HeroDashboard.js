'use client';

export default function HeroDashboard({
  walletAddress,
  ensName,
  userBalance,
  networkName,
  userProfile,
  arcadeRank,
  onStartChatClick,
  onOpenProfile,
  onOpenQR,
  onConnectWallet,
  onStartBlockBotChat,
  onStartDemoMode
}) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="whatsapp-welcome-container">
      <div className="whatsapp-welcome-content">
        {/* Retro 8-Bit Arcade Cabinet Mascot Badge */}
        <div className="coffee-illustration-badge">
          <div className="coffee-cup-graphic" style={{ fontSize: '3.2rem' }}>
            <span className="coffee-mug">🕹️</span>
          </div>
        </div>
        
        <h1 className="whatsapp-welcome-title">BLOCKCHAT // ARCADE</h1>
        <p className="whatsapp-welcome-subtitle">
          ★ 1P VS 2P DECENTRALIZED WEB3 MESSAGING ★ ENCRYPTED VIA XMTP ★
          <br />
          <span style={{ fontSize: '0.85em', opacity: 0.85 }}>
            VOICE CALLS • 8-BIT SOUNDS • ETH TRANSFERS • PEER-TO-PEER ENCRYPTION
          </span>
        </p>

        {walletAddress ? (
          <div className="coffee-wallet-card">
            <div className="coffee-wallet-header">
              <div className="coffee-avatar">
                {userProfile?.username ? userProfile.username.substring(0, 2).toUpperCase() : '1P'}
              </div>
              <div className="coffee-wallet-details">
                <span className="coffee-wallet-name">
                  {userProfile?.username ? `PLAYER 1: @${userProfile.username}` : (ensName ? `PLAYER 1: ${ensName}` : 'PLAYER 1: READY')}
                </span>
                <span className="coffee-wallet-address">{formatAddress(walletAddress)}</span>
              </div>
              <span className="coffee-network-badge">
                <span className="coffee-dot-online"></span>
                STAGE: {networkName ? networkName.split(' ')[0].toUpperCase() : 'SEPOLIA'}
              </span>
            </div>

            <div className="coffee-balance-row">
              <span className="balance-label">CREDITS (BALANCE)</span>
              <span className="balance-value">{parseFloat(userBalance || 0).toFixed(4)} ETH</span>
            </div>

            {arcadeRank && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--coffee-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="arcade-rank-pill">
                    <span>{arcadeRank.badge}</span>
                    <span className="rank-title">LVL {arcadeRank.level} {arcadeRank.title}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.62rem', color: 'var(--arcade-gold)' }}>
                    {arcadeRank.currentXp} / {arcadeRank.nextRankMin} XP
                  </span>
                </div>
                <div className="arcade-xp-track">
                  <div className="arcade-xp-fill" style={{ width: `${arcadeRank.progressPercent}%` }}></div>
                </div>
              </div>
            )}

            <div className="coffee-action-row">
              <button type="button" className="coffee-btn-primary" onClick={onStartBlockBotChat}>
                👾 CO-OP BLOCKBOT
              </button>
              <button type="button" className="coffee-btn-secondary" onClick={onOpenQR}>
                🏁 SHARE QR CODE
              </button>
              <button type="button" className="coffee-btn-secondary" onClick={onOpenProfile}>
                ⚙️ LOADOUT / PROFILE
              </button>
            </div>
          </div>
        ) : (
          <div className="coffee-guest-cta">
            <div className="coffee-cta-buttons">
              <button type="button" className="coffee-btn-primary large" onClick={onConnectWallet}>
                🪙 INSERT COIN (CONNECT WALLET)
              </button>
              {onStartDemoMode && (
                <button type="button" className="coffee-btn-secondary large" onClick={onStartDemoMode}>
                  ▶ PRESS START (DEMO MODE)
                </button>
              )}
            </div>
            <p className="coffee-cta-note">
              ★ INSERT 1 COIN TO INITIALIZE ENCRYPTED PEER-TO-PEER SESSION ★
            </p>
          </div>
        )}

        <div className="whatsapp-welcome-footer">
          <span className="lock-icon">👾</span>
          <span>HI-SCORE ENCRYPTED MESSAGING VIA XMTP &amp; ETHEREUM PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}
