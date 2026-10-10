'use client';
import { useState } from 'react';

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
  onStartBlockBotChat
}) {
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="hero-dashboard-container">
      {/* Background ambient lighting */}
      <div className="hero-ambient-glow glow-1"></div>
      <div className="hero-ambient-glow glow-2"></div>

      <div className="hero-dashboard-content">
        {/* Top Hero Banner */}
        <div className="hero-header-badge">
          <span className="live-pulsing-dot"></span>
          <span>XMTP V3 ENCRYPTED PROTOCOL • DECENTRALIZED</span>
        </div>

        <h1 className="hero-title">
          Sovereign <span className="hero-title-highlight">Web3 Messaging</span>
        </h1>
        <p className="hero-subtitle">
          End-to-end encrypted messaging, peer-to-peer audio notes, and instant crypto tipping powered by Ethereum and XMTP.
        </p>

        {walletAddress ? (
          <>
            {/* Dashboard Cards Grid */}
            <div className="hero-cards-grid">
              {/* Card 1: Identity & Balance */}
              <div className="hero-card hero-card-featured">
                <div className="hero-card-header">
                  <div className="hero-card-icon">🆔</div>
                  <div className="hero-card-tag">Account</div>
                </div>
                <div className="hero-card-body">
                  <div className="hero-account-name">
                    {userProfile?.username ? `@${userProfile.username}` : (ensName || 'Ethereum Wallet')}
                  </div>
                  <div className="hero-account-addr">
                    <span>{formatAddress(walletAddress)}</span>
                    <button className="mini-copy-btn" onClick={handleCopy} title="Copy address">
                      {copied ? '✓ Copied' : '📋'}
                    </button>
                    <button className="mini-qr-btn" onClick={onOpenQR} title="View QR Code">
                      🏁 QR
                    </button>
                  </div>
                  <div className="hero-balance-row">
                    <span className="hero-balance-label">Balance:</span>
                    <span className="hero-balance-val">
                      {userBalance ? `${parseFloat(userBalance).toFixed(4)} ETH` : '0.0000 ETH'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Network & Encryption */}
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="hero-card-icon">🛡️</div>
                  <div className="hero-card-tag">Protocol</div>
                </div>
                <div className="hero-card-body">
                  <div className="hero-status-item">
                    <span className="status-label">Network:</span>
                    <span className="status-badge network-badge">
                      <span className="network-dot"></span>
                      {networkName || 'Sepolia / Testnet'}
                    </span>
                  </div>
                  <div className="hero-status-item">
                    <span className="status-label">Encryption:</span>
                    <span className="status-badge secure-badge">
                      MLS 256-bit E2EE
                    </span>
                  </div>
                  <div className="hero-status-item">
                    <span className="status-label">Identity:</span>
                    <span className="status-badge eoa-badge">
                      Self-Custodial (EOA)
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Capabilities */}
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="hero-card-icon">⚡</div>
                  <div className="hero-card-tag">Features</div>
                </div>
                <div className="hero-card-body">
                  <ul className="hero-feature-list">
                    <li><span className="check">✓</span> <span>In-Chat ETH Tipping & Transfers</span></li>
                    <li><span className="check">✓</span> <span>Voice Notes with Audio Waves</span></li>
                    <li><span className="check">✓</span> <span>ENS Domains & On-Chain Avatars</span></li>
                    <li><span className="check">✓</span> <span>Message Reactions, Replies & Edits</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="hero-quick-actions-bar">
              <span className="quick-actions-label">Quick Actions:</span>
              <button className="quick-action-chip primary-chip" onClick={onStartChatClick}>
                💬 Start New Chat
              </button>
              <button className="quick-action-chip bot-chip" onClick={onStartBlockBotChat}>
                🤖 Test Chat with BlockBot
              </button>
              <button className="quick-action-chip" onClick={onOpenProfile}>
                🆔 Edit Profile
              </button>
              <button className="quick-action-chip" onClick={onOpenQR}>
                🏁 Share QR Code
              </button>
            </div>
          </>
        ) : (
          <div className="hero-connect-cta">
            <button className="btn-connect hero-connect-btn" onClick={onConnectWallet}>
              ⚡ Connect MetaMask to Launch
            </button>
            <p className="hero-connect-hint">
              Supports MetaMask, Coinbase Wallet, Brave Wallet, and any EIP-1193 provider.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
