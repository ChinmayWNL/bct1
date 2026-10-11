'use client';
import { useState, useEffect, useRef } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export default function CallModal({
  callType, // 'voice' | 'video'
  callId,
  isOutgoing = true,
  initialOffer = null,
  peerAddress,
  peerName,
  peerAvatar,
  isDemoBot = false,
  onSendSignal,
  onEndCall
}) {
  const [callStatus, setCallStatus] = useState(isOutgoing ? 'ringing' : 'connecting'); // 'ringing' | 'connecting' | 'connected' | 'declined' | 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [callStatusMessage, setCallStatusMessage] = useState(isOutgoing ? 'Ringing...' : 'Connecting encrypted stream...');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  // 1. Play synthetic telephone ringtone while caller waits for answer
  useEffect(() => {
    let ringInterval;
    if (isOutgoing && callStatus === 'ringing') {
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
            ringInterval = setInterval(playRingTone, 2800);
          }
        }
      } catch (e) {
        console.warn("Ringtone error", e);
      }
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, [isOutgoing, callStatus]);

  // 2. Call duration counter
  useEffect(() => {
    let timer;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  // 3. WebRTC Peer Connection & Stream Lifecycle
  useEffect(() => {
    let isCancelled = false;

    const setupWebRTC = async () => {
      try {
        // A. Capture local camera/microphone
        const constraints = {
          audio: true,
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaErr) {
          console.warn("Could not acquire requested media stream, falling back to audio only:", mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        }

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        // B. Handle Demo Bot simulation
        if (isDemoBot) {
          const botTimer = setTimeout(() => {
            if (!isCancelled) {
              setCallStatus('connected');
              setCallStatusMessage('Connected with BlockBot');
            }
          }, 2400);
          return () => clearTimeout(botTimer);
        }

        // C. Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Remote track handler
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteStream) {
            remoteStreamRef.current = remoteStream;
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
            }
            if (remoteVideoRef.current && callType === 'video') {
              remoteVideoRef.current.srcObject = remoteStream;
              setHasRemoteVideo(true);
            }
          }
        };

        // ICE candidate generation
        pc.onicecandidate = (event) => {
          if (event.candidate && onSendSignal) {
            onSendSignal({
              subType: 'candidate',
              candidate: event.candidate,
              callId
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setCallStatus('connected');
            setCallStatusMessage('Connected');
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
            setCallStatusMessage('Call Disconnected');
          }
        };

        // D. Outgoing Call Offer Generation
        if (isOutgoing) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (onSendSignal) {
            onSendSignal({
              subType: 'offer',
              sdp: offer,
              callType,
              callId
            });
          }
        } 
        // E. Incoming Accepted Call: Set Remote Offer & Create Answer
        else if (initialOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(initialOffer));

          // Drain queued candidates if any arrived before setup
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (onSendSignal) {
            onSendSignal({
              subType: 'answer',
              sdp: answer,
              callId
            });
          }

          setCallStatus('connected');
          setCallStatusMessage('Connected');
        }
      } catch (err) {
        console.error("WebRTC initialization error:", err);
        setCallStatusMessage('Media / Connection Error: ' + err.message);
      }
    };

    setupWebRTC();

    return () => {
      isCancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [callType, callId, isOutgoing, isDemoBot]);

  // 4. Handle incoming WebRTC signaling events from peer over XMTP
  useEffect(() => {
    const handleSignalEvent = async (e) => {
      const signal = e.detail;
      if (!signal || (signal.callId && signal.callId !== callId)) return;

      const pc = peerConnectionRef.current;

      // Peer accepted and sent answer
      if (signal.subType === 'answer' && pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          setCallStatus('connected');
          setCallStatusMessage('Connected');

          // Process any queued candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (err) {}
          }
        } catch (err) {
          console.error("Error setting remote description from answer:", err);
        }
      }

      // Received ICE Candidate
      else if (signal.subType === 'candidate') {
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.warn("Error adding ICE candidate:", err);
          }
        } else {
          pendingCandidatesRef.current.push(signal.candidate);
        }
      }

      // Peer declined or hung up
      else if (signal.subType === 'reject') {
        setCallStatus('declined');
        setCallStatusMessage('Call Declined');
        setTimeout(() => {
          onEndCall();
        }, 1500);
      } else if (signal.subType === 'end') {
        setCallStatus('ended');
        setCallStatusMessage('Call Ended');
        setTimeout(() => {
          onEndCall();
        }, 1200);
      }
    };

    window.addEventListener('blockchat:call-signal', handleSignalEvent);
    return () => window.removeEventListener('blockchat:call-signal', handleSignalEvent);
  }, [callId, onEndCall]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !nextMuted;
      });
    }
  };

  const toggleVideo = () => {
    const nextVideo = !isVideoEnabled;
    setIsVideoEnabled(nextVideo);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => {
        t.enabled = nextVideo;
      });
    }
  };

  const handleHangUp = () => {
    if (onSendSignal) {
      onSendSignal({ subType: 'end', callId });
    }
    onEndCall();
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
        {/* Hidden Remote Audio Element for Crisp Playback */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Video Mode Streams */}
        {callType === 'video' ? (
          <div className="call-video-wrapper">
            {/* Remote Video Stream (Main Feed) */}
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="call-video-stream"
              style={{ display: hasRemoteVideo ? 'block' : 'none' }}
            />

            {/* If remote video not yet transmitting, show avatar backdrop */}
            {!hasRemoteVideo && (
              <div className="call-video-stream" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1d' }}>
                <div className="call-avatar-large" style={{ margin: 0, transform: 'scale(1.2)' }}>
                  {peerAvatar ? (
                    <img src={peerAvatar.startsWith('http') ? peerAvatar : `https://ipfs.io/ipfs/${peerAvatar}`} alt="Peer Avatar" />
                  ) : (
                    <span>{displayName.substring(displayName.startsWith('@') ? 1 : 0, displayName.startsWith('@') ? 3 : 2).toUpperCase()}</span>
                  )}
                </div>
              </div>
            )}

            {/* Local Video Stream (Picture-in-Picture) */}
            {isVideoEnabled && (
              <div className="call-video-pip">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Voice Call Mode Ambient Animation */
          <div className="call-ambient-rings">
            <div className={`call-ring ring-1 ${callStatus === 'ringing' || callStatus === 'connecting' ? 'pulsing' : ''}`}></div>
            <div className={`call-ring ring-2 ${callStatus === 'ringing' || callStatus === 'connecting' ? 'pulsing' : ''}`}></div>
          </div>
        )}

        {/* Call Info Header */}
        <div className="call-header-info">
          {callType !== 'video' && (
            <div className="call-avatar-large">
              {peerAvatar ? (
                <img src={peerAvatar.startsWith('http') ? peerAvatar : `https://ipfs.io/ipfs/${peerAvatar}`} alt="Call Avatar" />
              ) : (
                <span>{displayName.substring(displayName.startsWith('@') ? 1 : 0, displayName.startsWith('@') ? 3 : 2).toUpperCase()}</span>
              )}
            </div>
          )}
          <h2 className="call-peer-name">{displayName}</h2>
          <div className="call-status-badge">
            {callStatus === 'connected' ? (
              <span className="connected-text">
                <span className="live-call-dot"></span>
                {formatCallTime(callDuration)} • P2P WebRTC E2EE
              </span>
            ) : (
              <span className="ringing-text" style={{ color: callStatus === 'declined' ? '#f87171' : '#93c5fd' }}>
                {callStatusMessage}
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
            onClick={handleHangUp}
            title="End Call"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
