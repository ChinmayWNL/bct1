'use client';
import { useState, useEffect, useRef, useId } from 'react';

export default function VoiceNotePlayer({ audioUrl, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);
  const playerId = useId();

  // Initialize and manage audio lifecycle (Only re-instantiate if audioUrl changes)
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackSpeed;

    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(prev => prev || Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = (e) => {
      console.warn("Audio element error", e);
      setIsPlaying(false);
    };

    // Coordinate single-audio playback across the entire app
    const handleOtherAudioPlay = (e) => {
      if (e.detail?.playerId !== playerId && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('blockchat:audio-play', handleOtherAudioPlay);

    return () => {
      window.removeEventListener('blockchat:audio-play', handleOtherAudioPlay);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [audioUrl, playerId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Notify other active players to pause
      window.dispatchEvent(new CustomEvent('blockchat:audio-play', { detail: { playerId } }));
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSpeedCycle = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    // Apply speed without re-instantiating audio or interrupting currentTime
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleWaveformSeek = (e) => {
    if (!audioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * totalDuration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) : 0;
  const barCount = 18;
  const playedBars = Math.floor(progressPercent * barCount);

  // Deterministic wave heights for visual spectrum
  const waveHeights = [8, 14, 20, 12, 16, 22, 10, 18, 14, 20, 16, 12, 18, 22, 14, 10, 16, 8];

  return (
    <div className="voice-note-player">
      <button type="button" className="vn-play-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause voice note" : "Play voice note"}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div 
        className="vn-waveform-container" 
        onClick={handleWaveformSeek} 
        style={{ cursor: 'pointer' }}
        title="Click waveform to seek"
      >
        <div className="vn-wave-bars">
          {waveHeights.map((h, i) => (
            <div 
              key={i} 
              className={`vn-bar ${i <= playedBars ? 'played' : ''}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <div className="vn-meta">
          <span>{isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}</span>
          <span>Voice Note</span>
        </div>
      </div>
      <button 
        type="button" 
        className="vn-speed-btn" 
        onClick={handleSpeedCycle}
        title="Change playback speed"
      >
        {playbackSpeed}x
      </button>
    </div>
  );
}
