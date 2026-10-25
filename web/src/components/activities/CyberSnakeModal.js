'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { PixelGamepad, PixelTrophy, PixelZap } from '../PixelIcons';

const GRID_SIZE = 20;
const CANVAS_SIZE = 360;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 18px

const FOOD_TYPES = [
  { id: 'eth', name: 'ETH Orb', points: 25, color: '#00f0ff', emoji: '💎' },
  { id: 'coin', name: 'Gold Coin', points: 15, color: '#ffd166', emoji: '🪙' },
  { id: 'cyber', name: 'Cyber Core', points: 35, color: '#ff007f', emoji: '⚡' },
  { id: 'berry', name: 'Byte Berry', points: 10, color: '#39ff14', emoji: '🟢' }
];

export default function CyberSnakeModal({
  isOpen,
  onClose,
  onSendChallenge,
  onAddXp,
  onPlayChime
}) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [food, setFood] = useState({ x: 10, y: 10, type: FOOD_TYPES[0] });

  const snakeRef = useRef([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]);
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const gameLoopRef = useRef(null);

  // Load high score
  useEffect(() => {
    try {
      const saved = localStorage.getItem('blockchat_snake_highscore');
      if (saved) setHighScore(parseInt(saved, 10) || 0);
    } catch (e) {}
  }, []);

  // Web Audio Synth for retro sound effects
  const playRetroSound = useCallback((type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'eat') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (err) {}
  }, []);

  // Spawn random food
  const spawnFood = useCallback((currentSnake) => {
    let newX, newY, collision;
    do {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
      collision = currentSnake.some(seg => seg.x === newX && seg.y === newY);
    } while (collision);

    const randomType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
    const newFood = { x: newX, y: newY, type: randomType };
    setFood(newFood);
    return newFood;
  }, []);

  // Reset and Start Game
  const startGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ];
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    spawnFood(snakeRef.current);
  }, [spawnFood]);

  // Handle Arrow/WASD key presses
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const cur = dirRef.current;

      if ((key === 'arrowup' || key === 'w') && cur.y === 0) {
        nextDirRef.current = { x: 0, y: -1 };
        e.preventDefault();
      } else if ((key === 'arrowdown' || key === 's') && cur.y === 0) {
        nextDirRef.current = { x: 0, y: 1 };
        e.preventDefault();
      } else if ((key === 'arrowleft' || key === 'a') && cur.x === 0) {
        nextDirRef.current = { x: -1, y: 0 };
        e.preventDefault();
      } else if ((key === 'arrowright' || key === 'd') && cur.x === 0) {
        nextDirRef.current = { x: 1, y: 0 };
        e.preventDefault();
      } else if (key === ' ' && isGameOver) {
        startGame();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGameOver, startGame]);

  // Main Game Loop
  useEffect(() => {
    if (!isOpen || !isPlaying || isGameOver) return;

    const interval = setInterval(() => {
      dirRef.current = nextDirRef.current;
      const snake = [...snakeRef.current];
      const head = {
        x: snake[0].x + dirRef.current.x,
        y: snake[0].y + dirRef.current.y
      };

      // Wall Collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        handleGameOver();
        return;
      }

      // Self Collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        handleGameOver();
        return;
      }

      snake.unshift(head);

      // Check Food Collision
      if (head.x === food.x && head.y === food.y) {
        playRetroSound('eat');
        setScore(prev => {
          const next = prev + food.type.points;
          if (next > highScore) {
            setHighScore(next);
            try { localStorage.setItem('blockchat_snake_highscore', String(next)); } catch (e) {}
          }
          return next;
        });
        spawnFood(snake);
      } else {
        snake.pop();
      }

      snakeRef.current = snake;
      drawCanvas();
    }, 110);

    gameLoopRef.current = interval;
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, isGameOver, food, highScore, playRetroSound, spawnFood]);

  const handleGameOver = () => {
    playRetroSound('die');
    setIsGameOver(true);
    setIsPlaying(false);
    if (score > 50 && onAddXp) {
      onAddXp(Math.min(150, Math.floor(score / 2)), 'Cyber Snake Run');
    }
  };

  // Canvas Renderer
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0a0b12';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw retro grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw Food with glowing shadow
    ctx.save();
    ctx.shadowColor = food.type.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = food.type.color;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Draw Snake
    const snake = snakeRef.current;
    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      ctx.save();
      if (isHead) {
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 12;
      } else {
        const gradientRatio = idx / snake.length;
        ctx.fillStyle = gradientRatio > 0.5 ? '#10b981' : '#00f0ff';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );

      // Pixel eye on head
      if (isHead) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(
          seg.x * CELL_SIZE + 4,
          seg.y * CELL_SIZE + 4,
          3,
          3
        );
      }
      ctx.restore();
    });
  }, [food]);

  // Draw on mount/updates
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  if (!isOpen) return null;

  const handlePostChallenge = () => {
    if (onSendChallenge) {
      onSendChallenge({
        game: 'snake',
        score: score
      });
      if (onPlayChime) onPlayChime();
      onClose();
    }
  };

  return (
    <div className="arcade-activities-overlay" onClick={onClose}>
      <div 
        className="arcade-activities-modal snake-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="activities-header">
          <div className="activities-title-group">
            <div className="activities-icon-badge" style={{ background: 'rgba(57, 255, 20, 0.15)', borderColor: '#39ff14' }}>
              <span style={{ fontSize: '1.2rem' }}>🐍</span>
            </div>
            <div>
              <div className="activities-main-title font-arcade">CYBER SNAKE ARCADE</div>
              <div className="activities-subtitle">Eat crypto tokens, dodge the cyber grid walls!</div>
            </div>
          </div>
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose}>
            ✕ ESC
          </button>
        </div>

        {/* Score Marquee */}
        <div className="snake-score-bar font-arcade">
          <div className="score-item">
            <span className="label">SCORE:</span>
            <span className="value current">{score}</span>
          </div>
          <div className="score-item">
            <PixelTrophy size={14} color="#ffd166" />
            <span className="label">BEST:</span>
            <span className="value high">{highScore}</span>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="snake-canvas-wrap">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="snake-canvas"
          />

          {!isPlaying && !isGameOver && (
            <div className="snake-overlay-card">
              <div className="snake-overlay-title font-arcade">CYBER SNAKE v1.0</div>
              <p className="snake-overlay-desc">
                Use Arrow Keys or WASD to navigate. Gobble glowing ETH and crypto orbs to grow!
              </p>
              <button 
                type="button" 
                className="snake-start-btn font-arcade"
                onClick={startGame}
              >
                START GAME ▶
              </button>
            </div>
          )}

          {isGameOver && (
            <div className="snake-overlay-card game-over">
              <div className="game-over-title font-arcade">SYSTEM CRASH! 💀</div>
              <div className="game-over-score font-arcade">FINAL SCORE: {score}</div>
              <div className="snake-btn-row">
                <button 
                  type="button" 
                  className="snake-start-btn font-arcade"
                  onClick={startGame}
                >
                  PLAY AGAIN 🔄
                </button>
                {score > 0 && (
                  <button 
                    type="button" 
                    className="snake-challenge-btn font-arcade"
                    onClick={handlePostChallenge}
                  >
                    POST CHALLENGE TO CHAT ⚔️
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Virtual D-Pad */}
        <div className="snake-dpad-container">
          <div className="dpad-row">
            <button
              type="button"
              className="dpad-btn up"
              onClick={() => { if (dirRef.current.y === 0) nextDirRef.current = { x: 0, y: -1 }; }}
            >
              ▲
            </button>
          </div>
          <div className="dpad-row">
            <button
              type="button"
              className="dpad-btn left"
              onClick={() => { if (dirRef.current.x === 0) nextDirRef.current = { x: -1, y: 0 }; }}
            >
              ◀
            </button>
            <div className="dpad-center">🎮</div>
            <button
              type="button"
              className="dpad-btn right"
              onClick={() => { if (dirRef.current.x === 0) nextDirRef.current = { x: 1, y: 0 }; }}
            >
              ▶
            </button>
          </div>
          <div className="dpad-row">
            <button
              type="button"
              className="dpad-btn down"
              onClick={() => { if (dirRef.current.y === 0) nextDirRef.current = { x: 0, y: 1 }; }}
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
