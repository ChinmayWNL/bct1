'use client';
import {
  PixelArcadeCabinet,
  PixelClose,
  PixelVolume,
  PixelMute,
  PixelZap,
  PixelStar,
  PixelCoin,
  PixelTerminal,
  PixelAlien,
  PixelCoffee,
  PixelEye,
  PixelSparkles,
  renderPixelText
} from './PixelIcons';

export default function CoffeeThemeModal({
  currentTheme,
  onSelectTheme,
  wallpaperOpacity,
  onSelectWallpaperOpacity,
  soundEnabled,
  onToggleSound,
  onPlaySendPop,
  onPlayReceiveChime,
  onPlayCoinClink,
  onTestCoinBurst,
  onClose
}) {
  const themes = [
    {
      id: 'arcade',
      name: '8-Bit Pixel Cabinet',
      desc: 'Chunky pixel borders, CRT scanlines, marquee glow & coin-slot gold accents',
      swatches: ['#0a0b10', '#151926', '#ffd166', '#39ff14'],
      badge: '1UP (Default)',
      icon: <PixelArcadeCabinet size={14} color="#ffd166" />
    },
    {
      id: 'gameboy',
      name: 'GameBoy 1989 Phosphor',
      desc: 'Original dot-matrix 4-shade monochrome green LCD with handheld nostalgia',
      swatches: ['#0f240f', '#1f4a1f', '#8bac0f', '#9bbc0f'],
      badge: '1989',
      icon: <PixelTerminal size={14} color="#8bac0f" />
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk 1984 Neon',
      desc: 'Outrun synthwave neon cyan, laser magenta & dark purple scanlines',
      swatches: ['#0b0217', '#220e40', '#00f0ff', '#ff007f'],
      badge: 'Neon',
      icon: <PixelAlien size={14} color="#00f0ff" />
    },
    {
      id: 'espresso',
      name: '8-Bit Coffee Shop',
      desc: 'Warm roasted mocha beans, pixel crema & espresso golden checkmarks',
      swatches: ['#120d0a', '#241b17', '#4a3022', '#c89666'],
      badge: 'Roast',
      icon: <PixelCoffee size={14} color="#c89666" />
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card theme-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.05rem', fontFamily: 'var(--font-arcade)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PixelArcadeCabinet size={20} color="var(--arcade-gold)" /> ARCADE CABINET STUDIO
          </div>
          <button className="modal-close-btn" onClick={onClose}><PixelClose size={16} /></button>
        </div>

        {/* 1. Cabinet Colorway Selection */}
        <div className="theme-section-title" style={{ fontFamily: 'var(--font-arcade)', fontSize: '0.72rem' }}>
          CHOOSE CABINET COLORWAY
        </div>
        <div className="theme-options-grid">
          {themes.map((t) => (
            <div
              key={t.id}
              className={`theme-card-option ${currentTheme === t.id ? 'active' : ''}`}
              onClick={() => onSelectTheme(t.id)}
            >
              <div className="theme-card-info">
                <div className="theme-card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {t.icon}
                    <span>{t.badge}</span>
                  </span>
                  <span>{t.name}</span>
                </div>
                <div className="theme-card-desc">{t.desc}</div>
              </div>
              <div className="theme-card-swatches">
                {t.swatches.map((color, idx) => (
                  <span
                    key={idx}
                    className="theme-swatch-dot"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 2. CRT Scanline Opacity */}
        <div className="theme-section-title" style={{ marginTop: '16px', fontFamily: 'var(--font-arcade)', fontSize: '0.72rem' }}>
          CRT SCANLINE OPACITY
        </div>
        <div className="wallpaper-opacity-row">
          {[
            { id: 'subtle', label: 'Subtle Scanlines', icon: <PixelEye size={14} color="#8b9bb4" /> },
            { id: 'balanced', label: 'Balanced (Standard)', icon: <PixelArcadeCabinet size={14} color="#ffd166" /> },
            { id: 'rich', label: 'High-Contrast CRT', icon: <PixelSparkles size={14} color="#00f0ff" /> }
          ].map((op) => (
            <button
              key={op.id}
              type="button"
              className={`wallpaper-btn ${wallpaperOpacity === op.id ? 'active' : ''}`}
              onClick={() => onSelectWallpaperOpacity(op.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {op.icon}
              <span>{op.label}</span>
            </button>
          ))}
        </div>

        {/* 3. Audio & 8-Bit Synthesizer Studio */}
        <div className="sound-settings-card">
          <div className="sound-toggle-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--coffee-text-primary)', fontFamily: 'var(--font-arcade)' }}>
                {soundEnabled ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <PixelVolume size={16} color="#39ff14" /> 8-BIT SFX: ACTIVE
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <PixelMute size={16} color="#8b9bb4" /> 8-BIT SFX: MUTED
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--coffee-text-muted)', marginTop: '2px' }}>
                Synthesized laser blasts, 1-UP fanfare &amp; coin insert audio
              </div>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={onToggleSound}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div style={{ borderTop: '1px solid var(--coffee-border)', paddingTop: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--coffee-text-dim)', marginBottom: '8px', fontFamily: 'var(--font-arcade)' }}>
              TEST SOUNDBOARD:
            </div>
            <div className="sound-samples-row">
              <button
                type="button"
                className="sound-sample-btn"
                onClick={onPlaySendPop}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PixelZap size={14} color="#00f0ff" /> Laser Blast
              </button>
              <button
                type="button"
                className="sound-sample-btn"
                onClick={onPlayReceiveChime}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PixelStar size={14} color="#ffd166" /> 1-UP Chime
              </button>
              <button
                type="button"
                className="sound-sample-btn"
                onClick={() => {
                  onPlayCoinClink();
                  if (onTestCoinBurst) onTestCoinBurst();
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <PixelCoin size={14} color="#ffd166" /> Coin Burst FX
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="modal-btn-primary"
            style={{ padding: '8px 24px', fontSize: '0.78rem', fontFamily: 'var(--font-arcade)' }}
            onClick={onClose}
          >
            START GAME (DONE)
          </button>
        </div>
      </div>
    </div>
  );
}
