'use client';
import { useState, useRef, useCallback } from 'react';
import { PixelGamepad, PixelTrophy } from '../PixelIcons';

const PALETTE = [
  { name: 'Cyan', color: '#00f0ff' },
  { name: 'Pink', color: '#ff007f' },
  { name: 'Lime', color: '#39ff14' },
  { name: 'Gold', color: '#ffd166' },
  { name: 'White', color: '#ffffff' },
  { name: 'Red', color: '#ff5533' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Eraser', color: '#0a0b12' }
];

const PROMPTS = [
  'BITCOIN', 'ROCKET', 'DIAMOND', 'ROBOT', 'GHOST',
  'CROWN', 'PIZZA', 'SWORD', 'KEY', 'SKULL',
  'STAR', 'HEART', 'MOON', 'CAT', 'ALIEN', 'ETH'
];

export default function PixelSketchModal({
  isOpen,
  onClose,
  onSendSketch,
  onPlayChime
}) {
  const [selectedColor, setSelectedColor] = useState('#00f0ff');
  const [secretWord, setSecretWord] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [grid, setGrid] = useState(() => Array(16 * 16).fill('#0a0b12'));
  const isMouseDownRef = useRef(false);

  const shufflePrompt = () => {
    const next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setSecretWord(next);
  };

  const clearCanvas = () => {
    setGrid(Array(16 * 16).fill('#0a0b12'));
  };

  const setPixelColor = useCallback((index) => {
    setGrid(prev => {
      const copy = [...prev];
      copy[index] = selectedColor;
      return copy;
    });
  }, [selectedColor]);

  const handlePointerDown = (index) => {
    isMouseDownRef.current = true;
    setPixelColor(index);
  };

  const handlePointerEnter = (index) => {
    if (isMouseDownRef.current) {
      setPixelColor(index);
    }
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
  };

  if (!isOpen) return null;

  const handleSend = () => {
    if (onSendSketch) {
      onSendSketch({
        pixels: grid,
        secretWord: secretWord.toUpperCase().trim(),
        hint: `${secretWord.length} Letters`
      });
      if (onPlayChime) onPlayChime();
      onClose();
    }
  };

  return (
    <div 
      className="arcade-activities-overlay" 
      onClick={onClose}
      onPointerUp={handlePointerUp}
    >
      <div 
        className="arcade-activities-modal sketch-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="activities-header">
          <div className="activities-title-group">
            <div className="activities-icon-badge" style={{ background: 'rgba(255, 0, 127, 0.15)', borderColor: '#ff007f' }}>
              <span style={{ fontSize: '1.2rem' }}>🎨</span>
            </div>
            <div>
              <div className="activities-main-title font-arcade">PIXEL PICTIONARY</div>
              <div className="activities-subtitle">Draw on 16x16 canvas. Friends in chat guess the secret word!</div>
            </div>
          </div>
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose}>
            ✕ ESC
          </button>
        </div>

        {/* Prompt Selector Bar */}
        <div className="sketch-prompt-box">
          <div className="prompt-label font-arcade">YOUR SECRET WORD TO DRAW:</div>
          <div className="prompt-word font-arcade">{secretWord}</div>
          <button 
            type="button" 
            className="shuffle-prompt-btn font-arcade"
            onClick={shufflePrompt}
          >
            🎲 NEW WORD
          </button>
        </div>

        {/* 16x16 Drawing Grid */}
        <div 
          className="sketch-grid-container"
          onPointerLeave={handlePointerUp}
        >
          <div className="pixel-canvas-16">
            {grid.map((color, idx) => (
              <div
                key={idx}
                className="pixel-cell"
                style={{ backgroundColor: color }}
                onPointerDown={() => handlePointerDown(idx)}
                onPointerEnter={() => handlePointerEnter(idx)}
              />
            ))}
          </div>
        </div>

        {/* Color Palette Selector */}
        <div className="sketch-palette-bar">
          <div className="palette-colors">
            {PALETTE.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`palette-swatch ${selectedColor === p.color ? 'active' : ''}`}
                style={{ backgroundColor: p.color }}
                title={p.name}
                onClick={() => setSelectedColor(p.color)}
              >
                {selectedColor === p.color && <span className="swatch-check">✓</span>}
              </button>
            ))}
          </div>
          <button 
            type="button" 
            className="clear-canvas-btn font-arcade"
            onClick={clearCanvas}
          >
            🗑️ CLEAR
          </button>
        </div>

        {/* Action Controls */}
        <div className="sketch-footer-actions">
          <button 
            type="button" 
            className="sketch-send-btn font-arcade"
            onClick={handleSend}
          >
            SEND TO CHAT TO GUESS! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
