'use client';
import { useState } from 'react';
import { PixelTrophy } from '../PixelIcons';

export default function SketchGuessCard({
  cardData,
  currentAddress,
  isSent,
  onSolve,
  onAddXp,
  onPlayFanfare
}) {
  const [guessInput, setGuessInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  const pixels = cardData.pixels || [];
  const secretWord = (cardData.secretWord || '').toUpperCase().trim();
  const hint = cardData.hint || `${secretWord.length} Letters`;
  const isSolved = Boolean(cardData.solved);
  const isCreator = Boolean(
    (currentAddress && cardData.creator && currentAddress.toLowerCase() === cardData.creator.toLowerCase()) ||
    isSent
  );

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (isSolved || !guessInput.trim()) return;

    const normalizedGuess = guessInput.toUpperCase().trim();
    if (normalizedGuess === secretWord) {
      setFeedback('🎉 CORRECT! WORD SOLVED!');
      setIsWrong(false);
      if (onSolve) {
        onSolve(cardData.sketchId, currentAddress || 'You');
      }
      if (onAddXp) {
        onAddXp(100, 'Pixel Sketch Solved');
      }
      if (onPlayFanfare) {
        onPlayFanfare();
      }
    } else {
      setIsWrong(true);
      setFeedback('❌ WRONG GUESS! TRY AGAIN');
      setTimeout(() => {
        setIsWrong(false);
        setFeedback('');
      }, 1500);
    }
    setGuessInput('');
  };

  return (
    <div className={`sketch-guess-card ${isSolved ? 'solved' : 'active'}`}>
      {/* Top Bar */}
      <div className="sketch-card-header font-arcade">
        <span className="badge">🎨 PIXEL PICTIONARY</span>
        <span className="hint-pill">HINT: {hint}</span>
      </div>

      {/* 16x16 Pixel Drawing Display */}
      <div className="sketch-display-frame">
        <div className="pixel-canvas-display">
          {pixels.map((color, idx) => (
            <div
              key={idx}
              className="display-cell"
              style={{ backgroundColor: color || '#0a0b12' }}
            />
          ))}
        </div>
      </div>

      {/* Solved Banner or Guess Form */}
      {isSolved ? (
        <div className="sketch-solved-banner font-arcade">
          <div className="solved-title">
            <PixelTrophy size={16} color="var(--arcade-gold, #ffd166)" />
            <span>SOLVED! THE WORD WAS: <strong>{secretWord}</strong></span>
          </div>
          <div className="solved-subtitle">
            Guessed by: {cardData.solvedBy ? cardData.solvedBy.slice(0, 8) : 'A Peer'} (+100 XP)
          </div>
        </div>
      ) : (
        <div className="sketch-guess-area">
          {isCreator ? (
            <div className="creator-notice font-arcade">
              <span>🔒 You drew this masterpiece! Secret word: <strong>{secretWord}</strong></span>
              <div style={{ fontSize: '0.65rem', color: 'var(--coffee-text-dim)', marginTop: '4px' }}>
                Waiting for someone in chat to guess it...
              </div>
            </div>
          ) : (
            <form onSubmit={handleGuessSubmit} className="guess-input-row">
              <input
                type="text"
                className={`guess-input font-arcade ${isWrong ? 'error-shake' : ''}`}
                placeholder="Type your guess..."
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                maxLength={20}
              />
              <button type="submit" className="guess-btn font-arcade">
                GUESS ▶
              </button>
            </form>
          )}

          {feedback && (
            <div className={`guess-feedback font-arcade ${isWrong ? 'error' : 'success'}`}>
              {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
