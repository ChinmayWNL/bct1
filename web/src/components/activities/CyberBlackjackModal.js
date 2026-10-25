'use client';
import { useState, useEffect, useCallback } from 'react';
import { PixelCoin, PixelTrophy, PixelZap } from '../PixelIcons';

const SUITS = [
  { name: 'spades', symbol: '♠', color: '#00f0ff' },
  { name: 'hearts', symbol: '♥', color: '#ff007f' },
  { name: 'diamonds', symbol: '♦', color: '#ffd166' },
  { name: 'clubs', symbol: '♣', color: '#39ff14' }
];

const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Build fresh 52-card deck and shuffle
function createDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (const v of VALUES) {
      let numVal = parseInt(v, 10);
      if (v === 'J' || v === 'Q' || v === 'K') numVal = 10;
      if (v === 'A') numVal = 11;
      deck.push({ suit: s, value: v, numVal, id: `${v}-${s.symbol}-${Math.random()}` });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Calculate blackjack score (with dynamic Ace reduction)
function calculateHandScore(cards) {
  let score = 0;
  let aceCount = 0;
  for (const c of cards) {
    score += c.numVal;
    if (c.value === 'A') aceCount++;
  }
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
}

export default function CyberBlackjackModal({
  isOpen,
  onClose,
  onAddXp,
  onShareToChat,
  onPlayChime
}) {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('betting'); // 'betting' | 'playing' | 'dealer_turn' | 'resolved'
  const [bet, setBet] = useState(50);
  const [resultMessage, setResultMessage] = useState('');
  const [winner, setWinner] = useState(null); // 'player' | 'dealer' | 'push' | 'blackjack'

  // Audio synthesizer for card flips and victory
  const playCardSound = useCallback((type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'deal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  }, []);

  // Deal fresh hand
  const startDeal = useCallback(() => {
    const newDeck = createDeck();
    const p1 = newDeck.pop();
    const d1 = newDeck.pop();
    const p2 = newDeck.pop();
    const d2 = newDeck.pop();

    const pHand = [p1, p2];
    const dHand = [d1, d2];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setWinner(null);
    setResultMessage('');

    playCardSound('deal');

    const pScore = calculateHandScore(pHand);
    const dScore = calculateHandScore(dHand);

    // Natural 21 Check
    if (pScore === 21) {
      if (dScore === 21) {
        setWinner('push');
        setResultMessage('Both hold 21! Push / Stalemate 🤝');
        setGameState('resolved');
      } else {
        setWinner('blackjack');
        setResultMessage('NATURAL BLACKJACK! PAYS 3:2! 🏆');
        setGameState('resolved');
        playCardSound('win');
        if (onAddXp) onAddXp(bet * 2, 'Cyber Blackjack Natural');
        if (onPlayChime) onPlayChime();
      }
    }
  }, [bet, onAddXp, onPlayChime, playCardSound]);

  // Player Hits
  const handleHit = () => {
    if (gameState !== 'playing') return;
    const currentDeck = [...deck];
    if (currentDeck.length === 0) return;
    const card = currentDeck.pop();
    const newHand = [...playerHand, card];
    setDeck(currentDeck);
    setPlayerHand(newHand);
    playCardSound('deal');

    const score = calculateHandScore(newHand);
    if (score > 21) {
      setWinner('dealer');
      setResultMessage(`Bust (${score})! Dealer takes the round 💀`);
      setGameState('resolved');
    }
  };

  // Player Stands -> Dealer plays
  const handleStand = () => {
    if (gameState !== 'playing') return;
    setGameState('dealer_turn');

    let currentDeck = [...deck];
    let dHand = [...dealerHand];
    let dScore = calculateHandScore(dHand);

    // Dealer hits until >= 17
    while (dScore < 17 && currentDeck.length > 0) {
      const card = currentDeck.pop();
      dHand.push(card);
      dScore = calculateHandScore(dHand);
    }

    setDeck(currentDeck);
    setDealerHand(dHand);

    const pScore = calculateHandScore(playerHand);

    if (dScore > 21) {
      setWinner('player');
      setResultMessage(`Dealer busts (${dScore})! YOU WIN! +${bet} XP 🏆`);
      playCardSound('win');
      if (onAddXp) onAddXp(bet, 'Blackjack Win');
      if (onPlayChime) onPlayChime();
    } else if (pScore > dScore) {
      setWinner('player');
      setResultMessage(`High Hand! ${pScore} beats ${dScore}! YOU WIN! +${bet} XP 🏆`);
      playCardSound('win');
      if (onAddXp) onAddXp(bet, 'Blackjack Win');
      if (onPlayChime) onPlayChime();
    } else if (dScore > pScore) {
      setWinner('dealer');
      setResultMessage(`Dealer wins with ${dScore} vs your ${pScore} 💀`);
    } else {
      setWinner('push');
      setResultMessage(`Tied at ${pScore}! Stand-off push 🤝`);
    }

    setGameState('resolved');
  };

  if (!isOpen) return null;

  const playerScore = calculateHandScore(playerHand);
  const dealerScore = gameState === 'playing'
    ? (dealerHand.length > 0 ? dealerHand[0].numVal : 0)
    : calculateHandScore(dealerHand);

  const handleShareToChat = () => {
    if (onShareToChat) {
      const text = `🃏 CYBER 21 RESULT: ${winner === 'player' || winner === 'blackjack' ? 'VICTORY 🏆' : 'ROUND PLAYED'}\nPlayer: ${playerScore} pts | Dealer: ${calculateHandScore(dealerHand)} pts\n${resultMessage}`;
      onShareToChat(text);
      onClose();
    }
  };

  return (
    <div className="arcade-activities-overlay" onClick={onClose}>
      <div 
        className="arcade-activities-modal blackjack-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="activities-header">
          <div className="activities-title-group">
            <div className="activities-icon-badge" style={{ background: 'rgba(255, 209, 102, 0.15)', borderColor: '#ffd166' }}>
              <span style={{ fontSize: '1.2rem' }}>🃏</span>
            </div>
            <div>
              <div className="activities-main-title font-arcade">CYBER 21 (BLACKJACK)</div>
              <div className="activities-subtitle">Reach 21 without busting. Beat the dealer to stack XP!</div>
            </div>
          </div>
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose}>
            ✕ ESC
          </button>
        </div>

        {/* Blackjack Table Arena */}
        <div className="blackjack-table">
          {/* Dealer Area */}
          <div className="table-area dealer">
            <div className="area-title-bar font-arcade">
              <span>DEALER HAND {gameState !== 'betting' && `(${gameState === 'playing' ? `${dealerScore} + ?` : dealerScore})`}</span>
            </div>
            <div className="cards-row">
              {dealerHand.map((card, idx) => {
                const isHidden = gameState === 'playing' && idx === 1;
                return (
                  <div key={card.id || idx} className={`blackjack-card ${isHidden ? 'hidden' : ''}`}>
                    {isHidden ? (
                      <div className="card-back font-arcade">🤖 21</div>
                    ) : (
                      <div className="card-face" style={{ color: card.suit.color }}>
                        <div className="card-corner top font-arcade">{card.value}</div>
                        <div className="card-suit">{card.suit.symbol}</div>
                        <div className="card-corner bottom font-arcade">{card.value}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {dealerHand.length === 0 && (
                <div className="empty-hand-placeholder font-arcade">AWAITING DEAL...</div>
              )}
            </div>
          </div>

          {/* Outcome Banner */}
          {resultMessage && (
            <div className={`blackjack-outcome font-arcade ${winner || ''}`}>
              {resultMessage}
            </div>
          )}

          {/* Player Area */}
          <div className="table-area player">
            <div className="area-title-bar font-arcade">
              <span>YOUR HAND {gameState !== 'betting' && `(${playerScore})`}</span>
              <span className="bet-indicator">WAGER: {bet} XP</span>
            </div>
            <div className="cards-row">
              {playerHand.map((card, idx) => (
                <div key={card.id || idx} className="blackjack-card">
                  <div className="card-face" style={{ color: card.suit.color }}>
                    <div className="card-corner top font-arcade">{card.value}</div>
                    <div className="card-suit">{card.suit.symbol}</div>
                    <div className="card-corner bottom font-arcade">{card.value}</div>
                  </div>
                </div>
              ))}
              {playerHand.length === 0 && (
                <div className="empty-hand-placeholder font-arcade">SELECT WAGER & DEAL</div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="blackjack-controls">
          {gameState === 'betting' || gameState === 'resolved' ? (
            <div className="betting-controls">
              <div className="chip-picker font-arcade">
                <span>CHIPS:</span>
                {[25, 50, 100, 250].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`chip-btn ${bet === amount ? 'active' : ''}`}
                    onClick={() => setBet(amount)}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <div className="action-buttons-row">
                <button
                  type="button"
                  className="deal-btn font-arcade"
                  onClick={startDeal}
                >
                  DEAL HAND ▶
                </button>
                {gameState === 'resolved' && (
                  <button
                    type="button"
                    className="share-btn font-arcade"
                    onClick={handleShareToChat}
                  >
                    BRAG IN CHAT 💬
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="play-controls-row">
              <button
                type="button"
                className="action-btn hit font-arcade"
                disabled={gameState !== 'playing'}
                onClick={handleHit}
              >
                HIT 🃏
              </button>
              <button
                type="button"
                className="action-btn stand font-arcade"
                disabled={gameState !== 'playing'}
                onClick={handleStand}
              >
                STAND ✋
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
