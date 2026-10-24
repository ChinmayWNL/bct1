'use client';
import { tallyPoll } from '@/utils/interactions';

export default function PollCard({ pollData, votes = {}, myKey, onVote, chain, isSent, onClose }) {
  if (!pollData) return null;
  const options = pollData.options || [];
  const onChain = !!pollData.onChainPollId;

  // On-chain polls read tallies from the contract; legacy polls aggregate chat interactions.
  let counts;
  let total;
  let myVote;
  let closed = false;
  if (onChain) {
    counts = chain?.counts ?? new Array(options.length).fill(0);
    total = chain?.total ?? 0;
    myVote = chain?.myVote ?? null;
    const closesAt = chain?.closesAt ?? pollData.closesAt ?? 0;
    closed = !!chain?.closed || (closesAt > 0 && Date.now() > closesAt);
  } else {
    ({ counts, total } = tallyPoll(votes, options.length));
    myVote = votes[myKey]?.kind === 'poll_vote' ? votes[myKey].choice : null;
  }

  return (
    <div className="feature-card poll-card">
      <div className="feature-card-header">
        <span>📊</span>
        <span>{onChain ? 'ON-CHAIN POLL' : 'ARCADE POLL'}</span>
        <span className="feature-card-tag">
          {closed ? 'CLOSED · ' : ''}{total} VOTE{total === 1 ? '' : 'S'}
        </span>
      </div>
      <div className="poll-question">{pollData.question}</div>
      <div className="poll-options">
        {options.map((opt, i) => {
          const pct = total ? Math.round((counts[i] / total) * 100) : 0;
          const mine = myVote === i;
          return (
            <button
              key={i}
              type="button"
              className={`poll-option ${mine ? 'mine' : ''}`}
              disabled={closed}
              onClick={() => onVote && onVote(pollData.pollId, i)}
            >
              <span className="poll-bar" style={{ width: `${pct}%` }} />
              <span className="poll-option-label">
                <span className="poll-letter">{String.fromCharCode(65 + i)}</span>
                <span className="poll-text">{opt}</span>
                {mine && <span className="poll-check">✔</span>}
              </span>
              <span className="poll-pct">{pct}% · {counts[i]}</span>
            </button>
          );
        })}
      </div>
      <div className="feature-card-footer">
        <span>
          {closed
            ? 'VOTING CLOSED · FINAL RESULTS'
            : myVote === null
              ? 'TAP AN OPTION TO VOTE'
              : 'TAP ANOTHER TO CHANGE VOTE'}
        </span>
        {onChain && isSent && !closed && (
          <button type="button" className="gift-claim-btn font-arcade" onClick={() => onClose && onClose(pollData)}>
            CLOSE POLL
          </button>
        )}
      </div>
    </div>
  );
}
