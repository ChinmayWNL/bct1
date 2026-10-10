'use client';
import { useState, useEffect, useRef } from 'react';

export default function VoiceNotePlayer({ audioUrl, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
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

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl, playbackSpeed]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSpeedCycle = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
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
      <div className="vn-waveform-container">
        <div className="vn-wave-bars">
          {waveHeights.map((h, i) => (
            <div 
              key={i} 
              className={`vn-bar ${i <= playedBars && isPlaying ? 'played' : ''}`}
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
