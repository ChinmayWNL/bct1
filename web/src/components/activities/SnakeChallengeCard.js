'use client';
import { PixelGamepad, PixelTrophy, PixelZap } from '../PixelIcons';

export default function SnakeChallengeCard({
  cardData,
  currentAddress,
  isSent,
  onAcceptAndPlay
}) {
  const isChallenger = Boolean(
    (currentAddress && cardData.challenger && currentAddress.toLowerCase() === cardData.challenger.toLowerCase()) ||
    isSent
  );

  const isResolved = cardData.status === 'resolved';
  const targetScore = cardData.challengerScore || 0;
  const opponentScore = cardData.opponentScore || 0;

  return (
    <div className={`snake-challenge-card ${isResolved ? 'resolved' : 'active'}`}>
      <div className="card-header font-arcade">
        <div className="header-badge">
          <span style={{ fontSize: '1rem' }}>🐍</span>
          <span>CYBER SNAKE CHALLENGE</span>
        </div>
        <span className="bounty-pill">
          <PixelZap size={13} color="var(--arcade-neon-cyan, #00f0ff)" />
          <span>+150 XP</span>
        </span>
      </div>

      <div className="challenge-body">
        <div className="target-score-box font-arcade">
          <div className="score-label">CHALLENGER SCORE TO BEAT:</div>
          <div className="score-number">{targetScore} PTS</div>
        </div>

        {isResolved ? (
          <div className="challenge-result-banner font-arcade">
            <div className="result-title">
              <PixelTrophy size={16} color="var(--arcade-gold, #ffd166)" />
              <span>
                {opponentScore > targetScore
                  ? `DEFENDER BEAT THE SCORE WITH ${opponentScore} PTS! 🏆`
                  : `CHALLENGER DEFENDED WITH ${targetScore} PTS! 🛡️`}
              </span>
            </div>
          </div>
        ) : (
          <div className="challenge-action-area">
            {isChallenger ? (
              <div className="waiting-text font-arcade">
                <span>⚔️ Challenge broadcasted! Waiting for friend to beat {targetScore} pts...</span>
              </div>
            ) : (
              <button
                type="button"
                className="accept-challenge-btn font-arcade"
                onClick={() => onAcceptAndPlay && onAcceptAndPlay(cardData.challengeId, targetScore)}
              >
                ACCEPT & PLAY SNAKE 🐍
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
