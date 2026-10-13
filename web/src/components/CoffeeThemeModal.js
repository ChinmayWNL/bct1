'use client';

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
  onClose
}) {
  const themes = [
    {
      id: 'arcade',
      name: '8-Bit Pixel Cabinet',
      desc: 'Chunky pixel borders, CRT scanlines, marquee glow & coin-slot gold accents',
      swatches: ['#0a0b10', '#151926', '#ffd166', '#39ff14'],
      badge: '🕹️ 1UP (Default)'
    },
    {
      id: 'gameboy',
      name: 'GameBoy 1989 Phosphor',
      desc: 'Original dot-matrix 4-shade monochrome green LCD with handheld nostalgia',
      swatches: ['#0f240f', '#1f4a1f', '#8bac0f', '#9bbc0f'],
      badge: '📟 1989'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk 1984 Neon',
      desc: 'Outrun synthwave neon cyan, laser magenta & dark purple scanlines',
      swatches: ['#0b0217', '#220e40', '#00f0ff', '#ff007f'],
      badge: '👾 Neon'
    },
    {
      id: 'espresso',
      name: '8-Bit Coffee Shop',
      desc: 'Warm roasted mocha beans, pixel crema & espresso golden checkmarks',
      swatches: ['#120d0a', '#241b17', '#4a3022', '#c89666'],
      badge: '☕ Roast'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card theme-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.05rem', fontFamily: 'var(--font-arcade)' }}>
            <span>🕹️</span> ARCADE CABINET STUDIO
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
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
                <div className="theme-card-title">
                  <span>{t.badge}</span> {t.name}
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
            { id: 'subtle', label: '🌫️ Subtle Scanlines' },
            { id: 'balanced', label: '🕹️ Balanced (Standard)' },
            { id: 'rich', label: '✨ High-Contrast CRT' }
          ].map((op) => (
            <button
              key={op.id}
              type="button"
              className={`wallpaper-btn ${wallpaperOpacity === op.id ? 'active' : ''}`}
              onClick={() => onSelectWallpaperOpacity(op.id)}
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* 3. Audio & 8-Bit Synthesizer Studio */}
        <div className="sound-settings-card">
          <div className="sound-toggle-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--coffee-text-primary)', fontFamily: 'var(--font-arcade)' }}>
                {soundEnabled ? '🔊 8-BIT SFX: ACTIVE' : '🔇 8-BIT SFX: MUTED'}
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
              >
                <span>🔫</span> Laser Blast
              </button>
              <button
                type="button"
                className="sound-sample-btn"
                onClick={onPlayReceiveChime}
              >
                <span>⭐</span> 1-UP Chime
              </button>
              <button
                type="button"
                className="sound-sample-btn"
                onClick={onPlayCoinClink}
              >
                <span>🪙</span> Insert Coin
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
