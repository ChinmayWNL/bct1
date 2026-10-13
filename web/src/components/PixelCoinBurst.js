'use client';
import { useEffect, useState, useMemo } from 'react';

export default function PixelCoinBurst({ event, onComplete }) {
  const [active, setActive] = useState(true);

  // Generate randomized particle trajectories
  const particles = useMemo(() => {
    const count = 28;
    const items = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
      const velocity = 260 + Math.random() * 420;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity - 250; // Bias upward fountain
      const rot = Math.random() * 720 - 360;
      const scale = 0.8 + Math.random() * 0.6;
      const isStar = Math.random() > 0.7;
      items.push({
        id: i,
        vx,
        vy,
        rot,
        scale,
        symbol: isStar ? '⭐' : '🪙',
        delay: Math.random() * 0.12
      });
    }
    return items;
  }, [event?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
      if (onComplete) onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [event?.id, onComplete]);

  if (!active || !event) return null;

  return (
    <div className="pixel-coin-burst-overlay" aria-hidden="true">
      {/* 1. Central / Top Retro Marquee Banner */}
      <div className="pixel-coin-banner">
        <div className="pixel-coin-banner-tag">★ COIN INSERTED // 1-UP! ★</div>
        <div className="pixel-coin-banner-amount">
          +{event.amount || '0.01'} ETH
        </div>
        {event.note && (
          <div className="pixel-coin-banner-note">
            &quot;{event.note}&quot;
          </div>
        )}
      </div>

      {/* 2. Radiating Pixel Coins & Stars */}
      <div className="pixel-coin-particles-center">
        {particles.map((p) => (
          <div
            key={p.id}
            className="pixel-coin-particle"
            style={{
              '--vx': `${p.vx}px`,
              '--vy': `${p.vy}px`,
              '--rot': `${p.rot}deg`,
              '--scale': p.scale,
              animationDelay: `${p.delay}s`
            }}
          >
            {p.symbol}
          </div>
        ))}
      </div>
    </div>
  );
}
