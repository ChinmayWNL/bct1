'use client';
import { PixelGamepad, PixelTrophy, PixelZap, PixelSnake, PixelShield, PixelSwords } from '../PixelIcons';

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
        <div className="header-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <PixelSnake size={16} color="#39ff14" />
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
            <div className="result-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {opponentScore > targetScore ? (
                <>
                  <PixelTrophy size={16} color="var(--arcade-gold, #ffd166)" />
                  <span>DEFENDER BEAT THE SCORE WITH {opponentScore} PTS!</span>
                </>
              ) : (
                <>
                  <PixelShield size={16} color="var(--arcade-neon-cyan, #00f0ff)" />
                  <span>CHALLENGER DEFENDED WITH {targetScore} PTS!</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="challenge-action-area">
            {isChallenger ? (
              <div className="waiting-text font-arcade" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PixelSwords size={14} color="#ffd166" />
                <span>Challenge broadcasted! Waiting for friend to beat {targetScore} pts...</span>
              </div>
            ) : (
              <button
                type="button"
                className="accept-challenge-btn font-arcade"
                onClick={() => onAcceptAndPlay && onAcceptAndPlay(cardData.challengeId, targetScore)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>ACCEPT & PLAY SNAKE</span>
                <PixelSnake size={16} color="#39ff14" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
