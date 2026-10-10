'use client';
import { useState } from 'react';

export default function QRCodeModal({ address, username, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const qrUrl = address 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(address)}&color=60a5fa&bgcolor=0b1120&margin=10`
    : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.15rem' }}>
            <span>⚡</span> Wallet QR Code
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="qr-content-wrapper">
          <div className="qr-frame-glow">
            {qrUrl && (
              <img 
                src={qrUrl} 
                alt="Wallet Address QR" 
                className="qr-image"
                width={240}
                height={240}
              />
            )}
            <div className="qr-center-badge">
              <span>⚡</span>
            </div>
          </div>

          <div className="qr-meta-info">
            <h4 className="qr-user-name">{username ? `@${username}` : 'Ethereum Wallet'}</h4>
            <div className="qr-address-box">
              <span className="qr-address-text">{address}</span>
            </div>
          </div>

          <button 
            type="button" 
            className={`modal-btn-primary ${copied ? 'btn-copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? "✓ Copied to Clipboard!" : "📋 Copy Address"}
          </button>
        </div>
      </div>
    </div>
  );
}
