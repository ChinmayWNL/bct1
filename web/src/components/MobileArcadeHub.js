'use client';
import {
  PixelCoin,
  PixelSwords,
  PixelHourglass,
  PixelLock,
  PixelGamepad,
  PixelZap,
  PixelTrophy,
  PixelShield,
  PixelStar,
  PixelRedPacket,
  PixelBarChart,
  PixelTimer,
  PixelDice,
  PixelArcadeCabinet,
  PixelClose
} from './PixelIcons';

export default function MobileArcadeHub({
  isOpen,
  onClose,
  onOpenSendCrypto,
  onOpenRequestCrypto,
  onOpenDuel,
  onOpenActivities,
  onOpenTimeCapsule,
  onOpenCipher,
  onSetDisappearingTimer,
  disappearingTimer,
  onExecuteCommand,
  isGroup
}) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'tip',
      title: 'Send ETH Tip',
      subtitle: 'Instant micro-tipping with coin bursts',
      icon: <PixelCoin size={24} color="#ffd166" />,
      color: '#ffd166',
      badge: 'POPULAR',
      onClick: () => {
        onClose();
        onOpenSendCrypto();
      }
    },
    {
      id: 'activities',
      title: 'Arcade Activities',
      subtitle: 'Mini-games: Snake, Wordle, 21, Pictionary & Duels',
      icon: <PixelGamepad size={24} color="#ff007f" />,
      color: '#ff007f',
      badge: 'GAMES',
      onClick: () => {
        onClose();
        if (onOpenActivities) onOpenActivities();
        else onOpenDuel('0');
      }
    },
    {
      id: 'capsule',
      title: 'Time Capsule',
      subtitle: 'Timelocked on-chain memory vault',
      icon: <PixelHourglass size={24} color="#ffd166" />,
      color: '#ffd166',
      badge: 'VAULT',
      onClick: () => {
        onClose();
        onOpenTimeCapsule();
      }
    },
    {
      id: 'request',
      title: 'Request ETH',
      subtitle: 'Create a bill or split payment request',
      icon: <PixelZap size={24} color="#00f0ff" />,
      color: '#00f0ff',
      badge: 'INVOICE',
      onClick: () => {
        onClose();
        onOpenRequestCrypto();
      }
    },
    {
      id: 'packet',
      title: 'Lucky Red Packet',
      subtitle: 'Drop claimable ETH packet in chat',
      icon: <PixelRedPacket size={24} color="#ff3366" />,
      color: '#ff3366',
      badge: isGroup ? 'GROUP' : 'GIFT',
      onClick: () => {
        onClose();
        onExecuteCommand('/gift 0.005 3 Lucky arcade red packet!');
      }
    },
    {
      id: 'poll',
      title: 'Create Ballot Poll',
      subtitle: 'On-chain multi-choice community poll',
      icon: <PixelBarChart size={24} color="#39ff14" />,
      color: '#39ff14',
      badge: 'VOTE',
      onClick: () => {
        onClose();
        onExecuteCommand('/poll Who is the ultimate gamer? | Satoshi | Vitalik | CypherPunk');
      }
    },
    {
      id: 'cipher',
      title: 'Playfair Cipher',
      subtitle: 'Encrypt outgoing chat with secret key',
      icon: <PixelLock size={24} color="#b026ff" />,
      color: '#b026ff',
      badge: 'E2EE+',
      onClick: () => {
        onClose();
        onOpenCipher();
      }
    },
    {
      id: 'timer',
      title: 'Self-Destruct Timer',
      subtitle: disappearingTimer > 0 ? `Currently active: ${disappearingTimer === 60 ? '1m' : disappearingTimer === 86400 ? '24h' : '7d'}` : 'Messages expire automatically',
      icon: <PixelTimer size={24} color="#ffd166" />,
      color: '#ffd166',
      badge: disappearingTimer > 0 ? 'ACTIVE' : 'OFF',
      onClick: () => {
        // Cycle timer 0 -> 60 -> 86400 -> 604800 -> 0
        const next = disappearingTimer === 0 ? 60 : disappearingTimer === 60 ? 86400 : disappearingTimer === 86400 ? 604800 : 0;
        onSetDisappearingTimer(next);
        onClose();
      }
    },
    {
      id: 'flip',
      title: 'Fair Coin & Dice',
      subtitle: 'Provably fair coin toss / tabletop dice',
      icon: <PixelDice size={24} color="#00f0ff" />,
      color: '#00f0ff',
      badge: 'RNG',
      onClick: () => {
        onClose();
        onExecuteCommand('/flip');
      }
    }
  ];

  return (
    <div className="modal-overlay mobile-sheet-overlay" onClick={onClose}>
      <div className="modal-card mobile-arcade-hub-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Swipe Handle */}
        <div className="mobile-sheet-handle-bar">
          <div className="mobile-sheet-handle"></div>
        </div>

        {/* Sheet Header */}
        <div className="mobile-arcade-hub-header">
          <div className="hub-title-box">
            <PixelArcadeCabinet size={26} color="#ff007f" />
            <div>
              <h3 className="font-arcade hub-title">ARCADE ACTIONS & WEB3 D-APPS</h3>
              <p className="hub-subtitle">1-Tap Web3 utilities & on-chain mini-games</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <PixelClose size={16} />
          </button>
        </div>

        {/* Action Grid */}
        <div className="mobile-arcade-hub-grid">
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              className="hub-action-card"
              onClick={act.onClick}
              style={{
                borderColor: `color-mix(in srgb, ${act.color} 30%, transparent)`
              }}
            >
              <div className="hub-action-top">
                <div 
                  className="hub-action-icon-wrap"
                  style={{
                    background: `color-mix(in srgb, ${act.color} 14%, rgba(0,0,0,0.4))`,
                    borderColor: act.color,
                    boxShadow: `0 0 12px color-mix(in srgb, ${act.color} 35%, transparent)`
                  }}
                >
                  {act.icon}
                </div>
                {act.badge && (
                  <span 
                    className="hub-action-badge font-arcade"
                    style={{
                      color: act.color,
                      borderColor: `color-mix(in srgb, ${act.color} 40%, transparent)`,
                      background: `color-mix(in srgb, ${act.color} 12%, rgba(0,0,0,0.5))`
                    }}
                  >
                    {act.badge}
                  </span>
                )}
              </div>

              <div className="hub-action-body">
                <span className="hub-action-name font-arcade" style={{ color: '#fff' }}>
                  {act.title}
                </span>
                <span className="hub-action-desc">
                  {act.subtitle}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Quick Tip */}
        <div className="mobile-hub-footer-hint">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <PixelZap size={14} color="#ffd166" />
            <span>Tip: You can also type <code>/</code> in the chat bar to trigger copilot commands!</span>
          </span>
        </div>
      </div>
    </div>
  );
}
