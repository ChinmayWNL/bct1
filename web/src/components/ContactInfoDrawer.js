'use client';
import { useState, useMemo } from 'react';
import VoiceNotePlayer from '@/components/VoiceNotePlayer';

export default function ContactInfoDrawer({
  peerAddress,
  peerName,
  peerAvatar,
  messages = [],
  starredMessages = {},
  disappearingTimer,
  setDisappearingTimer,
  isMuted,
  setIsMuted,
  onClearChat,
  onOpenQR,
  onOpenLightbox,
  onUnstarMessage,
  onClose
}) {
  const [activeMediaTab, setActiveMediaTab] = useState('media');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!peerAddress) return;
    try {
      await navigator.clipboard.writeText(peerAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard copy failed", err);
    }
  };

  const displayName = peerName ? `@${peerName}` : `${(peerAddress || '').substring(0, 6)}...${(peerAddress || '').substring((peerAddress || '').length - 4)}`;

  // Efficient memoized parsing of media, voice notes and starred messages
  const { photos, voiceNotes, starredList } = useMemo(() => {
    const p = [];
    const vn = [];
    const star = [];

    messages.forEach(msg => {
      let data = { type: 'text', text: '' };
      if (typeof msg.content === 'string') {
        if (msg.content.startsWith('[JSON_MSG]')) {
          try { data = JSON.parse(msg.content.replace('[JSON_MSG]', '')); } catch (e) {}
        } else {
          data = { type: 'text', text: msg.content };
        }
      } else if (msg.content && msg.content.text) {
        data = { type: 'text', text: msg.content.text };
      }

      if (data.type === 'media' && data.media) {
        p.push({ id: msg.id, media: data.media, caption: data.text });
      }
      if (data.type === 'audio' && data.audioUrl) {
        vn.push({ id: msg.id, duration: data.duration, audioUrl: data.audioUrl });
      }
      if (starredMessages[msg.id]) {
        star.push({ id: msg.id, text: data.text || data.note || (data.type === 'media' ? '📷 Photo' : '🎤 Voice Note') });
      }
    });

    return { photos: p, voiceNotes: vn, starredList: star };
  }, [messages, starredMessages]);

  return (
    <div className="contact-drawer-overlay" onClick={onClose}>
      <div className="contact-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Contact Info</h3>
          <button className="drawer-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {/* Avatar & Identity */}
          <div className="drawer-profile-card">
            <div className="drawer-avatar-lg">
              {peerAvatar ? (
                <img src={peerAvatar.startsWith('http') ? peerAvatar : `https://ipfs.io/ipfs/${peerAvatar}`} alt="Contact Avatar" />
              ) : (
                <span>{displayName.substring(displayName.startsWith('@') ? 1 : 0, displayName.startsWith('@') ? 3 : 2).toUpperCase()}</span>
              )}
            </div>
            <h2 className="drawer-name">{displayName}</h2>
            <div className="drawer-address-row">
              <span className="drawer-address-text">{peerAddress}</span>
              <button className="mini-copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copied' : '📋'}
              </button>
              <button className="mini-qr-btn" onClick={onOpenQR}>
                🏁 QR
              </button>
            </div>
          </div>

          {/* WhatsApp Settings: Disappearing Messages */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>⏱️ Disappearing Messages</span>
            </div>
            <div className="disappearing-options">
              {[
                { label: 'Off', val: 0 },
                { label: '1m (Demo)', val: 60 },
                { label: '24 Hours', val: 86400 },
                { label: '7 Days', val: 604800 }
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  className={`disappearing-btn ${disappearingTimer === opt.val ? 'active' : ''}`}
                  onClick={() => setDisappearingTimer(opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <small style={{ color: '#64748b', fontSize: '0.72rem', display: 'block', marginTop: '6px' }}>
              {disappearingTimer > 0 
                ? `New messages in this chat will disappear after ${disappearingTimer === 60 ? '1 minute' : disappearingTimer === 86400 ? '24 hours' : '7 days'}.` 
                : 'Messages do not disappear.'}
            </small>
          </div>

          {/* Mute Notifications Toggle */}
          <div className="drawer-toggle-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>🔔 Mute Notifications</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Silence notification sounds for this chat</div>
            </div>
            <label className="switch-toggle">
              <input 
                type="checkbox" 
                checked={isMuted} 
                onChange={(e) => setIsMuted(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Starred Messages Section */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>⭐ Starred Messages ({starredList.length})</span>
            </div>
            {starredList.length > 0 ? (
              <div className="starred-list-scroll">
                {starredList.map(item => (
                  <div key={item.id} className="starred-item-card">
                    <span className="star-icon">⭐</span>
                    <span className="starred-item-text" style={{ flex: 1 }}>{item.text}</span>
                    <button 
                      type="button" 
                      className="mini-copy-btn" 
                      onClick={(e) => { e.stopPropagation(); onUnstarMessage && onUnstarMessage(item.id); }}
                      title="Unstar message"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-subtext">No starred messages in this conversation.</div>
            )}
          </div>

          {/* Media & Audio Gallery */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <span>📁 Media & Audio ({photos.length + voiceNotes.length})</span>
            </div>
            <div className="media-tabs-nav">
              <button 
                type="button" 
                className={`media-tab-btn ${activeMediaTab === 'media' ? 'active' : ''}`}
                onClick={() => setActiveMediaTab('media')}
              >
                Photos ({photos.length})
              </button>
              <button 
                type="button" 
                className={`media-tab-btn ${activeMediaTab === 'voice' ? 'active' : ''}`}
                onClick={() => setActiveMediaTab('voice')}
              >
                Voice Notes ({voiceNotes.length})
              </button>
            </div>

            {activeMediaTab === 'media' && (
              <div className="media-gallery-grid">
                {photos.map(p => (
                  <div 
                    key={p.id} 
                    className="media-thumb-item" 
                    onClick={() => onOpenLightbox && onOpenLightbox(p.media)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view full photo"
                  >
                    <img src={p.media} alt="Shared Photo" />
                  </div>
                ))}
                {photos.length === 0 && <div className="empty-subtext">No photos shared yet.</div>}
              </div>
            )}

            {activeMediaTab === 'voice' && (
              <div className="voice-gallery-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {voiceNotes.map((vn, i) => (
                  <div key={vn.id || i} className="voice-gallery-item" style={{ padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <VoiceNotePlayer audioUrl={vn.audioUrl} duration={vn.duration} />
                  </div>
                ))}
                {voiceNotes.length === 0 && <div className="empty-subtext">No voice notes recorded yet.</div>}
              </div>
            )}
          </div>

          {/* Danger Zone: Clear Chat */}
          <div style={{ marginTop: '24px' }}>
            <button 
              type="button" 
              className="drawer-danger-btn"
              onClick={onClearChat}
            >
              🗑️ Clear Message History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
