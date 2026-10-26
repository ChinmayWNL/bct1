'use client';
import { useEffect, useState, useMemo } from 'react';
import { PixelCoin, PixelStar } from './PixelIcons';

function generateParticles(eventId) {
  const seed = typeof eventId === 'number' ? eventId : 1337;
  let s = (Math.abs(seed) % 2147483647) || 1337;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const count = 28;
  const items = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (rand() * 0.4 - 0.2);
    const velocity = 260 + rand() * 420;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 250;
    const rot = rand() * 720 - 360;
    const scale = 0.8 + rand() * 0.6;
    const isStar = rand() > 0.7;
    items.push({
      id: i,
      vx,
      vy,
      rot,
      scale,
      type: isStar ? 'star' : 'coin',
      delay: rand() * 0.12
    });
  }
  return items;
}

export default function PixelCoinBurst({ event, onComplete }) {
  const [active, setActive] = useState(true);

  // Generate deterministic particle trajectories
  const particles = useMemo(() => generateParticles(event?.id), [event?.id]);

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
        <div className="pixel-coin-banner-tag" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <PixelStar size={12} color="#ffd166" />
          <span>COIN INSERTED // 1-UP!</span>
          <PixelStar size={12} color="#ffd166" />
        </div>
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
            {p.type === 'star' ? (
              <PixelStar size={Math.round(20 * p.scale)} color="#ffd166" />
            ) : (
              <PixelCoin size={Math.round(22 * p.scale)} color="#ffd166" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
