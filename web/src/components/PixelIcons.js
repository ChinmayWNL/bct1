'use client';
import {
  Smile,
  Heart,
  Coins,
  Fire,
  Zap,
  Alien,
  Trophy,
  Shield,
  Lock,
  Search,
  PhoneCallSharp,
  Camera,
  Mic,
  Trash,
  QrCode,
  Volume2,
  VolumeX,
  MapPin,
  Check,
  CheckDouble,
  MessageText,
  Gamepad,
  RobotFaceHappy,
  Link,
  Sliders,
  AvatarCircle,
  MoreVertical
} from 'pixelarticons/react';

// Wrapper helper ensuring crisp pixel borders
function makePixelIcon(Component, defaultColor = 'currentColor') {
  return function PixelWrapper({ size = 20, color = defaultColor, className = '', style = {}, ...props }) {
    return (
      <span
        className={`pixel-icon-wrap ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          color: color,
          imageRendering: 'pixelated',
          shapeRendering: 'crispEdges',
          lineHeight: 1,
          flexShrink: 0,
          ...style
        }}
        {...props}
      >
        <Component width={size} height={size} fill="currentColor" />
      </span>
    );
  };
}

// Re-exported pixel art icons
export const PixelSmile = makePixelIcon(Smile, '#ffd166');
export const PixelHeart = makePixelIcon(Heart, '#ff007f');
export const PixelCoin = makePixelIcon(Coins, '#ffd166');
export const PixelFire = makePixelIcon(Fire, '#ff5533');
export const PixelZap = makePixelIcon(Zap, '#ffd166');
export const PixelAlien = makePixelIcon(Alien, '#39ff14');
export const PixelTrophy = makePixelIcon(Trophy, '#ffd166');
export const PixelGamepad = makePixelIcon(Gamepad, '#00f0ff');
export const PixelShield = makePixelIcon(Shield, '#00f0ff');
export const PixelLock = makePixelIcon(Lock, '#ffd166');
export const PixelSearch = makePixelIcon(Search, 'currentColor');
export const PixelPhone = makePixelIcon(PhoneCallSharp, '#39ff14');
export const PixelVideo = makePixelIcon(Camera, '#00f0ff');
export const PixelMic = makePixelIcon(Mic, 'currentColor');
export const PixelTrash = makePixelIcon(Trash, '#ff007f');
export const PixelClip = makePixelIcon(Link, 'currentColor');
export const PixelQr = makePixelIcon(QrCode, 'currentColor');
export const PixelVolume = makePixelIcon(Volume2, '#39ff14');
export const PixelMute = makePixelIcon(VolumeX, '#8b9bb4');
export const PixelPin = makePixelIcon(MapPin, '#ffd166');
export const PixelCheck = makePixelIcon(Check, '#39ff14');
export const PixelDoubleCheck = makePixelIcon(CheckDouble, '#39ff14');
export const PixelMessage = makePixelIcon(MessageText, 'currentColor');
export const PixelRobot = makePixelIcon(RobotFaceHappy, '#00f0ff');
export const PixelSliders = makePixelIcon(Sliders, 'currentColor');
export const PixelUser = makePixelIcon(AvatarCircle, 'currentColor');
export const PixelMore = makePixelIcon(MoreVertical, 'currentColor');

// Custom Handcrafted 24x24 Vector Pixel Emojis & Controls
export function PixelCool({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 2h10v2H7zM5 4h2v2H5zm12 0h2v2h-2zM3 6h2v12H3zm16 0h2v12h-2zm-14 3h14v2H5zm0 2h5v3H5zm9 0h5v3h-5zm-1 5h2v2h-2zm-4 0h2v2H9zm-2-2h2v2H7zm8 0h2v2h-2zm-10 4h2v2H5zm12 0h2v2h-2zm-10 2h10v2H7z" />
      </svg>
    </span>
  );
}

export function PixelWink({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 2h10v2H7zM5 4h2v2H5zm12 0h2v2h-2zM3 6h2v12H3zm16 0h2v12h-2zm-12 3h3v2H7zm7 1h4v2h-4zm-7 6h10v2H7zm-2 2h2v2H5zm12 0h2v2h-2zm-10 2h10v2H7z" />
      </svg>
    </span>
  );
}

export function PixelGrin({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 2h10v2H7zM5 4h2v2H5zm12 0h2v2h-2zM3 6h2v12H3zm16 0h2v12h-2zm-12 2h3v3H7zm10 0h3v3h-3zm-11 5h12v4H6zm2 1v2h2v-2zm4 0v2h2v-2zm4 0v2h2v-2zm-11 4h2v2H5zm12 0h2v2h-2zm-10 2h10v2H7z" />
      </svg>
    </span>
  );
}

export function PixelSkull({ size = 20, color = '#ffffff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 2h10v2H7zM5 4h2v2H5zm12 0h2v2h-2zM3 6h2v9H3zm16 0h2v9h-2zm-13 4h3v4H6zm9 0h3v4h-3zm-9 6h2v4H6zm10 0h2v4h-2zm-7 2h1v2H9zm3 0h1v2h-1zm3 0h1v2h-1zm-8 2h8v2H7z" />
      </svg>
    </span>
  );
}

export function PixelGhost({ size = 20, color = '#c5d1eb', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 2h10v2H7zM5 4h2v2H5zm12 0h2v2h-2zM3 6h2v14H3zm16 0h2v14h-2zm-13 3h3v3H6zm8 0h3v3h-2zm-8 11h2v2H6zm6 0h2v2h-2zm6 0h2v2h-2zm-3-1h2v2h-2zm-6 0h2v2H9z" />
      </svg>
    </span>
  );
}

export function PixelStar({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M11 2h2v3h-2zm-3 4h8v2H8zm-6 3h20v2H2zm3 3h14v2H5zm2 3h10v2H7zm-3 3h4v3H4zm12 0h4v3h-4zm-5-1h2v3h-2z" />
      </svg>
    </span>
  );
}

export function PixelGem({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 3h10v2H7zM4 5h3v2H4zm13 0h3v2h-3zM2 7h2v3H2zm18 0h2v3h-2zm-16 4h16v2H4zm2 3h12v2H6zm3 3h6v2H9zm2 3h2v2h-2z" />
      </svg>
    </span>
  );
}

export function PixelRocket({ size = 20, color = '#ff7700', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M11 2h2v3h-2zm-2 3h4v3H9zm-2 3h6v3H7zm-2 3h8v3H5zm-2 3h10v3H3zm8 3h2v3h-2zm-3 3h4v2H8z" />
      </svg>
    </span>
  );
}

export function PixelSend({ size = 20, color = 'currentColor', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M3 3h2v2h2v2h2v2h2v2h-4v2h-2v2H3zm16 0h2v18h-2v-4h-2v-2h-2v-2h-2v-2h2V9h2V7h2V5h2zM7 9h4v2H7zm4 4h4v2h-4z" />
      </svg>
    </span>
  );
}

export function PixelSwords({ size = 20, color = '#ff007f', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M19 2h3v3h-2v2h-2v2h-2v2h-2v2h-2v2h-2v2H8v2H5v3H2v-3h3v-3h2v-2h2v-2h2v-2h2v-2h2V7h2V5h2V2zm-4 7l2-2 2 2-2 2-2-2zM4 2h3v3H5v2H3v2H1V6h2V4h1V2zm15 15h3v3h-2v2h-2v2h-3v-3h2v-2h2v-2z" />
      </svg>
    </span>
  );
}

export function PixelDice({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M5 3h14v2H5zm-2 2h2v14H3zm16 0h2v14h-2zm-14 14h14v2H5zM7 7h2v2H7zm8 0h2v2h-2zm-4 4h2v2h-2zm-4 4h2v2H7zm8 0h2v2h-2z" />
      </svg>
    </span>
  );
}

export function PixelHourglass({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 2h16v2H4zm2 2h12v2H6zm2 2h8v2H8zm2 2h4v2h-4zm1 2h2v2h-2zm-1 2h4v2h-4zm-2 2h8v2H8zm-2 2h12v2H6zm-2 2h16v2H4z" />
      </svg>
    </span>
  );
}

export function PixelChest({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 4h16v2H4zm-2 2h2v14H2zm18 0h2v14h-2zm-16 4h16v2H4zm0 8h16v2H4zm7-5h2v3h-2z" />
      </svg>
    </span>
  );
}

export function PixelTerminal({ size = 20, color = '#39ff14', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M3 3h18v2H3zm-1 2h2v14H2zm18 0h2v14h-2zm-17 14h18v2H3zM6 8h2v2H6zm2 2h2v2H8zm-2 2h2v2H6zm6 2h6v2h-6z" />
      </svg>
    </span>
  );
}

// Complete Catalog of 8-Bit Pixel Emojis for EmojiPicker and Reaction Bars
export const PIXEL_EMOJI_CATALOG = [
  { id: 'p_smile', name: 'Pixel Smile', char: '😀', Component: PixelSmile, color: '#ffd166' },
  { id: 'p_grin', name: 'Pixel Grin', char: '😁', Component: PixelGrin, color: '#ffd166' },
  { id: 'p_wink', name: 'Pixel Wink', char: '😉', Component: PixelWink, color: '#ffd166' },
  { id: 'p_cool', name: 'Pixel Sunglasses', char: '😎', Component: PixelCool, color: '#ffd166' },
  { id: 'p_heart', name: 'Pixel Heart', char: '❤️', Component: PixelHeart, color: '#ff007f' },
  { id: 'p_coin', name: 'Pixel Coin', char: '🪙', Component: PixelCoin, color: '#ffd166' },
  { id: 'p_star', name: 'Pixel 1-UP Star', char: '⭐', Component: PixelStar, color: '#ffd166' },
  { id: 'p_fire', name: 'Pixel Fire', char: '🔥', Component: PixelFire, color: '#ff4d4d' },
  { id: 'p_zap', name: 'Pixel Lightning', char: '⚡', Component: PixelZap, color: '#ffd166' },
  { id: 'p_gem', name: 'Pixel Diamond', char: '💎', Component: PixelGem, color: '#00f0ff' },
  { id: 'p_alien', name: 'Pixel Invader', char: '👾', Component: PixelAlien, color: '#39ff14' },
  { id: 'p_ghost', name: 'Pixel Ghost', char: '👻', Component: PixelGhost, color: '#c5d1eb' },
  { id: 'p_robot', name: 'Pixel Bot', char: '🤖', Component: PixelRobot, color: '#00f0ff' },
  { id: 'p_skull', name: 'Pixel Skull', char: '💀', Component: PixelSkull, color: '#ffffff' },
  { id: 'p_rocket', name: 'Pixel Rocket', char: '🚀', Component: PixelRocket, color: '#ff7700' },
  { id: 'p_trophy', name: 'Pixel Trophy', char: '🏆', Component: PixelTrophy, color: '#ffd166' },
  { id: 'p_gamepad', name: 'Pixel Gamepad', char: '🎮', Component: PixelGamepad, color: '#8338ec' },
  { id: 'p_shield', name: 'Pixel Shield', char: '🛡️', Component: PixelShield, color: '#00f0ff' },
  { id: 'p_lock', name: 'Pixel Lock', char: '🔒', Component: PixelLock, color: '#ffd166' }
];
