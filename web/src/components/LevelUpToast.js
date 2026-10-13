'use client';
import { useEffect, useState } from 'react';

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
        <div className="levelup-badge">{event.badge || '⭐'}</div>
        <div className="levelup-content">
          <div className="levelup-header">★ LEVEL UP! ★</div>
          <div className="levelup-title">
            PROMOTED TO LVL {event.level} {event.title}
          </div>
          <div className="levelup-subtext">NEW ARCADE PERK UNLOCKED</div>
        </div>
      </div>
    </div>
  );
}
