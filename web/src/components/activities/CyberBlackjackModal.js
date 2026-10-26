'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { PixelCoin, PixelTrophy, PixelZap, PixelCards, PixelRobot, PixelClose, PixelHandshake, PixelSkull, PixelStar, PixelPaper, PixelMessage, PixelSpade, PixelHeartSuit, PixelDiamondSuit, PixelClub } from '../PixelIcons';

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
  const [activeWager, setActiveWager] = useState(50);
  const [resultMessage, setResultMessage] = useState('');
  const [winner, setWinner] = useState(null); // 'player' | 'dealer' | 'push' | 'blackjack' | 'charlie'
  const [isDealingDealer, setIsDealingDealer] = useState(false);

  // Audio synthesizer for card flips and victory
  const playCardSound = useCallback((type) => {
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
      if (type === 'deal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
      } else if (type === 'chip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(720, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 40, 70]);
      } else if (type === 'bust') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
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
    setActiveWager(bet);
    setGameState('playing');
    setWinner(null);
    setResultMessage('');
    setIsDealingDealer(false);

    playCardSound('deal');

    const pScore = calculateHandScore(pHand);
    const dScore = calculateHandScore(dHand);

    // Natural 21 Check
    if (pScore === 21) {
      if (dScore === 21) {
        setWinner('push');
        setResultMessage('Both hold Natural 21! Stand-off Push');
        setGameState('resolved');
      } else {
        setWinner('blackjack');
        setResultMessage('NATURAL BLACKJACK! PAYS 3:2!');
        setGameState('resolved');
        playCardSound('win');
        if (onAddXp) onAddXp(Math.round(bet * 2.5), 'Cyber Blackjack Natural');
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
      setResultMessage(`Bust (${score})! Dealer claims the pot`);
      setGameState('resolved');
      playCardSound('bust');
    } else if (newHand.length === 5 && score <= 21) {
      // 5-Card Charlie bonus
      setWinner('charlie');
      setResultMessage('5-CARD CHARLIE! Instant Victory!');
      setGameState('resolved');
      playCardSound('win');
      if (onAddXp) onAddXp(activeWager * 2, '5-Card Charlie');
      if (onPlayChime) onPlayChime();
    }
  };

  // Double Down: Double bet, take exactly 1 card, then stand
  const handleDoubleDown = () => {
    if (gameState !== 'playing' || playerHand.length !== 2) return;
    const currentDeck = [...deck];
    if (currentDeck.length === 0) return;
    const card = currentDeck.pop();
    const newHand = [...playerHand, card];
    const newWager = activeWager * 2;
    setActiveWager(newWager);
    setDeck(currentDeck);
    setPlayerHand(newHand);
    playCardSound('deal');

    const score = calculateHandScore(newHand);
    if (score > 21) {
      setWinner('dealer');
      setResultMessage(`Bust on Double Down (${score})! Dealer wins`);
      setGameState('resolved');
      playCardSound('bust');
    } else {
      // Proceed to dealer resolution with new hand
      resolveDealerTurn(newHand, currentDeck, newWager);
    }
  };

  // Suspenseful dealer step-by-step turn
  const resolveDealerTurn = (finalPlayerHand, remainingDeck, currentWager) => {
    setGameState('dealer_turn');
    setIsDealingDealer(true);

    let curDeck = [...remainingDeck];
    let dHand = [...dealerHand];

    const playDealerStep = () => {
      let dScore = calculateHandScore(dHand);
      if (dScore < 17 && curDeck.length > 0) {
        const nextCard = curDeck.pop();
        dHand.push(nextCard);
        setDealerHand([...dHand]);
        setDeck([...curDeck]);
        playCardSound('deal');
        setTimeout(playDealerStep, 500);
      } else {
        // Final evaluation
        setIsDealingDealer(false);
        const pScore = calculateHandScore(finalPlayerHand);
        const finalDealerScore = calculateHandScore(dHand);

        if (finalDealerScore > 21) {
          setWinner('player');
          setResultMessage(`Dealer busts (${finalDealerScore})! YOU WIN! +${currentWager} XP`);
          playCardSound('win');
          if (onAddXp) onAddXp(currentWager, 'Blackjack Win');
          if (onPlayChime) onPlayChime();
        } else if (pScore > finalDealerScore) {
          setWinner('player');
          setResultMessage(`Victory! Your ${pScore} beats Dealer's ${finalDealerScore}! +${currentWager} XP`);
          playCardSound('win');
          if (onAddXp) onAddXp(currentWager, 'Blackjack Win');
          if (onPlayChime) onPlayChime();
        } else if (finalDealerScore > pScore) {
          setWinner('dealer');
          setResultMessage(`Dealer wins with ${finalDealerScore} vs your ${pScore}`);
          playCardSound('bust');
        } else {
          setWinner('push');
          setResultMessage(`Tied at ${pScore}! Stand-off Push`);
        }
        setGameState('resolved');
      }
    };

    setTimeout(playDealerStep, 400);
  };

  const handleStand = () => {
    if (gameState !== 'playing') return;
    resolveDealerTurn(playerHand, deck, activeWager);
  };

  if (!isOpen) return null;

  const playerScore = calculateHandScore(playerHand);
  const dealerScore = gameState === 'playing'
    ? (dealerHand.length > 0 ? dealerHand[0].numVal : 0)
    : calculateHandScore(dealerHand);

  const handleShareToChat = () => {
    if (onShareToChat) {
      const text = `CYBER 21 RESULT: ${winner === 'player' || winner === 'blackjack' || winner === 'charlie' ? 'VICTORY' : 'ROUND PLAYED'}\nPlayer: ${playerScore} pts | Dealer: ${calculateHandScore(dealerHand)} pts | Wager: ${activeWager} XP\n${resultMessage}`;
      onShareToChat(text);
      onClose();
    }
  };

  const handleAddChip = (amount) => {
    playCardSound('chip');
    setBet(prev => Math.min(1000, prev + amount));
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
              <PixelCards size={22} color="#ffd166" />
            </div>
            <div>
              <div className="activities-main-title font-arcade">CYBER 21 (BLACKJACK)</div>
              <div className="activities-subtitle">Hit, Stand or Double Down • Beat BlockBot AI to stack chips!</div>
            </div>
          </div>
          <button type="button" className="activities-close-btn font-arcade" onClick={onClose} aria-label="Close Cyber 21" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <PixelClose size={12} />
            <span>ESC</span>
          </button>
        </div>

        {/* Blackjack Felt Table Arena */}
        <div className="blackjack-table">
          {/* Dealer Area */}
          <div className="table-area dealer">
            <div className="area-title-bar font-arcade">
              <span>DEALER (BLOCKBOT AI) {gameState !== 'betting' && `(${gameState === 'playing' ? `${dealerScore} + ?` : dealerScore})`}</span>
              {isDealingDealer && <span className="dealer-thinking-tag glow-cyan font-arcade">DEALING...</span>}
            </div>
            <div className="cards-row">
              {dealerHand.map((card, idx) => {
                const isHidden = gameState === 'playing' && idx === 1;
                return (
                  <div key={card.id || idx} className={`blackjack-card ${isHidden ? 'hidden' : 'dealt'}`}>
                    {isHidden ? (
                      <div className="card-back font-arcade">
                        <span className="back-emblem" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PixelRobot size={22} color="#00f0ff" />
                        </span>
                        <span className="back-text">CYBER 21</span>
                      </div>
                    ) : (
                      <div className="card-face" style={{ color: card.suit.color }}>
                        <div className="card-corner top font-arcade">{card.value}</div>
                        <div className="card-suit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {card.suit.name === 'spades' && <PixelSpade size={22} color={card.suit.color} />}
                          {card.suit.name === 'hearts' && <PixelHeartSuit size={22} color={card.suit.color} />}
                          {card.suit.name === 'diamonds' && <PixelDiamondSuit size={22} color={card.suit.color} />}
                          {card.suit.name === 'clubs' && <PixelClub size={22} color={card.suit.color} />}
                        </div>
                        <div className="card-corner bottom font-arcade">{card.value}</div>
                      </div>
                    )}
                  </div>
                );
              })}
              {dealerHand.length === 0 && (
                <div className="empty-hand-placeholder font-arcade">PLACE CHIPS & DEAL HAND</div>
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
              <span className="bet-indicator">POT: {activeWager} XP</span>
            </div>
            <div className="cards-row">
              {playerHand.map((card, idx) => (
                <div key={card.id || idx} className="blackjack-card dealt">
                  <div className="card-face" style={{ color: card.suit.color }}>
                    <div className="card-corner top font-arcade">{card.value}</div>
                    <div className="card-suit" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {card.suit.name === 'spades' && <PixelSpade size={22} color={card.suit.color} />}
                      {card.suit.name === 'hearts' && <PixelHeartSuit size={22} color={card.suit.color} />}
                      {card.suit.name === 'diamonds' && <PixelDiamondSuit size={22} color={card.suit.color} />}
                      {card.suit.name === 'clubs' && <PixelClub size={22} color={card.suit.color} />}
                    </div>
                    <div className="card-corner bottom font-arcade">{card.value}</div>
                  </div>
                </div>
              ))}
              {playerHand.length === 0 && (
                <div className="empty-hand-placeholder font-arcade">CHOOSE BET TO ENTER FELT</div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="blackjack-controls">
          {gameState === 'betting' || gameState === 'resolved' ? (
            <div className="betting-controls">
              <div className="chip-picker font-arcade">
                <span className="chip-label">WAGER:</span>
                <div className="chip-buttons-wrap">
                  {[25, 50, 100, 250].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`chip-btn ${bet === amount ? 'active' : ''}`}
                      onClick={() => {
                        playCardSound('chip');
                        setBet(amount);
                      }}
                    >
                      {amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="chip-btn chip-add"
                    onClick={() => handleAddChip(50)}
                    title="Add +50 to Bet"
                  >
                    +50
                  </button>
                </div>
              </div>
              <div className="action-buttons-row">
                <button
                  type="button"
                  className="deal-btn font-arcade"
                  onClick={startDeal}
                >
                  DEAL HAND ({bet} XP) ▶
                </button>
                {gameState === 'resolved' && (
                  <button
                    type="button"
                    className="share-btn font-arcade"
                    onClick={handleShareToChat}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <PixelMessage size={14} color="#ffd166" />
                    <span>BRAG IN CHAT</span>
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PixelCards size={14} color="#00f0ff" />
                <span>HIT</span>
              </button>
              <button
                type="button"
                className="action-btn stand font-arcade"
                disabled={gameState !== 'playing'}
                onClick={handleStand}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PixelPaper size={14} color="#ffd166" />
                <span>STAND</span>
              </button>
              {playerHand.length === 2 && (
                <button
                  type="button"
                  className="action-btn double font-arcade"
                  disabled={gameState !== 'playing'}
                  onClick={handleDoubleDown}
                  title="Double Wager, Get 1 Card, and Stand"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PixelZap size={14} color="#ff007f" />
                  <span>DOUBLE 2x</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
