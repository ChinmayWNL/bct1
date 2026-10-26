'use client';
import { useEffect, useRef } from 'react';
import { PixelVideo, PixelPhone, PixelClose } from './PixelIcons';

export default function IncomingCallModal({
  callType, // 'voice' | 'video'
  callerAddress,
  callerName,
  callerAvatar,
  onAccept,
  onDecline
}) {
  const audioCtxRef = useRef(null);

  // Play telephone ring for incoming call
  useEffect(() => {
    let ringInterval;
    try {
      if (typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;

          const playRingTone = () => {
            if (ctx.state === 'suspended') {
              ctx.resume().catch(() => {});
            }
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, ctx.currentTime);
            osc2.frequency.setValueAtTime(480, ctx.currentTime);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 1.2);
            osc2.stop(ctx.currentTime + 1.2);
          };

          playRingTone();
          ringInterval = setInterval(playRingTone, 2800);
        }
      }
    } catch (e) {
      console.warn("Audio ringtone error", e);
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const displayName = callerName ? `@${callerName}` : `${(callerAddress || '').substring(0, 6)}...${(callerAddress || '').substring((callerAddress || '').length - 4)}`;

  return (
    <div className="call-overlay">
      <div className="call-modal-card incoming-call-card">
        <div className="call-ambient-rings">
          <div className="call-ring ring-1 pulsing"></div>
          <div className="call-ring ring-2 pulsing"></div>
        </div>

        {/* Caller Header Info */}
        <div className="call-header-info">
          <div className="call-avatar-large">
            {callerAvatar ? (
              <img src={callerAvatar.startsWith('http') ? callerAvatar : `https://ipfs.io/ipfs/${callerAvatar}`} alt="Caller Avatar" />
            ) : (
              <span>{displayName.substring(displayName.startsWith('@') ? 1 : 0, displayName.startsWith('@') ? 3 : 2).toUpperCase()}</span>
            )}
          </div>
          <h2 className="call-peer-name">{displayName}</h2>
          <div className="call-status-badge">
            <span className="ringing-text" style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {callType === 'video' ? <PixelVideo size={16} color="#38bdf8" /> : <PixelPhone size={16} color="#38bdf8" />}
              <span>Incoming {callType === 'video' ? 'Video Call' : 'Voice Call'}...</span>
            </span>
          </div>
        </div>

        {/* Accept / Decline Action Buttons */}
        <div className="call-actions-row" style={{ gap: '36px' }}>
          <button 
            type="button" 
            className="call-ctrl-btn call-hangup-btn"
            onClick={onDecline}
            title="Decline Call"
            style={{ width: '64px', height: '64px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <PixelClose size={28} color="#fff" />
          </button>

          <button 
            type="button" 
            className="call-ctrl-btn call-accept-btn"
            onClick={onAccept}
            title="Accept Call"
            style={{
              width: '64px',
              height: '64px',
              background: '#10b981',
              borderColor: '#10b981',
              color: '#fff',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PixelPhone size={28} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
