'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { PixelGamepad, PixelTrophy } from '../PixelIcons';

const PALETTE = [
  { name: 'Cyan', color: '#00f0ff' },
  { name: 'Pink', color: '#ff007f' },
  { name: 'Lime', color: '#39ff14' },
  { name: 'Gold', color: '#ffd166' },
  { name: 'White', color: '#ffffff' },
  { name: 'Red', color: '#ff5533' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Orange', color: '#fb923c' },
  { name: 'Sky', color: '#38bdf8' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Violet', color: '#6366f1' },
  { name: 'Dark Gray', color: '#334155' },
  { name: 'Canvas Black', color: '#0a0b12' }
];

const PROMPTS = [
  'BITCOIN', 'ROCKET', 'DIAMOND', 'ROBOT', 'GHOST',
  'CROWN', 'PIZZA', 'SWORD', 'KEY', 'SKULL',
  'STAR', 'HEART', 'MOON', 'CAT', 'ALIEN', 'ETH',
  'SHIELD', 'BURGER', 'CAMERA', 'CHEST', 'FIRE'
];

// BFS Flood Fill algorithm for 16x16 grid
function floodFillGrid(grid, startIndex, fillColor) {
  const targetColor = grid[startIndex];
  if (targetColor === fillColor) return grid;
  const copy = [...grid];
  const queue = [startIndex];
  const visited = new Uint8Array(256);
  visited[startIndex] = 1;

  while (queue.length > 0) {
    const curr = queue.shift();
    copy[curr] = fillColor;
    const x = curr % 16;
    const y = Math.floor(curr / 16);

    const neighbors = [
      x > 0 ? curr - 1 : -1,
      x < 15 ? curr + 1 : -1,
      y > 0 ? curr - 16 : -1,
      y < 15 ? curr + 16 : -1
    ];

    for (const n of neighbors) {
      if (n >= 0 && !visited[n] && copy[n] === targetColor) {
        visited[n] = 1;
        queue.push(n);
      }
    }
  }
  return copy;
}

export default function PixelSketchModal({
  isOpen,
  onClose,
  onSendSketch,
  onPlayChime
}) {
  const [selectedColor, setSelectedColor] = useState('#00f0ff');
  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'brush' | 'bucket' | 'eraser'
  const [secretWord, setSecretWord] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [grid, setGrid] = useState(() => Array(16 * 16).fill('#0a0b12'));
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const isPointerDownRef = useRef(false);

  // Push to undo stack
  const saveSnapshot = useCallback((newGrid) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1);
      return [...trimmed, newGrid].slice(-15); // Keep last 15 states
    });
    setHistoryIdx(prev => Math.min(14, prev + 1));
  }, [historyIdx]);

  // Handle Undo
  const handleUndo = () => {
    if (historyIdx > 0) {
      const prevGrid = history[historyIdx - 1];
      setGrid(prevGrid);
      setHistoryIdx(prev => prev - 1);
    } else if (historyIdx === 0) {
      setGrid(Array(16 * 16).fill('#0a0b12'));
      setHistoryIdx(-1);
    }
  };

  const shufflePrompt = () => {
    const next = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setSecretWord(next);
  };

  const clearCanvas = () => {
    saveSnapshot(grid);
    setGrid(Array(16 * 16).fill('#0a0b12'));
  };

  const applyTool = useCallback((index, currentGrid) => {
    const colorToApply = activeTool === 'eraser' ? '#0a0b12' : selectedColor;

    if (activeTool === 'bucket') {
      return floodFillGrid(currentGrid, index, colorToApply);
    }

    const copy = [...currentGrid];
    if (activeTool === 'brush') {
      // 2x2 brush stamp
      const x = index % 16;
      const y = Math.floor(index / 16);
      const indices = [index];
      if (x < 15) indices.push(index + 1);
      if (y < 15) indices.push(index + 16);
      if (x < 15 && y < 15) indices.push(index + 17);

      indices.forEach(i => {
        copy[i] = colorToApply;
      });
    } else {
      copy[index] = colorToApply;
    }
    return copy;
  }, [activeTool, selectedColor]);

  const handlePointerDown = (index) => {
    isPointerDownRef.current = true;
    saveSnapshot(grid);
    setGrid(prev => applyTool(index, prev));
  };

  const handlePointerEnter = (index) => {
    if (isPointerDownRef.current && activeTool !== 'bucket') {
      setGrid(prev => applyTool(index, prev));
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
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
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose} aria-label="Close Pictionary">
            ✕ ESC
          </button>
        </div>

        {/* Prompt Selector Bar */}
        <div className="sketch-prompt-box">
          <div className="prompt-label font-arcade">YOUR SECRET WORD:</div>
          <div className="prompt-word font-arcade">{secretWord}</div>
          <button 
            type="button" 
            className="shuffle-prompt-btn font-arcade"
            onClick={shufflePrompt}
            title="Get another word to draw"
          >
            🎲 NEW WORD
          </button>
        </div>

        {/* Tool Selector Toolbar */}
        <div className="sketch-tools-bar font-arcade">
          <div className="tool-btn-group">
            <button
              type="button"
              className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
              onClick={() => setActiveTool('pen')}
              title="Single Pixel Pen"
            >
              ✏️ 1x1
            </button>
            <button
              type="button"
              className={`tool-btn ${activeTool === 'brush' ? 'active' : ''}`}
              onClick={() => setActiveTool('brush')}
              title="2x2 Thick Brush"
            >
              🖌️ 2x2
            </button>
            <button
              type="button"
              className={`tool-btn ${activeTool === 'bucket' ? 'active' : ''}`}
              onClick={() => setActiveTool('bucket')}
              title="Flood Fill Bucket"
            >
              🪣 FILL
            </button>
            <button
              type="button"
              className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => setActiveTool('eraser')}
              title="Eraser"
            >
              🧹 ERASE
            </button>
          </div>
          <div className="tool-btn-group">
            <button
              type="button"
              className="tool-btn undo-btn"
              onClick={handleUndo}
              disabled={historyIdx < 0}
              title="Undo Last Stroke"
            >
              ↩ UNDO
            </button>
            <button 
              type="button" 
              className="tool-btn clear-btn"
              onClick={clearCanvas}
              title="Reset Grid"
            >
              🗑️ CLEAR
            </button>
          </div>
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
                className={`palette-swatch ${selectedColor === p.color && activeTool !== 'eraser' ? 'active' : ''}`}
                style={{ backgroundColor: p.color }}
                title={p.name}
                onClick={() => {
                  setSelectedColor(p.color);
                  if (activeTool === 'eraser') setActiveTool('pen');
                }}
              >
                {selectedColor === p.color && activeTool !== 'eraser' && (
                  <span className="swatch-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="sketch-footer-actions">
          <button 
            type="button" 
            className="sketch-send-btn font-arcade"
            onClick={handleSend}
          >
            DISPATCH TO CHAT TO GUESS! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
