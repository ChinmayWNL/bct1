'use client';
import { useState, useCallback } from 'react';
import { PixelGamepad, PixelTrophy, PixelZap } from './PixelIcons';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function checkTicTacToeWinner(board) {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }
  if (board.every(cell => cell !== null && cell !== '')) {
    return { winner: 'draw', combo: null };
  }
  return null;
}

export default function TicTacToeCard({
  gameData,
  currentAddress,
  currentInboxId,
  isSent,
  onMakeMove,
  onStartRematch,
  onAddXp,
  onPlayChime
}) {
  const [submittingIdx, setSubmittingIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const board = gameData.board || Array(9).fill(null);
  const status = gameData.status || 'active'; // 'active' | 'resolved'
  const turn = gameData.turn || 'X'; // 'X' or 'O'

  // Player role detection
  const isChallengerByAddr = Boolean(
    (currentAddress && gameData.challenger && currentAddress.toLowerCase() === gameData.challenger.toLowerCase()) ||
    (currentInboxId && gameData.challengerInboxId && currentInboxId === gameData.challengerInboxId)
  );
  const isOpponentByAddr = Boolean(
    (currentAddress && gameData.opponent && currentAddress.toLowerCase() === gameData.opponent.toLowerCase()) ||
    (currentInboxId && gameData.opponentInboxId && currentInboxId === gameData.opponentInboxId)
  );

  let isChallenger = false;
  if (isChallengerByAddr) isChallenger = true;
  else if (isOpponentByAddr) isChallenger = false;
  else isChallenger = Boolean(isSent);

  const mySymbol = isChallenger ? 'X' : 'O';
  const isMyTurn = status === 'active' && turn === mySymbol;

  const evaluation = checkTicTacToeWinner(board);
  const isResolved = status === 'resolved' || Boolean(evaluation);
  const winnerSymbol = evaluation?.winner || gameData.winner;
  const winningCombo = evaluation?.combo || [];

  const isUserWinner = winnerSymbol === mySymbol;

  // Retro sound synthesizer for move placement
  const playMoveSound = (symbol) => {
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
      osc.type = symbol === 'X' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(symbol === 'X' ? 440 : 554.37, now);
      osc.frequency.exponentialRampToValueAtTime(symbol === 'X' ? 880 : 783.99, now + 0.08);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch (e) {}
  };

  // Move handler
  const handleCellClick = async (idx) => {
    if (!isMyTurn || board[idx] || isResolved || submittingIdx !== null) return;
    setSubmittingIdx(idx);
    playMoveSound(mySymbol);

    const nextBoard = [...board];
    nextBoard[idx] = mySymbol;

    const winCheck = checkTicTacToeWinner(nextBoard);
    const nextTurn = mySymbol === 'X' ? 'O' : 'X';

    try {
      if (onMakeMove) {
        await onMakeMove({
          gameId: gameData.gameId,
          board: nextBoard,
          turn: nextTurn,
          status: winCheck ? 'resolved' : 'active',
          winner: winCheck?.winner || null
        });
      }
      if (winCheck?.winner === mySymbol) {
        if (onAddXp) onAddXp(100, 'Tic-Tac-Toe Victory');
        if (onPlayChime) onPlayChime();
      } else if (winCheck?.winner === 'draw') {
        if (onAddXp) onAddXp(25, 'Tic-Tac-Toe Draw');
      }
    } finally {
      setSubmittingIdx(null);
    }
  };

  return (
    <div className={`tictactoe-card ${isResolved ? 'resolved' : 'active'}`}>
      {/* Top Header */}
      <div className="ttt-header font-arcade">
        <div className="title-badge">
          <span>❌⭕</span>
          <span>CYBER TIC-TAC-TOE</span>
        </div>
        <span className="xp-pill">
          <PixelZap size={13} color="var(--arcade-neon-cyan, #00f0ff)" />
          <span>+100 XP</span>
        </span>
      </div>

      {/* Turn / Outcome Marquee */}
      <div className="ttt-status-row font-arcade">
        {isResolved ? (
          winnerSymbol === 'draw' ? (
            <span className="outcome draw">🤝 STALEMATE DRAW (+25 XP)</span>
          ) : isUserWinner ? (
            <span className="outcome victory">
              <PixelTrophy size={14} color="#ffd166" />
              <span>VICTORY! YOU TOOK THE LINE (+100 XP)</span>
            </span>
          ) : (
            <span className="outcome defeat">💀 ROUND CONCLUDED (WINNER: {winnerSymbol})</span>
          )
        ) : isMyTurn ? (
          <span className="turn-indicator your-turn">
            ★ YOUR TURN ({mySymbol}) - TAP AN EMPTY TILE ★
          </span>
        ) : (
          <span className="turn-indicator wait">
            ⏳ WAITING FOR OPPONENT ({turn})...
          </span>
        )}
      </div>

      {/* 3x3 Grid with Ghost Preview on Hover */}
      <div className="ttt-grid">
        {board.map((cell, idx) => {
          const isWinningCell = winningCombo.includes(idx);
          const isEmpty = !cell;
          const canClick = isMyTurn && isEmpty && !isResolved;
          const isHovered = hoveredIdx === idx && canClick;

          return (
            <button
              key={idx}
              type="button"
              className={`ttt-cell ${cell || ''} ${isWinningCell ? 'win-cell' : ''} ${canClick ? 'clickable' : ''} font-arcade`}
              disabled={!canClick}
              onClick={() => handleCellClick(idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              aria-label={`Cell ${idx + 1}`}
            >
              {cell === 'X' && <span className="cell-x">✕</span>}
              {cell === 'O' && <span className="cell-o">◯</span>}
              {!cell && isHovered && (
                <span className={`cell-ghost ${mySymbol === 'X' ? 'cell-x' : 'cell-o'}`}>
                  {mySymbol === 'X' ? '✕' : '◯'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer & Rematch */}
      <div className="ttt-footer">
        <div className="players-info font-arcade">
          <span className={mySymbol === 'X' ? 'active-player' : ''}>1P: ✕ (Challenger)</span>
          <span>vs</span>
          <span className={mySymbol === 'O' ? 'active-player' : ''}>2P: ◯ (Opponent)</span>
        </div>

        {isResolved && onStartRematch && (
          <button
            type="button"
            className="ttt-rematch-btn font-arcade"
            onClick={onStartRematch}
          >
            ⚔️ PLAY REMATCH
          </button>
        )}
      </div>
    </div>
  );
}
