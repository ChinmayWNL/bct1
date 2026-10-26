'use client';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { PixelQr, PixelClose, PixelZap, PixelEye, PixelCheck } from './PixelIcons';

export default function QRCodeModal({ address, username, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!address || !canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      address,
      {
        width: 240,
        margin: 2,
        color: {
          dark: '#c89666',
          light: '#1c1512'
        }
      },
      (error) => {
        if (error) {
          console.error('Failed to generate offline QR code:', error);
          setQrError(true);
        }
      }
    );
  }, [address]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelQr size={18} color="#ffd166" /> <span>Wallet QR Code</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><PixelClose size={16} /></button>
        </div>

        <div className="qr-content-wrapper">
          <div className="qr-frame-glow">
            <canvas ref={canvasRef} className="qr-image" style={{ width: 240, height: 240, display: qrError ? 'none' : 'block' }} />
            {qrError && (
              <div style={{ color: '#ef4444', padding: '20px', fontSize: '0.85rem' }}>
                Failed to render QR Code offline
              </div>
            )}
            <div className="qr-center-badge">
              <PixelZap size={16} color="#ffd166" />
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
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {copied ? <><PixelCheck size={14} color="#000" /> <span>Copied to Clipboard!</span></> : <><PixelEye size={14} /> <span>Copy Address</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
