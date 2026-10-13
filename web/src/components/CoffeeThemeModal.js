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
      id: 'espresso',
      name: 'Espresso Dark Roast',
      desc: 'Dark roasted beans, rich espresso crema & warm golden checkmarks',
      swatches: ['#120d0a', '#1c1512', '#4a3022', '#c89666'],
      badge: '☕ Classic'
    },
    {
      id: 'latte',
      name: 'Latte Macchiato',
      desc: 'Silky steamed milk froth, roasted caramel toffee & hazelnut tones',
      swatches: ['#18120e', '#221812', '#5c3d28', '#d4a373'],
      badge: '🥛 Smooth'
    },
    {
      id: 'mocha',
      name: 'Mocha Chocolatier',
      desc: 'Dark cocoa noir ganache, cinnamon bean & rose gold accents',
      swatches: ['#130c0e', '#1d1114', '#522432', '#d98880'],
      badge: '🍫 Velvet'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card theme-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.15rem' }}>
            <span>☕</span> Coffee Theme & Audio Studio
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* 1. Roast Selection */}
        <div className="theme-section-title">Roast Palette</div>
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

        {/* 2. Wallpaper Doodle Density */}
        <div className="theme-section-title" style={{ marginTop: '16px' }}>Wallpaper Doodle Opacity</div>
        <div className="wallpaper-opacity-row">
          {[
            { id: 'subtle', label: '🌫️ Subtle Watermark' },
            { id: 'balanced', label: '☕ Balanced (Standard)' },
            { id: 'rich', label: '✨ Rich Contrast' }
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

        {/* 3. Audio & Sounds Studio */}
        <div className="sound-settings-card">
          <div className="sound-toggle-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--coffee-text-primary)' }}>
                {soundEnabled ? '🔊 WhatsApp Sounds: Active' : '🔇 WhatsApp Sounds: Muted'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--coffee-text-muted)' }}>
                Synthesized message pops, coffee chimes & tip bells
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
            <div style={{ fontSize: '0.75rem', color: 'var(--coffee-text-dim)', marginBottom: '8px' }}>
              Test Sound Feedback:
            </div>
            <div className="sound-samples-row">
              <button
                type="button"
                className="sound-sample-btn"
                onClick={onPlaySendPop}
              >
                <span>🫧</span> Send Pop
              </button>
              <button
                type="button"
                className="sound-sample-btn"
                onClick={onPlayReceiveChime}
              >
                <span>🔔</span> Coffee Chime
              </button>
              <button
                type="button"
                className="sound-sample-btn"
                onClick={onPlayCoinClink}
              >
                <span>🪙</span> ETH Tip Clink
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="modal-btn-primary"
            style={{ padding: '8px 24px', fontSize: '0.88rem' }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
