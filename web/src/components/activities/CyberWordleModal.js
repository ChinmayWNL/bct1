'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PixelTrophy, PixelZap } from '../PixelIcons';

const WORD_LIST = [
  'BLOCK', 'CHAIN', 'CRYPT', 'SMART', 'TOKEN',
  'MINER', 'VAULT', 'BYTES', 'SHARD', 'STAKE',
  'PROOF', 'MERKL', 'FORKS', 'NODES', 'GASES',
  'YIELD', 'SWAPS', 'DEGEN', 'WHALE', 'BUILD',
  'CYBER', 'PIXEL', 'ROBOT', 'LAYER', 'ORACL',
  'ALPHA', 'NONCE', 'LOGIC', 'ARRAY', 'INDEX',
  'PROXY', 'RELAY', 'SOLID', 'HASHY', 'EPOCH',
  'SATOS', 'EVMOS', 'ASSET', 'DRAWS', 'CIPHR',
  'LEDGR', 'TRUST', 'COINS', 'STATE', 'SLOTS',
  'TRADE', 'BURNR', 'PUMPS', 'DUMPS', 'FLOOR',
  'SHIBA', 'DAPPS', 'MINTY', 'SCALE', 'ZEROK',
  'STAKR', 'FARMS', 'BRIDG', 'ROOTS', 'LEAFS',
  'TREES', 'TXGAS', 'SIGNS', 'KEYS', 'PEERS',
  'GWEI', 'UNISW', 'CURVE', 'ETHER', 'BITCO'
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

export default function CyberWordleModal({
  isOpen,
  onClose,
  onShareToChat,
  onAddXp,
  onPlayChime
}) {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('in_progress'); // 'in_progress' | 'won' | 'lost'
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [stats, setStats] = useState({ played: 0, won: 0, streak: 0, maxStreak: 0 });
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('blockchat_wordle_stats');
      if (saved) setStats(JSON.parse(saved));
    } catch {}
  }, []);

  const updateStats = useCallback((won) => {
    setStats(prev => {
      const next = {
        played: prev.played + 1,
        won: prev.won + (won ? 1 : 0),
        streak: won ? prev.streak + 1 : 0,
        maxStreak: won ? Math.max(prev.maxStreak, prev.streak + 1) : prev.maxStreak
      };
      try {
        localStorage.setItem('blockchat_wordle_stats', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Start new round
  const startNewGame = useCallback(() => {
    const picked = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetWord(picked);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('in_progress');
    setErrorMessage('');
    setIsShaking(false);
  }, []);

  useEffect(() => {
    if (isOpen && !targetWord) {
      startNewGame();
    }
  }, [isOpen, targetWord, startNewGame]);

  // Evaluate letter matches: 'correct' (green), 'present' (yellow), 'absent' (gray)
  const getLetterStatuses = useCallback((guess, target) => {
    const result = Array(5).fill('absent');
    const targetArr = target.split('');
    const guessArr = guess.split('');
    const matchedIndices = new Set();

    // 1st Pass: Correct positions
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        matchedIndices.add(i);
      }
    }

    // 2nd Pass: Present but wrong position
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'correct') continue;
      const letter = guessArr[i];
      const matchIdx = targetArr.findIndex((char, idx) => char === letter && !matchedIndices.has(idx));
      if (matchIdx !== -1) {
        result[i] = 'present';
        matchedIndices.add(matchIdx);
      }
    }

    return result;
  }, []);

  // Keyboard key statuses
  const keyStatuses = useMemo(() => {
    const statuses = {};
    guesses.forEach((guess) => {
      const evaluation = getLetterStatuses(guess, targetWord);
      guess.split('').forEach((letter, i) => {
        const current = statuses[letter];
        const evaluated = evaluation[i];
        if (evaluated === 'correct') {
          statuses[letter] = 'correct';
        } else if (evaluated === 'present' && current !== 'correct') {
          statuses[letter] = 'present';
        } else if (!current) {
          statuses[letter] = 'absent';
        }
      });
    });
    return statuses;
  }, [guesses, targetWord, getLetterStatuses]);

  // Audio synthesizer effects with audio unlock
  const playWordleSound = useCallback((type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'type') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 50, 80]);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
      }
    } catch (e) {}
  }, []);

  // Handle Key Input
  const handleKey = useCallback((key) => {
    if (gameStatus !== 'in_progress') return;

    if (key === 'ENTER') {
      if (currentGuess.length < 5) {
        setErrorMessage('Needs 5 letters!');
        setIsShaking(true);
        playWordleSound('error');
        setTimeout(() => {
          setErrorMessage('');
          setIsShaking(false);
        }, 1200);
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord) {
        setGameStatus('won');
        updateStats(true);
        playWordleSound('win');
        if (onAddXp) onAddXp(120, 'Cyber Wordle Decrypted');
        if (onPlayChime) onPlayChime();
      } else if (newGuesses.length >= 6) {
        setGameStatus('lost');
        updateStats(false);
        playWordleSound('error');
        if (onAddXp) onAddXp(25, 'Wordle Run');
      } else {
        playWordleSound('type');
      }
    } else if (key === 'BACKSPACE' || key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
      playWordleSound('type');
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
      playWordleSound('type');
    }
  }, [currentGuess, gameStatus, guesses, onAddXp, onPlayChime, playWordleSound, targetWord, updateStats]);

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        handleKey('ENTER');
      } else if (key === 'BACKSPACE') {
        handleKey('BACKSPACE');
      } else if (/^[A-Z]$/.test(key)) {
        handleKey(key);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  // Build Discord-style emoji share grid
  const getShareText = () => {
    const rows = guesses.map(guess => {
      const statuses = getLetterStatuses(guess, targetWord);
      return statuses.map(s => {
        if (s === 'correct') return '🟩';
        if (s === 'present') return '🟨';
        return '⬛';
      }).join('');
    });

    return `🟩 CYBER WORDLE ${gameStatus === 'won' ? `${guesses.length}/6` : 'X/6'}\n${rows.join('\n')}\nTerm: ${gameStatus === 'won' ? 'SOLVED! 🏆' : targetWord}`;
  };

  const handleShareResult = () => {
    const shareText = getShareText();
    if (onShareToChat) {
      onShareToChat(shareText);
      onClose();
    }
  };

  const handleCopyGrid = () => {
    const shareText = getShareText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <div className="arcade-activities-overlay" onClick={onClose}>
      <div 
        className="arcade-activities-modal wordle-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="activities-header">
          <div className="activities-title-group">
            <div className="activities-icon-badge" style={{ background: 'rgba(0, 240, 255, 0.15)', borderColor: '#00f0ff' }}>
              <span style={{ fontSize: '1.2rem' }}>🟩</span>
            </div>
            <div>
              <div className="activities-main-title font-arcade">CYBER WORDLE</div>
              <div className="activities-subtitle">Decipher the 5-letter Web3 term in 6 tries</div>
            </div>
          </div>
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose} aria-label="Close Wordle">
            ✕ ESC
          </button>
        </div>

        {/* Player Mini Stats */}
        <div className="wordle-stats-bar font-arcade">
          <div className="stat-pill">
            <span className="stat-label">PLAYED</span>
            <span className="stat-num">{stats.played}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">WIN %</span>
            <span className="stat-num">{winRate}%</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">STREAK</span>
            <span className="stat-num glow-gold">{stats.streak} 🔥</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">BEST</span>
            <span className="stat-num">{stats.maxStreak}</span>
          </div>
        </div>

        {/* Status / Error Toast */}
        {errorMessage && (
          <div className="wordle-toast font-arcade">{errorMessage}</div>
        )}

        {/* 6x5 Wordle Letter Grid */}
        <div className="wordle-board">
          {Array(6).fill(null).map((_, rowIdx) => {
            const isCompletedRow = rowIdx < guesses.length;
            const isCurrentRow = rowIdx === guesses.length;
            const guess = isCompletedRow 
              ? guesses[rowIdx] 
              : isCurrentRow 
                ? currentGuess 
                : '';
            const statuses = isCompletedRow ? getLetterStatuses(guess, targetWord) : [];

            return (
              <div 
                key={rowIdx} 
                className={`wordle-row ${isCurrentRow && isShaking ? 'row-shaking' : ''}`}
              >
                {Array(5).fill(null).map((_, colIdx) => {
                  const letter = guess[colIdx] || '';
                  const status = statuses[colIdx] || '';
                  const hasLetter = Boolean(letter);

                  return (
                    <div
                      key={colIdx}
                      className={`wordle-cell ${status} ${hasLetter && isCurrentRow ? 'active' : ''} ${isCompletedRow ? 'flipped' : ''}`}
                      style={{
                        animationDelay: isCompletedRow ? `${colIdx * 120}ms` : '0ms'
                      }}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Game Completed Result Card */}
        {gameStatus !== 'in_progress' && (
          <div className="wordle-result-banner font-arcade">
            {gameStatus === 'won' ? (
              <div className="win-message">
                ★ ACCESS GRANTED! Solved in {guesses.length}/6 ★
              </div>
            ) : (
              <div className="loss-message">
                ⚠ CIPHER LOCKED! Secret word was: <strong>{targetWord}</strong>
              </div>
            )}

            <div className="wordle-action-row">
              <button 
                type="button" 
                className="wordle-share-btn font-arcade"
                onClick={handleShareResult}
              >
                SHARE TO CHAT 💬
              </button>
              <button 
                type="button" 
                className="wordle-copy-btn font-arcade"
                onClick={handleCopyGrid}
              >
                {copiedNotification ? 'COPIED! ✓' : 'COPY GRID 📋'}
              </button>
              <button 
                type="button" 
                className="wordle-replay-btn font-arcade"
                onClick={startNewGame}
              >
                NEXT CIPHER 🔄
              </button>
            </div>
          </div>
        )}

        {/* Touch-Friendly Virtual QWERTY Keyboard */}
        <div className="wordle-keyboard">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="keyboard-row">
              {row.map((key) => {
                const status = keyStatuses[key] || '';
                const isSpecial = key === 'ENTER' || key === '⌫';
                return (
                  <button
                    key={key}
                    type="button"
                    className={`key-btn ${isSpecial ? 'special' : ''} ${status} font-arcade`}
                    onClick={() => handleKey(key)}
                    aria-label={`Key ${key}`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
