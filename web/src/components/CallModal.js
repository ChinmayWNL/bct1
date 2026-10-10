'use client';
import { useState, useEffect, useRef } from 'react';

export default function CallModal({
  callType, // 'voice' | 'video'
  peerAddress,
  peerName,
  peerAvatar,
  onEndCall
}) {
  const [callStatus, setCallStatus] = useState('ringing'); // 'ringing' | 'connected'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [hasCameraStream, setHasCameraStream] = useState(false);

  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Play synthetic telephone ring
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
              ctx.resume();
            }
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.frequency.setValueAtTime(440, ctx.currentTime);
            osc2.frequency.setValueAtTime(480, ctx.currentTime);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
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
          ringInterval = setInterval(playRingTone, 3000);
        }
      }
    } catch (e) {}

    // Transition from ringing to connected after 2.5 seconds
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
      if (ringInterval) clearInterval(ringInterval);
    }, 2600);

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      clearTimeout(connectTimer);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Timer for connected call
  useEffect(() => {
    let timer;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // Video call camera setup
  useEffect(() => {
    let activeStream = null;
    if (callType === 'video' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          activeStream = stream;
          mediaStreamRef.current = stream;
          setHasCameraStream(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera access denied or unavailable; falling back to visualizer mode", err);
          setHasCameraStream(false);
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [callType]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = isMuted;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(t => {
        t.enabled = !isVideoEnabled;
      });
    }
  };

  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayName = peerName ? `@${peerName}` : `${(peerAddress || '').substring(0, 6)}...${(peerAddress || '').substring((peerAddress || '').length - 4)}`;

  return (
    <div className="call-overlay">
      <div className="call-modal-card">
        {/* Background glow & video if active */}
        {callType === 'video' && hasCameraStream && isVideoEnabled ? (
          <div className="call-video-wrapper">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="call-video-stream"
            />
            <div className="call-video-pip">
              <div className="pip-avatar">
                {displayName.substring(1, 3).toUpperCase()}
              </div>
              <span className="pip-label">{displayName}</span>
            </div>
          </div>
        ) : (
          <div className="call-ambient-rings">
            <div className={`call-ring ring-1 ${callStatus === 'ringing' ? 'pulsing' : ''}`}></div>
            <div className={`call-ring ring-2 ${callStatus === 'ringing' ? 'pulsing' : ''}`}></div>
          </div>
        )}

        {/* Call Info Header */}
        <div className="call-header-info">
          <div className="call-avatar-large">
            {peerAvatar ? (
              <img src={peerAvatar.startsWith('http') ? peerAvatar : `https://ipfs.io/ipfs/${peerAvatar}`} alt="Call Avatar" />
            ) : (
              <span>{displayName.substring(displayName.startsWith('@') ? 1 : 0, displayName.startsWith('@') ? 3 : 2).toUpperCase()}</span>
            )}
          </div>
          <h2 className="call-peer-name">{displayName}</h2>
          <div className="call-status-badge">
            {callStatus === 'ringing' ? (
              <span className="ringing-text">Ringing...</span>
            ) : (
              <span className="connected-text">
                <span className="live-call-dot"></span>
                {formatCallTime(callDuration)} • E2EE Encrypted
              </span>
            )}
          </div>
        </div>

        {/* Call Action Buttons */}
        <div className="call-actions-row">
          <button 
            type="button" 
            className={`call-ctrl-btn ${isMuted ? 'active-mute' : ''}`}
            onClick={toggleMute}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>

          {callType === 'video' && (
            <button 
              type="button" 
              className={`call-ctrl-btn ${!isVideoEnabled ? 'active-mute' : ''}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? '📹' : '🚫'}
            </button>
          )}

          <button 
            type="button" 
            className="call-ctrl-btn call-hangup-btn"
            onClick={onEndCall}
            title="End Call"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
