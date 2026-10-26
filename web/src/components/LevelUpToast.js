'use client';
import { useEffect, useState } from 'react';
import { PixelEmoji, PixelStar } from './PixelIcons';

export default function LevelUpToast({ event, onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 3200);
    return () => clearTimeout(timer);
  }, [event?.id, onComplete]);

  if (!visible || !event) return null;

  return (
    <div className="arcade-levelup-toast" aria-hidden="true">
      <div className="levelup-toast-inner">
        <div className="levelup-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <PixelEmoji char={event.badge || '⭐'} size={28} />
        </div>
        <div className="levelup-content">
          <div className="levelup-header" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <PixelStar size={12} color="#ffd166" />
            <span>LEVEL UP!</span>
            <PixelStar size={12} color="#ffd166" />
          </div>
          <div className="levelup-title">
            PROMOTED TO LVL {event.level} {event.title}
          </div>
          <div className="levelup-subtext">NEW ARCADE PERK UNLOCKED</div>
        </div>
      </div>
    </div>
  );
}
