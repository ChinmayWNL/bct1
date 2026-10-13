'use client';

export default function HeroDashboard({
  walletAddress,
  ensName,
  userBalance,
  networkName,
  userProfile,
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
        {/* Warm Coffee Illustration Badge */}
        <div className="coffee-illustration-badge">
          <div className="coffee-cup-graphic">
            <span className="coffee-steam">♨️</span>
            <span className="coffee-mug">☕</span>
          </div>
        </div>
        
        <h1 className="whatsapp-welcome-title">BlockChat Web</h1>
        <p className="whatsapp-welcome-subtitle">
          Send and receive end-to-end encrypted messages, voice notes, WebRTC voice/video calls, and instant ETH transfers over Ethereum.
        </p>

        {walletAddress ? (
          <div className="coffee-wallet-card">
            <div className="coffee-wallet-header">
              <div className="coffee-avatar">
                {userProfile?.username ? userProfile.username.substring(0, 2).toUpperCase() : 'Ξ'}
              </div>
              <div className="coffee-wallet-details">
                <span className="coffee-wallet-name">
                  {userProfile?.username ? `@${userProfile.username}` : (ensName || 'Wallet Connected')}
                </span>
                <span className="coffee-wallet-address">{formatAddress(walletAddress)}</span>
              </div>
              <span className="coffee-network-badge">
                <span className="coffee-dot-online"></span>
                {networkName ? networkName.split(' ')[0] : 'Sepolia'}
              </span>
            </div>

            <div className="coffee-balance-row">
              <span className="balance-label">Balance</span>
              <span className="balance-value">{parseFloat(userBalance || 0).toFixed(4)} ETH</span>
            </div>

            <div className="coffee-action-row">
              <button type="button" className="coffee-btn-primary" onClick={onStartBlockBotChat}>
                🤖 Chat with BlockBot
              </button>
              <button type="button" className="coffee-btn-secondary" onClick={onOpenQR}>
                🏁 Share QR
              </button>
              <button type="button" className="coffee-btn-secondary" onClick={onOpenProfile}>
                ⚙️ Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="coffee-guest-cta">
            <div className="coffee-cta-buttons">
              <button type="button" className="coffee-btn-primary large" onClick={onConnectWallet}>
                ☕ Connect Web3 Wallet
              </button>
              {onStartDemoMode && (
                <button type="button" className="coffee-btn-secondary large" onClick={onStartDemoMode}>
                  🧪 Try Demo Mode
                </button>
              )}
            </div>
            <p className="coffee-cta-note">
              Instant companion testing available with built-in simulated Hardhat/BlockBot transfers.
            </p>
          </div>
        )}

        <div className="whatsapp-welcome-footer">
          <span className="lock-icon">🔒</span>
          <span>End-to-end encrypted with XMTP &amp; Ethereum blockchain.</span>
        </div>
      </div>
    </div>
  );
}
