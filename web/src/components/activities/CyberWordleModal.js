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
  'PROXY', 'RELAY', 'SOLID', 'HASHY', 'EPOCH'
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

  // Start new round
  const startNewGame = useCallback(() => {
    const picked = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setTargetWord(picked);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('in_progress');
    setErrorMessage('');
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

  // Audio effects
  const playWordleSound = useCallback((type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
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
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {}
  }, []);

  // Handle Key Input
  const handleKey = useCallback((key) => {
    if (gameStatus !== 'in_progress') return;

    if (key === 'ENTER') {
      if (currentGuess.length < 5) {
        setErrorMessage('Must be 5 letters!');
        playWordleSound('error');
        setTimeout(() => setErrorMessage(''), 1500);
        return;
      }

      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord) {
        setGameStatus('won');
        playWordleSound('win');
        if (onAddXp) onAddXp(100, 'Cyber Wordle Solved');
        if (onPlayChime) onPlayChime();
      } else if (newGuesses.length >= 6) {
        setGameStatus('lost');
        playWordleSound('error');
        if (onAddXp) onAddXp(25, 'Wordle Attempt');
      }
    } else if (key === 'BACKSPACE' || key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
      playWordleSound('type');
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
      playWordleSound('type');
    }
  }, [currentGuess, gameStatus, guesses, onAddXp, onPlayChime, playWordleSound, targetWord]);

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
  const handleShareResult = () => {
    const rows = guesses.map(guess => {
      const statuses = getLetterStatuses(guess, targetWord);
      return statuses.map(s => {
        if (s === 'correct') return '🟩';
        if (s === 'present') return '🟨';
        return '⬛';
      }).join('');
    });

    const shareText = `🟩 CYBER WORDLE ${gameStatus === 'won' ? `${guesses.length}/6` : 'X/6'}\n${rows.join('\n')}\nSecret: ${gameStatus === 'won' ? 'SOLVED! 🏆' : targetWord}`;
    
    if (onShareToChat) {
      onShareToChat(shareText);
      onClose();
    }
  };

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
              <div className="activities-subtitle">Decipher the 5-letter Web3 cryptographic term in 6 tries</div>
            </div>
          </div>
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose}>
            ✕ ESC
          </button>
        </div>

        {/* Status / Error Toast */}
        {errorMessage && (
          <div className="wordle-toast font-arcade">{errorMessage}</div>
        )}

        {/* Wordle 6x5 Grid */}
        <div className="wordle-board">
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const guess = guesses[rowIndex] || (isCurrentRow ? currentGuess : '');
            const evaluation = guesses[rowIndex] ? getLetterStatuses(guesses[rowIndex], targetWord) : [];

            return (
              <div key={rowIndex} className="wordle-row">
                {Array.from({ length: 5 }).map((_, colIndex) => {
                  const letter = guess[colIndex] || '';
                  const status = evaluation[colIndex] || (letter ? 'active' : 'empty');
                  return (
                    <div 
                      key={colIndex} 
                      className={`wordle-cell ${status} font-arcade`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Win / Loss Banner */}
        {gameStatus !== 'in_progress' && (
          <div className="wordle-result-banner font-arcade">
            {gameStatus === 'won' ? (
              <div className="win-message">
                <span>🎉 DECRYPTED IN {guesses.length}/6 TRIES! (+100 XP)</span>
              </div>
            ) : (
              <div className="loss-message">
                <span>💀 OUT OF ATTEMPTS! THE WORD WAS: <strong>{targetWord}</strong></span>
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
                className="wordle-replay-btn font-arcade"
                onClick={startNewGame}
              >
                NEXT WORD 🔄
              </button>
            </div>
          </div>
        )}

        {/* Virtual Keyboard */}
        <div className="wordle-keyboard">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="keyboard-row">
              {row.map((k) => {
                const status = keyStatuses[k] || '';
                const isSpecial = k === 'ENTER' || k === '⌫';
                return (
                  <button
                    key={k}
                    type="button"
                    className={`key-btn ${status} ${isSpecial ? 'special' : ''} font-arcade`}
                    onClick={() => handleKey(k)}
                  >
                    {k}
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
