'use client';
import { giftClaimList } from '@/utils/interactions';
import { PixelRedPacket, PixelStar } from './PixelIcons';

const shortAddr = (a) => `${String(a).slice(0, 6)}…${String(a).slice(-4)}`;

// ETH packet backed by the GiftPacketVault contract. State comes from `chain` (read from the contract).
function OnChainGiftCard({ giftData, isSent, onClaim, chain, onRefund }) {
  const slots = chain?.slots ?? giftData.slots ?? 1;
  const claimedCount = chain?.claimedCount ?? 0;
  const claims = chain?.claims ?? [];
  const expiresAt = chain?.expiresAt ?? giftData.expiresAt ?? 0;
  const refunded = !!chain?.refunded;
  const empty = claimedCount >= slots;
  const expired = refunded || (expiresAt > 0 && Date.now() > expiresAt);
  const remaining = Number(chain?.remaining ?? 0);

  let action;
  if (chain?.mine) {
    action = (
      <div className="gift-result" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <PixelStar size={12} color="#ffd166" />
        <span>YOU WON +{chain.mine} ETH</span>
        <PixelStar size={12} color="#ffd166" />
      </div>
    );
  } else if (isSent) {
    if (expired && !refunded && !empty && remaining > 0) {
      action = (
        <button type="button" className="gift-claim-btn font-arcade" onClick={() => onRefund && onRefund(giftData)}>
          RECLAIM {chain.remaining} ETH
        </button>
      );
    } else if (refunded) {
      action = <div className="gift-result muted">UNCLAIMED ETH REFUNDED</div>;
    } else {
      action = <div className="gift-result muted">YOUR PACKET IS OPEN FOR CLAIMS</div>;
    }
  } else if (empty) {
    action = <div className="gift-result muted">ALL SLOTS CLAIMED</div>;
  } else if (expired) {
    action = <div className="gift-result muted">PACKET EXPIRED</div>;
  } else {
    action = (
      <button type="button" className="gift-claim-btn font-arcade" onClick={() => onClaim && onClaim(giftData)}>
        OPEN PACKET
      </button>
    );
  }

  return (
    <div className={`feature-card gift-card ${empty || expired ? 'empty' : ''}`}>
      <div className="feature-card-header">
        <PixelRedPacket size={18} color="#ff3366" />
        <span>ETH GIFT PACKET</span>
        <span className="feature-card-tag">{claimedCount}/{slots} CLAIMED</span>
      </div>
      <div className="gift-total font-arcade">{giftData.totalEth} ETH</div>
      <div className="gift-message">{giftData.message || 'Good luck, player!'}</div>

      {action}

      {claims.length > 0 && (
        <div className="gift-claims">
          {claims.map(c => (
            <div key={c.claimer} className="gift-claim-row">
              <span>{shortAddr(c.claimer)}</span>
              <span>+{c.prize} ETH</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GiftPacketCard({ giftData, votes = {}, myKey, isSent, onClaim, chain, onRefund }) {
  if (!giftData) return null;
  if (giftData.onChainPacketId) {
    return <OnChainGiftCard giftData={giftData} isSent={isSent} onClaim={onClaim} chain={chain} onRefund={onRefund} />;
  }

  // Legacy off-chain XP packet
  const slots = giftData.slots || 1;
  const claims = giftClaimList(giftData.giftId, giftData.totalXp, slots, votes);
  const mine = claims.find(c => c.key === myKey);
  const remaining = slots - claims.length;
  const empty = remaining <= 0;

  return (
    <div className={`feature-card gift-card ${empty ? 'empty' : ''}`}>
      <div className="feature-card-header">
        <PixelRedPacket size={18} color="#ff3366" />
        <span>XP GIFT PACKET</span>
        <span className="feature-card-tag">{claims.length}/{slots} CLAIMED</span>
      </div>
      <div className="gift-total font-arcade">{giftData.totalXp} XP</div>
      <div className="gift-message">{giftData.message || 'Good luck, player!'}</div>

      {mine ? (
        <div className="gift-result" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <PixelStar size={12} color="#ffd166" />
          <span>YOU WON +{mine.prize} XP</span>
          <PixelStar size={12} color="#ffd166" />
        </div>
      ) : isSent ? (
        <div className="gift-result muted">YOUR PACKET IS OPEN FOR CLAIMS</div>
      ) : empty ? (
        <div className="gift-result muted">ALL SLOTS CLAIMED</div>
      ) : (
        <button
          type="button"
          className="gift-claim-btn font-arcade"
          onClick={() => onClaim && onClaim(giftData)}
        >
          OPEN PACKET
        </button>
      )}

      {claims.length > 0 && (
        <div className="gift-claims">
          {claims.map(c => (
            <div key={c.key} className="gift-claim-row">
              <span>{c.key === myKey ? 'YOU' : `${String(c.key).slice(0, 6)}…`}</span>
              <span>+{c.prize} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
