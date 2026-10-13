// Arcade XP & Level Progression Engine

export const ARCADE_RANKS = [
  { level: 1, title: 'ROOKIE 1P', minXp: 0, maxXp: 100, badge: '🪙', color: '#ffd166' },
  { level: 2, title: 'CYPHERPUNK', minXp: 100, maxXp: 250, badge: '⚡', color: '#39ff14' },
  { level: 3, title: 'NETRUNNER', minXp: 250, maxXp: 500, badge: '👾', color: '#00f0ff' },
  { level: 4, title: 'HIGH ROLLER', minXp: 500, maxXp: 1000, badge: '💎', color: '#ff007f' },
  { level: 5, title: 'BLOCK MASTER', minXp: 1000, maxXp: 2000, badge: '👑', color: '#ffd166' },
  { level: 6, title: 'ARCADE LEGEND', minXp: 2000, maxXp: 99999, badge: '🏆', color: '#39ff14' },
];

export function getArcadeRank(xp = 0) {
  const safeXp = Math.max(0, parseInt(xp, 10) || 0);
  for (let i = ARCADE_RANKS.length - 1; i >= 0; i--) {
    if (safeXp >= ARCADE_RANKS[i].minXp) {
      const rank = ARCADE_RANKS[i];
      const nextRank = ARCADE_RANKS[i + 1] || null;
      const nextMin = nextRank ? nextRank.minXp : rank.maxXp;
      const span = nextMin - rank.minXp;
      const progressPercent = nextRank 
        ? Math.min(100, Math.max(0, ((safeXp - rank.minXp) / span) * 100))
        : 100;
      return {
        ...rank,
        currentXp: safeXp,
        nextRankMin: nextMin,
        progressPercent: Math.round(progressPercent),
        xpToNext: Math.max(0, nextMin - safeXp)
      };
    }
  }
  return { 
    ...ARCADE_RANKS[0], 
    currentXp: safeXp, 
    nextRankMin: 100, 
    progressPercent: 0,
    xpToNext: 100 
  };
}

export function loadStoredXp() {
  if (typeof window === 'undefined') return 50;
  try {
    const val = localStorage.getItem('blockchat_arcade_xp');
    if (val !== null) {
      return parseInt(val, 10) || 50;
    }
  } catch (e) {}
  return 50; // Default starter XP for Player 1
}

export function saveStoredXp(xp) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('blockchat_arcade_xp', xp.toString());
  } catch (e) {}
}
