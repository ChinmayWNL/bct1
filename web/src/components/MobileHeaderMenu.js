'use client';
import {
  PixelSearch,
  PixelLock,
  PixelAlien,
  PixelUser,
  PixelTrash
} from './PixelIcons';

export default function MobileHeaderMenu({
  isOpen,
  onClose,
  isGroup,
  peerName,
  peerAddress,
  onOpenSearch,
  onOpenGroupMembers,
  onOpenContactDetails,
  onOpenCipher,
  disappearingTimer,
  onSetDisappearingTimer,
  onExportChat,
  onClearChat
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay mobile-sheet-overlay" onClick={onClose}>
      <div className="modal-card mobile-header-menu-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Swipe Handle */}
        <div className="mobile-sheet-handle-bar">
          <div className="mobile-sheet-handle"></div>
        </div>

        {/* Sheet Title */}
        <div className="mobile-header-menu-top">
          <div>
            <h3 className="font-arcade" style={{ fontSize: '0.88rem', color: 'var(--arcade-gold, #ffd166)', margin: 0 }}>
              CONVERSATION CONTROLS
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--coffee-text-muted)', margin: '2px 0 0' }}>
              {peerName || (peerAddress ? `${peerAddress.slice(0, 8)}…` : 'Active Chat')}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="mobile-header-menu-list">
          {/* 1. In-Chat Search */}
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
          >
            <div className="menu-item-icon"><PixelSearch size={18} color="#00f0ff" /></div>
            <div className="menu-item-text">
              <span className="menu-item-title font-arcade">Search Messages</span>
              <span className="menu-item-desc">Find words or transaction notes</span>
            </div>
          </button>

          {/* 2. Group Members or Contact Details */}
          {isGroup ? (
            <button
              type="button"
              className="mobile-menu-item"
              onClick={() => {
                onClose();
                onOpenGroupMembers();
              }}
            >
              <div className="menu-item-icon"><PixelAlien size={18} color="#ff007f" /></div>
              <div className="menu-item-text">
                <span className="menu-item-title font-arcade">Manage Group Members</span>
                <span className="menu-item-desc">View roster, group avatar & invite members</span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="mobile-menu-item"
              onClick={() => {
                onClose();
                onOpenContactDetails();
              }}
            >
              <div className="menu-item-icon"><PixelUser size={18} color="#00f0ff" /></div>
              <div className="menu-item-text">
                <span className="menu-item-title font-arcade">Contact Info & Nickname</span>
                <span className="menu-item-desc">View profile, set custom nickname & safety</span>
              </div>
            </button>
          )}

          {/* 3. Playfair Cipher */}
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => {
              onClose();
              onOpenCipher();
            }}
          >
            <div className="menu-item-icon"><PixelLock size={18} color="#39ff14" /></div>
            <div className="menu-item-text">
              <span className="menu-item-title font-arcade">Playfair Cipher Key</span>
              <span className="menu-item-desc">Set secret pass-phrase for scrambled messages</span>
            </div>
          </button>

          {/* 4. Disappearing Messages */}
          <div className="mobile-menu-item timer-selector-item">
            <div className="menu-item-icon">
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⏱️</span>
            </div>
            <div className="menu-item-text" style={{ flex: 1 }}>
              <span className="menu-item-title font-arcade">Disappearing Messages</span>
              <div className="timer-pills-row">
                {[
                  { label: 'Off', val: 0 },
                  { label: '1m', val: 60 },
                  { label: '24h', val: 86400 },
                  { label: '7d', val: 604800 }
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    className={`timer-pill-btn ${disappearingTimer === t.val ? 'active' : ''}`}
                    onClick={() => onSetDisappearingTimer(t.val)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Export Transcript */}
          <button
            type="button"
            className="mobile-menu-item"
            onClick={() => {
              onClose();
              onExportChat();
            }}
          >
            <div className="menu-item-icon"><span style={{ fontSize: '1.1rem' }}>📜</span></div>
            <div className="menu-item-text">
              <span className="menu-item-title font-arcade">Export Chat Transcript</span>
              <span className="menu-item-desc">Download encrypted chat log to device</span>
            </div>
          </button>

          {/* 6. Clear Local Chat */}
          <button
            type="button"
            className="mobile-menu-item danger"
            onClick={() => {
              if (confirm('Clear local messages for this conversation?')) {
                onClose();
                onClearChat();
              }
            }}
          >
            <div className="menu-item-icon"><PixelTrash size={18} color="#ff007f" /></div>
            <div className="menu-item-text">
              <span className="menu-item-title font-arcade" style={{ color: '#ff007f' }}>Clear Messages</span>
              <span className="menu-item-desc">Clear local buffer on this device</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
