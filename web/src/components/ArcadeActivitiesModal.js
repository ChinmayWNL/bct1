'use client';
import { useState, useMemo } from 'react';
import { PixelGamepad, PixelTrophy, PixelSwords, PixelCoin, PixelZap } from './PixelIcons';

export const ACTIVITIES = [
  {
    id: 'snake',
    name: 'CYBER SNAKE',
    category: 'ARCADE ACTION',
    typeGroup: 'solo',
    emoji: '🐍',
    badge: 'HOT 🔥',
    description: 'Classic 8-bit snake in a retro neon grid. Gobble crypto orbs, avoid walls, and challenge friends to beat your high score in chat!',
    color: '#39ff14',
    xpReward: '+150 XP'
  },
  {
    id: 'wordle',
    name: 'CYBER WORDLE',
    category: 'PUZZLE & TECH',
    typeGroup: 'solo',
    emoji: '🟩',
    badge: 'DAILY',
    description: 'Guess the secret 5-letter blockchain or cypherpunk term in 6 tries with colored hints. Share your emoji score grid into the chat!',
    color: '#00f0ff',
    xpReward: '+120 XP'
  },
  {
    id: 'blackjack',
    name: 'CYBER 21 (BLACKJACK)',
    category: 'CASINO DUEL',
    typeGroup: 'solo',
    emoji: '🃏',
    badge: 'DOUBLE DOWN ⚡',
    description: 'Hit, Stand, or Double Down at the neon felt table. Beat the dealer to 21 without busting to stack arcade chips and XP!',
    color: '#ffd166',
    xpReward: '+150 XP'
  },
  {
    id: 'tictactoe',
    name: 'CYBER TIC-TAC-TOE',
    category: 'STRATEGY DUEL',
    typeGroup: 'pvp',
    emoji: '❌⭕',
    badge: 'TURN-BASED',
    description: 'Fast head-to-head 3x3 neon grid battle. Place your cyber tokens in turn-based chat rounds to claim victory lines!',
    color: '#00f0ff',
    xpReward: '+100 XP'
  },
  {
    id: 'rps',
    name: 'CYPHER RPS DUEL',
    category: 'ON-CHAIN ESCROW',
    typeGroup: 'pvp',
    emoji: '✊',
    badge: 'ETH BOUNTY',
    description: 'Rock-Paper-Scissors with Keccak-256 commit-reveal escrow. Lock ETH wagers on-chain and settle provably fair bouts!',
    color: '#ff5533',
    xpReward: '+100 XP + ETH'
  },
  {
    id: 'sketch',
    name: 'PIXEL PICTIONARY',
    category: 'CREATIVE & SOCIAL',
    typeGroup: 'social',
    emoji: '🎨',
    badge: 'DISCORD FAV',
    description: 'Draw 8-bit pixel art on a 16x16 canvas with flood fill & undo. Send the sketch mystery into chat for peers to guess!',
    color: '#ff007f',
    xpReward: '+100 XP'
  },
  {
    id: 'capsule',
    name: 'TIME CAPSULE VAULT',
    category: 'TIMELOCKED ESCROW',
    typeGroup: 'social',
    emoji: '⏳',
    badge: 'SMART CONTRACT',
    description: 'Seal secret messages, photos, and ETH bounties in a cryptographic time vault that only unlocks in the future!',
    color: '#9d4edd',
    xpReward: '+100 XP'
  }
];

const TABS = [
  { id: 'all', label: 'ALL GAMES' },
  { id: 'solo', label: 'SOLO ARCADE' },
  { id: 'pvp', label: 'PVP DUELS' },
  { id: 'social', label: 'CREATIVE & VAULT' }
];

export default function ArcadeActivitiesModal({
  isOpen,
  onClose,
  onSelectActivity
}) {
  const [hoveredActivity, setHoveredActivity] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = useMemo(() => {
    return ACTIVITIES.filter(act => {
      const matchesTab = selectedTab === 'all' || act.typeGroup === selectedTab;
      const matchesQuery = !searchQuery.trim() || 
        act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [selectedTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="arcade-activities-overlay" onClick={onClose}>
      <div 
        className="arcade-activities-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="activities-header">
          <div className="activities-title-group">
            <div className="activities-icon-badge">
              <PixelGamepad size={22} color="var(--arcade-neon-magenta, #ff007f)" />
            </div>
            <div>
              <div className="activities-main-title font-arcade">ARCADE ACTIVITIES HUB</div>
              <div className="activities-subtitle">
                Launch interactive multiplayer games & cryptographic challenges in chat
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="activities-close-btn font-arcade" 
            onClick={onClose}
            aria-label="Close Activities"
          >
            ✕ ESC
          </button>
        </div>

        {/* Featured Activity Banner */}
        <div className="activities-banner">
          <div className="banner-badge font-arcade">🚀 DISCORD-STYLE ACTIVITIES SUITE</div>
          <div className="banner-desc">
            Play solo high-score runs, battle 1-on-1 with friends, or challenge <strong>BlockBot AI</strong> to instant matches with zero wait time!
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="activities-filter-bar">
          <div className="activities-tabs-row">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`act-tab-btn font-arcade ${selectedTab === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="activities-search-wrap">
            <input
              type="text"
              className="activities-search-input font-arcade"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Activities Grid */}
        <div className="activities-grid">
          {filteredActivities.map((act) => {
            const isHovered = hoveredActivity === act.id;
            return (
              <div
                key={act.id}
                className={`activity-card ${isHovered ? 'hovered' : ''}`}
                style={{ '--act-accent': act.color }}
                onMouseEnter={() => setHoveredActivity(act.id)}
                onMouseLeave={() => setHoveredActivity(null)}
                onClick={() => {
                  onSelectActivity(act.id);
                  onClose();
                }}
              >
                <div className="activity-card-top">
                  <div className="activity-emoji-box">
                    <span>{act.emoji}</span>
                  </div>
                  <div className="activity-badges">
                    <span className="activity-category-tag font-arcade">{act.category}</span>
                    <span className="activity-highlight-tag font-arcade">{act.badge}</span>
                  </div>
                </div>

                <div className="activity-name font-arcade">{act.name}</div>
                <div className="activity-desc">{act.description}</div>

                <div className="activity-card-bottom">
                  <span className="activity-xp-tag">
                    <PixelTrophy size={13} color="var(--arcade-gold, #ffd166)" />
                    <span>{act.xpReward}</span>
                  </span>
                  <button 
                    type="button" 
                    className="activity-launch-btn font-arcade"
                  >
                    PLAY ▶
                  </button>
                </div>
              </div>
            );
          })}

          {filteredActivities.length === 0 && (
            <div className="no-activities-found font-arcade">
              <span>No activities found matching &quot;{searchQuery}&quot;</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="activities-footer-note font-arcade">
          <span>🎮 All games are synchronized with live chat state and reward on-chain XP ranks</span>
        </div>
      </div>
    </div>
  );
}
