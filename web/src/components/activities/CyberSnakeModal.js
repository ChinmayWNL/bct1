'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { PixelGamepad, PixelTrophy, PixelZap, PixelSnake, PixelClose, PixelSkull, PixelDice, PixelSwords } from '../PixelIcons';

const GRID_SIZE = 20;
const CANVAS_SIZE = 360;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 18px

const FOOD_TYPES = [
  { id: 'eth', name: 'ETH Orb', points: 25, color: '#00f0ff' },
  { id: 'coin', name: 'Gold Coin', points: 15, color: '#ffd166' },
  { id: 'cyber', name: 'Cyber Core', points: 35, color: '#ff007f' },
  { id: 'berry', name: 'Byte Berry', points: 10, color: '#39ff14' }
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
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem('blockchat_snake_highscore');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [food, setFood] = useState({ x: 10, y: 10, type: FOOD_TYPES[0] });
  const [combo, setCombo] = useState(1);
  const lastEatTimeRef = useRef(0);

  const snakeRef = useRef([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]);
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const gameLoopRef = useRef(null);
  const particlesRef = useRef([]);
  const touchStartRef = useRef({ x: 0, y: 0 });

  // Web Audio Synth for retro sound effects with auto-resume
  const playRetroSound = useCallback((type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'eat') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(18);
        }
      } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 60, 80]);
        }
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
    particlesRef.current = [];
    setScore(0);
    setCombo(1);
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

  // Touch Swipe Gesture Navigation
  const handleTouchStart = (e) => {
    if (!e.touches || !e.touches[0]) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    if (!isPlaying || isGameOver || !e.changedTouches || !e.changedTouches[0]) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < 18) return; // Ignore small taps

    const cur = dirRef.current;
    if (absX > absY) {
      if (dx > 0 && cur.x === 0) nextDirRef.current = { x: 1, y: 0 };
      else if (dx < 0 && cur.x === 0) nextDirRef.current = { x: -1, y: 0 };
    } else {
      if (dy > 0 && cur.y === 0) nextDirRef.current = { x: 0, y: 1 };
      else if (dy < 0 && cur.y === 0) nextDirRef.current = { x: 0, y: -1 };
    }
  };

  // Dynamic game speed based on score (progressive difficulty ramp)
  const currentSpeed = Math.max(65, 120 - Math.floor(score / 50) * 10);
  const speedMultiplier = (120 / currentSpeed).toFixed(1);

  const handleGameOver = useCallback(() => {
    playRetroSound('die');
    setIsGameOver(true);
    setIsPlaying(false);
    if (score > 50 && onAddXp) {
      onAddXp(Math.min(150, Math.floor(score / 2)), 'Cyber Snake Run');
    }
  }, [playRetroSound, score, onAddXp]);

  // Canvas Renderer with glowing trail & particles
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0a0b12';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw retro grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
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

    // Draw active explosion particles
    const aliveParticles = [];
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        aliveParticles.push(p);
      }
    });
    particlesRef.current = aliveParticles;

    // Draw Food with pulsing glowing aura
    ctx.save();
    ctx.shadowColor = food.type.color;
    ctx.shadowBlur = 14;
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

    // Draw Snake with neon gradient & directional eyes
    const snake = snakeRef.current;
    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      ctx.save();
      if (isHead) {
        ctx.fillStyle = '#39ff14';
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 14;
      } else {
        const gradientRatio = idx / Math.max(1, snake.length);
        ctx.fillStyle = gradientRatio > 0.5 ? '#10b981' : '#00f0ff';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );

      // Cyber eyes on snake head facing moving direction
      if (isHead) {
        const curDir = dirRef.current;
        ctx.fillStyle = '#050505';
        let eye1X, eye1Y, eye2X, eye2Y;
        if (curDir.x === 1) { // Moving Right
          eye1X = seg.x * CELL_SIZE + CELL_SIZE - 5; eye1Y = seg.y * CELL_SIZE + 3;
          eye2X = seg.x * CELL_SIZE + CELL_SIZE - 5; eye2Y = seg.y * CELL_SIZE + CELL_SIZE - 6;
        } else if (curDir.x === -1) { // Moving Left
          eye1X = seg.x * CELL_SIZE + 2; eye1Y = seg.y * CELL_SIZE + 3;
          eye2X = seg.x * CELL_SIZE + 2; eye2Y = seg.y * CELL_SIZE + CELL_SIZE - 6;
        } else if (curDir.y === 1) { // Moving Down
          eye1X = seg.x * CELL_SIZE + 3; eye1Y = seg.y * CELL_SIZE + CELL_SIZE - 5;
          eye2X = seg.x * CELL_SIZE + CELL_SIZE - 6; eye2Y = seg.y * CELL_SIZE + CELL_SIZE - 5;
        } else { // Moving Up (default)
          eye1X = seg.x * CELL_SIZE + 3; eye1Y = seg.y * CELL_SIZE + 2;
          eye2X = seg.x * CELL_SIZE + CELL_SIZE - 6; eye2Y = seg.y * CELL_SIZE + 2;
        }
        ctx.fillRect(eye1X, eye1Y, 3, 3);
        ctx.fillRect(eye2X, eye2Y, 3, 3);
      }
      ctx.restore();
    });
  }, [food]);

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

        // Combo multiplier if eaten within 3.5s
        const now = Date.now();
        const timeDiff = now - lastEatTimeRef.current;
        let nextCombo = 1;
        if (timeDiff < 3500) {
          nextCombo = Math.min(4, combo + 1);
        }
        setCombo(nextCombo);
        lastEatTimeRef.current = now;

        const earnedPoints = food.type.points * nextCombo;

        // Spawn explosion particles
        for (let i = 0; i < 14; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 3.5 + 1;
          particlesRef.current.push({
            x: food.x * CELL_SIZE + CELL_SIZE / 2,
            y: food.y * CELL_SIZE + CELL_SIZE / 2,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            color: food.type.color,
            size: Math.random() * 3 + 2,
            life: 1.0,
            decay: Math.random() * 0.06 + 0.04
          });
        }

        setScore(prev => {
          const next = prev + earnedPoints;
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
    }, currentSpeed);

    gameLoopRef.current = interval;
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, isGameOver, food, highScore, currentSpeed, combo, playRetroSound, spawnFood, handleGameOver, drawCanvas]);

  // Initial draw
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

  const handleDpadPress = (dx, dy) => {
    if (!isPlaying && !isGameOver) {
      startGame();
    }
    const cur = dirRef.current;
    if (dx !== 0 && cur.x === 0) nextDirRef.current = { x: dx, y: 0 };
    if (dy !== 0 && cur.y === 0) nextDirRef.current = { x: 0, y: dy };
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
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
              <PixelSnake size={22} color="#39ff14" />
            </div>
            <div>
              <div className="activities-main-title font-arcade">CYBER SNAKE ARCADE</div>
              <div className="activities-subtitle">Eat crypto tokens, dodge walls • Swipe or D-Pad to steer!</div>
            </div>
          </div>
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose} aria-label="Close Snake" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <PixelClose size={12} />
            <span>ESC</span>
          </button>
        </div>

        {/* Score & Multiplier Bar */}
        <div className="snake-score-bar font-arcade">
          <div className="score-item">
            <span className="label">SCORE:</span>
            <span className="value current">{score}</span>
          </div>
          {combo > 1 && (
            <div className="score-item combo-item">
              <span className="value combo-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <PixelZap size={12} color="#00f0ff" />
                <span>{combo}x COMBO</span>
              </span>
            </div>
          )}
          <div className="score-item">
            <span className="label">SPEED:</span>
            <span className="value speed">{speedMultiplier}x</span>
          </div>
          <div className="score-item">
            <PixelTrophy size={14} color="#ffd166" />
            <span className="label">BEST:</span>
            <span className="value high">{highScore}</span>
          </div>
        </div>

        {/* Game Canvas Container with Swipe Listeners */}
        <div 
          className="snake-canvas-wrap"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="snake-canvas"
          />

          {!isPlaying && !isGameOver && (
            <div className="snake-overlay-card">
              <div className="snake-overlay-title font-arcade">CYBER SNAKE v2.0</div>
              <p className="snake-overlay-desc">
                Arrow Keys, WASD, Swipe or touch the D-Pad. Eat crypto orbs to trigger score combos and level up your speed!
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
              <div className="game-over-title font-arcade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>SYSTEM CRASH!</span>
                <PixelSkull size={20} color="#ff007f" />
              </div>
              <div className="game-over-score font-arcade">FINAL SCORE: {score}</div>
              <div className="snake-btn-row">
                <button 
                  type="button" 
                  className="snake-start-btn font-arcade"
                  onClick={startGame}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>PLAY AGAIN</span>
                  <PixelDice size={14} color="#ffd166" />
                </button>
                {score > 0 && (
                  <button 
                    type="button" 
                    className="snake-challenge-btn font-arcade"
                    onClick={handlePostChallenge}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>POST CHALLENGE TO CHAT</span>
                    <PixelSwords size={14} color="#00f0ff" />
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
              onClick={() => handleDpadPress(0, -1)}
              aria-label="Move Up"
            >
              ▲
            </button>
          </div>
          <div className="dpad-row">
            <button
              type="button"
              className="dpad-btn left"
              onClick={() => handleDpadPress(-1, 0)}
              aria-label="Move Left"
            >
              ◀
            </button>
            <div className="dpad-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PixelGamepad size={16} color="#8b9bb4" />
            </div>
            <button
              type="button"
              className="dpad-btn right"
              onClick={() => handleDpadPress(1, 0)}
              aria-label="Move Right"
            >
              ▶
            </button>
          </div>
          <div className="dpad-row">
            <button
              type="button"
              className="dpad-btn down"
              onClick={() => handleDpadPress(0, 1)}
              aria-label="Move Down"
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
