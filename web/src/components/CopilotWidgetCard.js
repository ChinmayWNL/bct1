'use client';
import { useState } from 'react';
import { PixelCoin, PixelDice, PixelZap, PixelAlien, PixelTerminal } from './PixelIcons';

export default function CopilotWidgetCard({
  widgetData,
  onAddXp,
  onPlayChime
}) {
  const [triviaSelected, setTriviaSelected] = useState(null);
  const [triviaAnswered, setTriviaAnswered] = useState(false);

  if (!widgetData) return null;

  // 1. Coin Toss Widget
  if (widgetData.widgetType === 'flip') {
    return (
      <div className="copilot-widget-card flip-card">
        <div className="widget-header">
          <PixelCoin size={15} color="var(--arcade-gold)" />
          <span>PROVABLY FAIR COIN TOSS</span>
        </div>
        <div className="flip-center-display">
          <div className="flip-coin-large">
            {widgetData.result === 'HEADS' ? '🪙' : '⚡'}
          </div>
          <div className="flip-result-tag font-arcade">
            {widgetData.result}
          </div>
        </div>
        <div className="widget-footer-meta">
          <span>ENTROPY: {widgetData.entropy ? `${widgetData.entropy.substring(0, 14)}...` : '0xentropy'}</span>
          <span>1P RANDOMNESS</span>
        </div>
      </div>
    );
  }

  // 2. Dice Roll Widget
  if (widgetData.widgetType === 'roll') {
    return (
      <div className="copilot-widget-card roll-card">
        <div className="widget-header">
          <PixelDice size={15} color="var(--arcade-neon-magenta)" />
          <span>8-BIT DICE ROLL (D{widgetData.sides})</span>
        </div>
        <div className="roll-center-display">
          <div className="roll-number font-arcade">
            {widgetData.result}
          </div>
          {widgetData.isCrit && (
            <div className="roll-badge crit font-arcade">★ NATURAL 20 CRITICAL! ★</div>
          )}
          {widgetData.isFumble && (
            <div className="roll-badge fumble font-arcade">💀 CRITICAL FUMBLE (1) 💀</div>
          )}
        </div>
        <div className="widget-footer-meta">
          <span>RANGE: 1 - {widgetData.sides}</span>
          <span>TABLETOP MODE</span>
        </div>
      </div>
    );
  }

  // 3. Live Gas Matrix Widget
  if (widgetData.widgetType === 'gas') {
    return (
      <div className="copilot-widget-card gas-card">
        <div className="widget-header">
          <span>⛽</span>
          <span>MULTI-CHAIN GAS TRACKER</span>
        </div>
        <div className="gas-matrix-grid">
          {(widgetData.networks || []).map((net, i) => (
            <div key={i} className="gas-net-item">
              <div className="gas-net-name">{net.name}</div>
              <div className="gas-net-value font-arcade">
                {net.fastGwei} <span style={{ fontSize: '0.65rem' }}>Gwei</span>
              </div>
              <div className="gas-net-speed">{net.speed}</div>
            </div>
          ))}
        </div>
        <div className="widget-footer-meta">
          <span>LIVE ESTIMATES</span>
          <span>EIP-1559 REAL-TIME</span>
        </div>
      </div>
    );
  }

  // 4. Crypto Price Ticker Widget
  if (widgetData.widgetType === 'price') {
    const isPositive = (widgetData.change24h || 0) >= 0;
    return (
      <div className="copilot-widget-card price-card">
        <div className="widget-header">
          <span>📈</span>
          <span>{widgetData.symbol} / USD REAL-TIME TICKER</span>
        </div>
        <div className="price-display-row">
          <div className="price-value font-arcade">
            ${Number(widgetData.priceUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`price-delta-badge font-arcade ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? '▲ +' : '▼ '}
            {Number(widgetData.change24h || 0).toFixed(2)}%
          </div>
        </div>
        <div className="widget-footer-meta">
          <span>UPDATED: {widgetData.timestamp ? new Date(widgetData.timestamp).toLocaleTimeString() : 'RECENT'}</span>
          <span>COINGECKO FEED</span>
        </div>
      </div>
    );
  }

  // 5. Interactive Crypto & Arcade Trivia Widget
  if (widgetData.widgetType === 'trivia') {
    const handleOptionClick = (idx) => {
      if (triviaAnswered) return;
      setTriviaSelected(idx);
      setTriviaAnswered(true);

      if (idx === widgetData.answerIndex) {
        if (onAddXp) onAddXp(50, 'Trivia Victory');
        if (onPlayChime) onPlayChime();
      }
    };

    const isCorrectChoice = triviaSelected === widgetData.answerIndex;

    return (
      <div className="copilot-widget-card trivia-card">
        <div className="widget-header">
          <PixelAlien size={16} color="var(--arcade-neon-green)" />
          <span>CYPHER TRIVIA CHALLENGE (+50 XP)</span>
        </div>

        <div className="trivia-question-text">
          {widgetData.question}
        </div>

        <div className="trivia-options-grid">
          {(widgetData.options || []).map((opt, idx) => {
            let stateClass = '';
            if (triviaAnswered) {
              if (idx === widgetData.answerIndex) stateClass = 'correct';
              else if (idx === triviaSelected) stateClass = 'wrong';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`trivia-option-btn ${stateClass} ${triviaSelected === idx ? 'selected' : ''}`}
                disabled={triviaAnswered}
                onClick={() => handleOptionClick(idx)}
              >
                <span className="opt-letter font-arcade">{String.fromCharCode(65 + idx)}</span>
                <span className="opt-text">{opt}</span>
              </button>
            );
          })}
        </div>

        {triviaAnswered && (
          <div className={`trivia-feedback-banner ${isCorrectChoice ? 'correct' : 'wrong'}`}>
            {isCorrectChoice ? (
              <>
                <PixelZap size={14} color="var(--arcade-gold)" />
                <span>★ CORRECT ANSWER! +50 ARCADE XP AWARDED! ★</span>
              </>
            ) : (
              <>
                <span>💀 INCORRECT!</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                  Correct: {widgetData.options[widgetData.answerIndex]} ({widgetData.hint})
                </span>
              </>
            )}
          </div>
        )}

        <div className="widget-footer-meta">
          <span>QID: {widgetData.id}</span>
          <span>{triviaAnswered ? 'ANSWERED' : 'TAP TO GUESS'}</span>
        </div>
      </div>
    );
  }

  return null;
}
