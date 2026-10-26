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
  MoreVertical,
  ThumbsUp,
  Coffee,
  Bell,
  Dollar,
  Close,
  Plus,
  Minus,
  Gift,
  Eye,
  Clock,
  Save,
  FileText,
  Music,
  Flag,
  Target,
  Angry,
  Hand,
  Sun,
  Moon,
  CircleQuestion
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
export const PixelThumbsUp = makePixelIcon(ThumbsUp, '#39ff14');
export const PixelCoffee = makePixelIcon(Coffee, '#ffd166');
export const PixelBell = makePixelIcon(Bell, '#ffd166');
export const PixelDollar = makePixelIcon(Dollar, '#39ff14');
export const PixelClose = makePixelIcon(Close, 'currentColor');
export const PixelPlus = makePixelIcon(Plus, 'currentColor');
export const PixelMinus = makePixelIcon(Minus, 'currentColor');
export const PixelGift = makePixelIcon(Gift, '#ff007f');
export const PixelEye = makePixelIcon(Eye, '#00f0ff');
export const PixelClock = makePixelIcon(Clock, '#ffd166');
export const PixelFloppy = makePixelIcon(Save, '#00f0ff');
export const PixelReceipt = makePixelIcon(FileText, '#ffd166');
export const PixelMusic = makePixelIcon(Music, '#ff007f');
export const PixelFlag = makePixelIcon(Flag, '#ffd166');
export const PixelTarget = makePixelIcon(Target, '#ff007f');
export const PixelAngry = makePixelIcon(Angry, '#ff3366');
export const PixelWave = makePixelIcon(Hand, '#ffd166');
export const PixelSun = makePixelIcon(Sun, '#ffd166');
export const PixelMoon = makePixelIcon(Moon, '#00f0ff');
export const PixelQuestionCircle = makePixelIcon(CircleQuestion, '#ffd166');

// 8-Bit Pixel Playing Card Suits (Spade, Heart, Diamond, Club)
export function PixelSpade({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="11" y="2" width="2" height="2" fill={color} />
        <rect x="10" y="4" width="4" height="2" fill={color} />
        <rect x="8" y="6" width="8" height="2" fill={color} />
        <rect x="6" y="8" width="12" height="4" fill={color} />
        <rect x="4" y="10" width="16" height="4" fill={color} />
        <rect x="6" y="14" width="12" height="2" fill={color} />
        <rect x="8" y="16" width="3" height="2" fill={color} />
        <rect x="13" y="16" width="3" height="2" fill={color} />
        <rect x="11" y="16" width="2" height="4" fill={color} />
        <rect x="9" y="20" width="6" height="2" fill={color} />
      </svg>
    </span>
  );
}

export function PixelHeartSuit({ size = 20, color = '#ff007f', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="6" y="4" width="4" height="2" fill={color} />
        <rect x="14" y="4" width="4" height="2" fill={color} />
        <rect x="4" y="6" width="8" height="4" fill={color} />
        <rect x="12" y="6" width="8" height="4" fill={color} />
        <rect x="4" y="10" width="16" height="4" fill={color} />
        <rect x="6" y="14" width="12" height="2" fill={color} />
        <rect x="8" y="16" width="8" height="2" fill={color} />
        <rect x="10" y="18" width="4" height="2" fill={color} />
        <rect x="11" y="20" width="2" height="2" fill={color} />
      </svg>
    </span>
  );
}

export function PixelDiamondSuit({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="11" y="2" width="2" height="2" fill={color} />
        <rect x="10" y="4" width="4" height="2" fill={color} />
        <rect x="8" y="6" width="8" height="2" fill={color} />
        <rect x="6" y="8" width="12" height="2" fill={color} />
        <rect x="4" y="10" width="16" height="4" fill={color} />
        <rect x="6" y="14" width="12" height="2" fill={color} />
        <rect x="8" y="16" width="8" height="2" fill={color} />
        <rect x="10" y="18" width="4" height="2" fill={color} />
        <rect x="11" y="20" width="2" height="2" fill={color} />
      </svg>
    </span>
  );
}

export function PixelClub({ size = 20, color = '#39ff14', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="10" y="2" width="4" height="4" fill={color} />
        <rect x="4" y="8" width="4" height="4" fill={color} />
        <rect x="16" y="8" width="4" height="4" fill={color} />
        <rect x="8" y="6" width="8" height="8" fill={color} />
        <rect x="11" y="14" width="2" height="6" fill={color} />
        <rect x="9" y="20" width="6" height="2" fill={color} />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Question Mark Block
export function PixelQuestion({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="8" y="4" width="8" height="2" fill={color} />
        <rect x="6" y="6" width="2" height="4" fill={color} />
        <rect x="16" y="6" width="2" height="4" fill={color} />
        <rect x="14" y="10" width="2" height="2" fill={color} />
        <rect x="11" y="12" width="2" height="4" fill={color} />
        <rect x="11" y="18" width="2" height="2" fill={color} />
      </svg>
    </span>
  );
}


export function PixelCamera({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 5h4v2H4zm4-2h8v2H8zm8 2h4v2h-4zM2 7h2v12H2zm2 12h16v2H4zM20 7h2v12h-2zM10 8h4v2h-4zm0 6h4v2h-4zm-2-4h2v4H8zm6 0h2v4h-2z"/>
      </svg>
    </span>
  );
}

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

// 8-Bit Pixel Rock (Cypher Fist)
export function PixelRock({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 6h10v2H7zm-3 2h3v10H4zm13 0h3v10h-3zm-10 10h10v2H7z" fill="#ffd166" />
        <rect x="7" y="8" width="10" height="10" fill="#ffd166" />
        <rect x="8" y="9" width="3" height="3" fill="#ffffff" />
        <rect x="13" y="14" width="3" height="3" fill="#b38600" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Paper (Scroll / Open Cyber Palm)
export function PixelPaper({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M5 2h10v2H5zm0 18h14v2H5zM3 4h2v16H3zm12 0h2v4h-2zm2 4h2v12h-2z" fill="#00f0ff" />
        <rect x="5" y="4" width="10" height="16" fill="#162032" />
        <rect x="7" y="7" width="6" height="2" fill="#00f0ff" />
        <rect x="7" y="11" width="6" height="2" fill="#00f0ff" />
        <rect x="7" y="15" width="4" height="2" fill="#00f0ff" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Scissors (Blades)
export function PixelScissors({ size = 20, color = '#ff007f', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="3" y="15" width="6" height="6" fill="#ff007f" />
        <rect x="5" y="17" width="2" height="2" fill="#0c0e17" />
        <rect x="15" y="15" width="6" height="6" fill="#ff007f" />
        <rect x="17" y="17" width="2" height="2" fill="#0c0e17" />
        <rect x="11" y="11" width="2" height="2" fill="#ffffff" />
        <path d="M9 11h2v-2h2v2h-2z M8 8h2v-2h2v2h-2z M6 5h3v3H6zm9 0h3v3h-3z" fill="#ffffff" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Snake Icon
export function PixelSnake({ size = 20, color = '#39ff14', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Glowing food orb */}
        <rect x="4" y="5" width="4" height="4" fill="#ff007f" />
        <rect x="5" y="4" width="2" height="6" fill="#ff007f" />
        <rect x="5" y="5" width="2" height="2" fill="#ffffff" />
        {/* Snake body segments */}
        <path d="M12 3h7v6h-7z M19 5h3v2h-3z M15 9h4v4h-4z M7 11h10v4H7z M5 13h4v6H5z M7 17h10v3H7z M15 15h3v3h-3z" fill={color} />
        {/* Eye */}
        <rect x="16" y="4" width="2" height="2" fill="#0c0e17" />
        <rect x="16" y="4" width="1" height="1" fill="#ffffff" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Wordle / Letter Matrix Grid
export function PixelWordleGrid({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Row 1 - Correct & Present tiles */}
        <rect x="2" y="3" width="5" height="5" fill="#39ff14" />
        <rect x="9" y="3" width="5" height="5" fill="#39ff14" />
        <rect x="16" y="3" width="5" height="5" fill="#ffd166" />
        {/* Row 2 - Miss & Hit */}
        <rect x="2" y="10" width="5" height="5" fill="#2d3348" />
        <rect x="9" y="10" width="5" height="5" fill="#39ff14" />
        <rect x="16" y="10" width="5" height="5" fill="#2d3348" />
        {/* Row 3 - Solved All Green */}
        <rect x="2" y="17" width="5" height="5" fill="#39ff14" />
        <rect x="9" y="17" width="5" height="5" fill="#39ff14" />
        <rect x="16" y="17" width="5" height="5" fill="#39ff14" />
        {/* Pixel letter stems */}
        <path d="M4 4h1v3H4zm7 0h1v3h-1zm7 0h1v3h-1zM11 11h1v3h-1zM4 18h1v3H4zm7 0h1v3h-1zm7 0h1v3h-1z" fill="#0c0e17" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Playing Cards (Blackjack / Cyber 21)
export function PixelCards({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Back Card (Neon Accent) */}
        <rect x="9" y="2" width="12" height="15" fill="#ff007f" />
        <rect x="10" y="3" width="10" height="13" fill="#141724" />
        <rect x="13" y="6" width="4" height="7" fill="#ff007f" />
        <rect x="14" y="5" width="2" height="9" fill="#ff007f" />
        {/* Front Card (Ace of Cyber Diamonds/Spades) */}
        <rect x="3" y="6" width="13" height="16" fill="#ffffff" />
        <rect x="4" y="7" width="11" height="14" fill="#0d111a" />
        {/* 'A' */}
        <path d="M5 8h3v1H5zm0 1h1v2H5zm2 0h1v2H7zm-2 1h3v1H5z" fill="#ffd166" />
        {/* Cyber Spade/Heart Center */}
        <path d="M9 11h2v1H9zm-1 1h4v1H8zm-2 1h8v2H6zm3 2h2v2H9zm-1 2h4v1H8z" fill="#00f0ff" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Tic-Tac-Toe Grid
export function PixelTicTacToe({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Grid lines */}
        <rect x="8" y="2" width="2" height="20" fill="#4a5568" />
        <rect x="14" y="2" width="2" height="20" fill="#4a5568" />
        <rect x="2" y="8" width="20" height="2" fill="#4a5568" />
        <rect x="2" y="14" width="20" height="2" fill="#4a5568" />
        {/* Top-left X (Cyan) */}
        <path d="M3 3h2v1H3zm3 0h2v1H6zm1 1h1v1H7zm-2 1h2v1H5zm-1 1h1v1H4zm3 0h1v1H7zm-4 1h2v1H3zm3 0h2v1H6z" fill="#00f0ff" />
        {/* Center O (Neon Magenta) */}
        <path d="M10 10h4v1h-4zm-1 1h1v2H9zm5 0h1v2h-1zm-4 2h4v1h-4z" fill="#ff007f" />
        {/* Bottom-right X (Gold) */}
        <path d="M16 16h2v1h-2zm3 0h2v1h-2zm-1 1h2v1h-2zm-1 1h1v1h-1zm3 0h1v1h-1zm-4 1h2v1h-2zm3 0h2v1h-2z" fill="#ffd166" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Artist Palette (Pictionary / Sketch)
export function PixelPalette({ size = 20, color = '#ff007f', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Palette Board */}
        <path d="M7 2h10v2H7zm-3 2h3v2H4zm13 0h3v2h-3zM2 6h2v11H2zm18 0h2v7h-2zm-16 11h3v3H4zm12 0h4v2h-4zm-9 3h9v2H7z" fill="#ffd166" />
        <rect x="4" y="6" width="14" height="11" fill="#1b1d2a" />
        {/* Color Dabs */}
        <rect x="6" y="5" width="3" height="3" fill="#ff007f" />
        <rect x="11" y="4" width="3" height="3" fill="#00f0ff" />
        <rect x="15" y="7" width="3" height="3" fill="#39ff14" />
        <rect x="6" y="11" width="3" height="3" fill="#ff7700" />
        {/* Thumb Grip */}
        <rect x="13" y="12" width="3" height="3" fill="#0c0e17" />
        {/* Diagonal Stylus Brush */}
        <path d="M19 14h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v3h-2z" fill="#ffffff" />
        <rect x="13" y="20" width="2" height="3" fill="#ff007f" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Lucky Red Packet (Hongbao)
export function PixelRedPacket({ size = 20, color = '#ff3366', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Envelope Base */}
        <rect x="4" y="2" width="16" height="20" fill="#d90429" />
        <path d="M4 2h16v2H4zm0 18h16v2H4zM4 2h2v20H4zm14 0h2v20h-2z" fill="#9b001c" />
        {/* Fold Flap */}
        <path d="M4 4h16v2H4zm2 2h12v2H6zm2 2h8v2H8zm2 2h4v2h-4z" fill="#ff2a55" />
        {/* Gold Coin / Emblem */}
        <rect x="9" y="10" width="6" height="6" fill="#ffd166" />
        <rect x="10" y="9" width="4" height="8" fill="#ffd166" />
        <rect x="11" y="12" width="2" height="2" fill="#d90429" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Bar Chart (Ballot Polls)
export function PixelBarChart({ size = 20, color = '#39ff14', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Baseline Axis */}
        <rect x="2" y="20" width="20" height="2" fill="currentColor" opacity="0.6" />
        {/* Bar 1 */}
        <rect x="4" y="13" width="4" height="7" fill="#00f0ff" />
        {/* Bar 2 (Winner) */}
        <rect x="10" y="5" width="4" height="15" fill="#39ff14" />
        {/* Bar 3 */}
        <rect x="16" y="9" width="4" height="11" fill="#ffd166" />
        {/* Checkmark above winner */}
        <path d="M10 2h1v1h-1zm1 1h1v1h-1zm1-1h1v1h-1zm1-1h1v1h-1z" fill="#39ff14" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Digital Stopwatch / Bomb Timer
export function PixelTimer({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Top Button */}
        <rect x="10" y="1" width="4" height="2" fill="currentColor" />
        <rect x="11" y="3" width="2" height="2" fill="currentColor" />
        <rect x="17" y="4" width="2" height="2" fill="currentColor" />
        {/* Clock Body */}
        <path d="M8 5h8v2H8zm-3 2h3v2H5zm11 0h3v2h-3zM3 9h2v8H3zm16 0h2v8h-2zm-14 8h3v2H5zm11 0h3v2h-3zm-8 2h8v2H8z" fill="currentColor" />
        {/* Center & Hands */}
        <rect x="11" y="12" width="2" height="2" fill="#ff007f" />
        <rect x="11" y="8" width="2" height="4" fill="#00f0ff" />
        <rect x="13" y="12" width="4" height="2" fill="#00f0ff" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Retro Arcade Cabinet
export function PixelArcadeCabinet({ size = 20, color = '#ff007f', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        {/* Outer Cabinet Frame */}
        <path d="M5 2h14v2H5zm-1 2h16v18H4V4h1z" fill="#0f111a" />
        <path d="M4 2h16v2H4zm-1 2h2v19H3zm16 0h2v19h-2zm-16 19h18v2H3z" fill={color} />
        {/* Marquee Header */}
        <rect x="6" y="4" width="12" height="3" fill="#ff007f" />
        {/* CRT Screen */}
        <rect x="6" y="8" width="12" height="6" fill="#00f0ff" />
        <rect x="8" y="9" width="4" height="2" fill="#ffffff" />
        {/* Control Panel / Joystick */}
        <rect x="5" y="15" width="14" height="3" fill="#222738" />
        <rect x="8" y="14" width="2" height="2" fill="#ff5533" />
        <rect x="13" y="16" width="2" height="1" fill="#ffd166" />
        <rect x="16" y="16" width="2" height="1" fill="#39ff14" />
        {/* Coin Door */}
        <rect x="8" y="19" width="8" height="3" fill="#151824" />
        <rect x="11" y="20" width="2" height="1" fill="#ffd166" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Royal Crown
export function PixelCrown({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="3" y="18" width="18" height="3" fill="#ffd166" />
        <rect x="4" y="19" width="16" height="1" fill="#b38600" />
        <path d="M3 8h3v10H3z M9 5h6v13H9z M18 8h3v10h-3z" fill="#ffd166" />
        <path d="M6 14h3v4H6z M15 14h3v4h-3z" fill="#ffd166" />
        <rect x="4" y="6" width="1" height="2" fill="#ff007f" />
        <rect x="11" y="3" width="2" height="2" fill="#00f0ff" />
        <rect x="19" y="6" width="1" height="2" fill="#39ff14" />
        <rect x="7" y="19" width="2" height="1" fill="#ff007f" />
        <rect x="11" y="19" width="2" height="1" fill="#00f0ff" />
        <rect x="15" y="19" width="2" height="1" fill="#39ff14" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Party Popper / Confetti Burst
export function PixelParty({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 20h2v-2H4zm2-2h2v-2H6zm2-2h2v-2H8zm2-2h2v-2h-2zm2-2h2v-2h-2zm-8 4h2v2H4zm0-2h4v2H4zm0-2h6v2H4z" fill="#ffd166" />
        <path d="M2 21h3v1H2zm3-3h1v3H5z" fill="#ff5533" />
        <rect x="14" y="4" width="2" height="2" fill="#ff007f" />
        <rect x="18" y="2" width="2" height="2" fill="#39ff14" />
        <rect x="21" y="6" width="2" height="2" fill="#00f0ff" />
        <rect x="17" y="9" width="3" height="2" fill="#ffd166" />
        <rect x="13" y="12" width="2" height="2" fill="#39ff14" />
        <rect x="20" y="13" width="2" height="2" fill="#ff007f" />
        <rect x="15" y="16" width="2" height="2" fill="#00f0ff" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Laughing with Tears Face
export function PixelLaugh({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M7 2h10v2H7zm-3 2h3v2H4zm13 0h3v2h-3zM2 6h2v12H2zm18 0h2v12h-2zm-16 12h3v2H4zm13 0h3v2h-3zm-10 2h10v2H7z" fill="#ffd166" />
        <rect x="4" y="6" width="16" height="12" fill="#ffd166" />
        <path d="M5 8h2v1H5zm2 1h2v1H7zm-2 1h2v1H5zm8 0h2v1h-2zm2-1h2v1h-2zm-2-1h2v1h-2z" fill="#0c0e17" />
        <path d="M8 12h8v2H8zm1 2h6v2H9zm2 2h2v1h-2z" fill="#9b001c" />
        <rect x="9" y="12" width="6" height="1" fill="#ffffff" />
        <rect x="2" y="11" width="3" height="4" fill="#00f0ff" />
        <rect x="19" y="11" width="3" height="4" fill="#00f0ff" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Dungeon Key
export function PixelKey({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M5 3h6v2H5zm-2 2h2v6H3zm8 0h2v6h-2zm-6 6h6v2H5z" fill="#ffd166" />
        <rect x="6" y="6" width="2" height="2" fill="#0c0e17" />
        <rect x="11" y="6" width="10" height="2" fill="#ffd166" />
        <rect x="17" y="8" width="2" height="3" fill="#ffd166" />
        <rect x="20" y="8" width="2" height="4" fill="#ffd166" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Mana / Potion Flask
export function PixelPotion({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="9" y="2" width="6" height="2" fill="#d4a373" />
        <rect x="8" y="4" width="8" height="2" fill="#e2e8f0" />
        <rect x="10" y="6" width="4" height="3" fill="#e2e8f0" />
        <path d="M7 9h10v2H7zm-3 2h3v8H4zm13 0h3v8h-3zm-10 8h10v2H7z" fill="#e2e8f0" />
        <rect x="6" y="12" width="12" height="6" fill="#00f0ff" />
        <rect x="8" y="13" width="2" height="2" fill="#ffffff" />
        <rect x="14" y="15" width="2" height="2" fill="#39ff14" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Fuel Gas Pump
export function PixelGas({ size = 20, color = '#39ff14', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="4" y="4" width="10" height="17" fill="#39ff14" />
        <rect x="5" y="6" width="8" height="5" fill="#0c0e17" />
        <rect x="6" y="7" width="6" height="3" fill="#00f0ff" />
        <path d="M14 8h3v2h-3zm3 2h2v8h-2zm-1 8h2v2h-2zm-3 0h3v2h-3z" fill="#ffd166" />
        <rect x="18" y="6" width="3" height="4" fill="#ff5533" />
        <rect x="3" y="21" width="12" height="2" fill="#2d3748" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Handshake Deal
export function PixelHandshake({ size = 20, color = '#00f0ff', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="2" y="9" width="4" height="6" fill="#00f0ff" />
        <rect x="6" y="10" width="5" height="4" fill="#ffd166" />
        <rect x="18" y="9" width="4" height="6" fill="#ff007f" />
        <rect x="13" y="10" width="5" height="4" fill="#ffd166" />
        <rect x="10" y="12" width="4" height="4" fill="#d4a373" />
        <rect x="11" y="10" width="2" height="2" fill="#ffd166" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Warning Triangle
export function PixelWarning({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M11 2h2v2h-2zm-2 2h2v3H9zm-2 3h2v3H7zm-2 3h2v3H5zm-2 3h2v3H3zm-1 3h20v3H2zm19-3h2v3h-2zm-2-3h2v3h-2zm-2-3h2v3h-2zm-2-3h2v3h-2z" fill="#ffd166" />
        <polygon points="12,5 5,18 19,18" fill="#ffd166" opacity="0.25" />
        <rect x="11" y="8" width="2" height="5" fill="#0c0e17" />
        <rect x="11" y="15" width="2" height="2" fill="#0c0e17" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Sparkles / Magic Stars
export function PixelSparkles({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M10 2h2v4h-2zm0 8h2v4h-2zm-4-4h4v2H6zm6 0h4v2h-4z" fill="#ffd166" />
        <rect x="10" y="6" width="2" height="2" fill="#ffffff" />
        <rect x="3" y="14" width="2" height="2" fill="#00f0ff" />
        <rect x="2" y="15" width="4" height="1" fill="#00f0ff" />
        <rect x="3" y="14" width="1" height="3" fill="#00f0ff" />
        <rect x="18" y="14" width="2" height="2" fill="#ff007f" />
        <rect x="17" y="15" width="4" height="1" fill="#ff007f" />
        <rect x="18" y="14" width="1" height="3" fill="#ff007f" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Pencil / Stylus
export function PixelPencil({ size = 20, color = '#ffd166', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M16 2h6v6h-2V6h-2V4h-2z" fill="#ff007f" />
        <path d="M14 4h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2H8zm-2 2h2v2H6zm-2 2h2v2H4z" fill="#ffd166" />
        <path d="M2 20h2v2H2zm2-2h2v2H4z" fill="#e2e8f0" />
        <rect x="2" y="21" width="1" height="1" fill="#0c0e17" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Unlocked Chest
export function PixelUnlock({ size = 20, color = '#39ff14', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <path d="M10 2h6v2h-6zm-2 2h2v4H8z" fill="#39ff14" />
        <rect x="4" y="8" width="16" height="13" fill="#ffd166" />
        <rect x="6" y="10" width="12" height="9" fill="#0c0e17" />
        <rect x="11" y="13" width="2" height="3" fill="#39ff14" />
      </svg>
    </span>
  );
}

// 8-Bit Pixel Circle / Ring (for Tic-Tac-Toe O and arcade discs)
export function PixelCircle({ size = 20, color = '#ff007f', style = {}, ...props }) {
  return (
    <span className="pixel-icon-wrap" style={{ display: 'inline-flex', width: size, height: size, color, ...style }} {...props}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={{ shapeRendering: 'crispEdges' }}>
        <rect x="8" y="2" width="8" height="2" fill={color} />
        <rect x="8" y="20" width="8" height="2" fill={color} />
        <rect x="4" y="4" width="4" height="2" fill={color} />
        <rect x="16" y="4" width="4" height="2" fill={color} />
        <rect x="4" y="18" width="4" height="2" fill={color} />
        <rect x="16" y="18" width="4" height="2" fill={color} />
        <rect x="2" y="8" width="2" height="8" fill={color} />
        <rect x="20" y="8" width="2" height="8" fill={color} />
        <rect x="4" y="6" width="2" height="2" fill={color} />
        <rect x="18" y="6" width="2" height="2" fill={color} />
        <rect x="4" y="16" width="2" height="2" fill={color} />
        <rect x="18" y="16" width="2" height="2" fill={color} />
      </svg>
    </span>
  );
}

// Universal 8-Bit Pixel Emoji Component
export function PixelEmoji({ char, size = 18, className = '', style = {}, ...props }) {
  if (!char) return null;
  const clean = String(char).trim();

  switch (clean) {
    case '❤️': case '❤': case '💖': case '💗': case '💓': case '💕':
      return <PixelHeart size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '👍':
      return <PixelThumbsUp size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '👎':
      return <PixelThumbsUp size={size} color="#ff007f" className={className} style={{ transform: 'rotate(180deg)', ...style }} {...props} />;
    case '🔥':
      return <PixelFire size={size} color="#ff5533" className={className} style={style} {...props} />;
    case '😂': case '🤣':
      return <PixelLaugh size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🎉': case '🎊':
      return <PixelParty size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '⭐': case '★':
      return <PixelStar size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🪙':
      return <PixelCoin size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '⚡':
      return <PixelZap size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '💎':
      return <PixelGem size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '👾':
      return <PixelAlien size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '🤖':
      return <PixelRobot size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '👻':
      return <PixelGhost size={size} color="#c5d1eb" className={className} style={style} {...props} />;
    case '💀': case '☠️': case '☠':
      return <PixelSkull size={size} color="#ffffff" className={className} style={style} {...props} />;
    case '🚀':
      return <PixelRocket size={size} color="#ff7700" className={className} style={style} {...props} />;
    case '🏆':
      return <PixelTrophy size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🎮':
      return <PixelGamepad size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '🕹️': case '🕹':
      return <PixelArcadeCabinet size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '🛡️': case '🛡':
      return <PixelShield size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '🔒': case '🔐':
      return <PixelLock size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🔓':
      return <PixelUnlock size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '⚔️': case '⚔':
      return <PixelSwords size={size} color="#ff5533" className={className} style={style} {...props} />;
    case '✊':
      return <PixelRock size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '✋':
      return <PixelPaper size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '✌️': case '✌':
      return <PixelScissors size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '🎲':
      return <PixelDice size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '⏳': case '⌛':
      return <PixelHourglass size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '⏱️': case '⏱':
      return <PixelTimer size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🎁':
      return <PixelGift size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '👑':
      return <PixelCrown size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🔑':
      return <PixelKey size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🧪':
      return <PixelPotion size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '☕':
      return <PixelCoffee size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '⚠️': case '⚠':
      return <PixelWarning size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '⛽':
      return <PixelGas size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '🤝':
      return <PixelHandshake size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '💸': case '💰': case '💵':
      return <PixelDollar size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '🧧':
      return <PixelRedPacket size={size} color="#ff3366" className={className} style={style} {...props} />;
    case '📊': case '📈': case '📉':
      return <PixelBarChart size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '🐍':
      return <PixelSnake size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '🟩':
      return <PixelWordleGrid size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '🃏': case '🎴':
      return <PixelCards size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🎨':
      return <PixelPalette size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '📷':
      return <PixelCamera size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '👁️': case '👁':
      return <PixelEye size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '✏️': case '✏': case '✎':
      return <PixelPencil size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🔔':
      return <PixelBell size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '😀': case '😃': case '😄':
      return <PixelSmile size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '😁': case '😆':
      return <PixelGrin size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '😉':
      return <PixelWink size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '😎':
      return <PixelCool size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '❌': case '✕': case 'X': case 'x':
      return <PixelClose size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '⭕': case '◯': case 'O': case 'o':
      return <PixelCircle size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '✅': case '✓': case '✔':
      return <PixelCheck size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '✨':
      return <PixelSparkles size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '➕': case '+':
      return <PixelPlus size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '➖': case '-':
      return <PixelMinus size={size} color="#8b9bb4" className={className} style={style} {...props} />;
    case '📞':
      return <PixelPhone size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '📹':
      return <PixelVideo size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '🎙️': case '🎙': case '🎤':
      return <PixelMic size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🗑️': case '🗑':
      return <PixelTrash size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '📌':
      return <PixelPin size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '💬':
      return <PixelMessage size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '👤':
      return <PixelUser size={size} color="currentColor" className={className} style={style} {...props} />;
    case '♠':
      return <PixelSpade size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '♥':
      return <PixelHeartSuit size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '♦':
      return <PixelDiamondSuit size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '♣':
      return <PixelClub size={size} color="#39ff14" className={className} style={style} {...props} />;
    case '🟨':
      return <PixelWordleGrid size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '⬛':
      return <PixelWordleGrid size={size} color="#2b3245" className={className} style={style} {...props} />;
    case '❓':
      return <PixelQuestion size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '💾':
      return <PixelFloppy size={size} color="#00f0ff" className={className} style={style} {...props} />;
    case '🧾':
      return <PixelReceipt size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🎵': case '🎶':
      return <PixelMusic size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '🏁': case '🚩':
      return <PixelFlag size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🎯':
      return <PixelTarget size={size} color="#ff007f" className={className} style={style} {...props} />;
    case '😡': case '😠':
      return <PixelAngry size={size} color="#ff3366" className={className} style={style} {...props} />;
    case '👋':
      return <PixelWave size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '☀️': case '☀':
      return <PixelSun size={size} color="#ffd166" className={className} style={style} {...props} />;
    case '🌙':
      return <PixelMoon size={size} color="#00f0ff" className={className} style={style} {...props} />;
    default:
      return (
        <span
          className={`arcade-pixel-emoji ${className}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size,
            lineHeight: 1,
            imageRendering: 'pixelated',
            filter: 'contrast(160%) brightness(110%)',
            textShadow: '1px 1px 0px #000, -1px -1px 0px #000',
            fontFamily: 'var(--font-arcade)',
            ...style
          }}
          {...props}
        >
          {clean}
        </span>
      );
  }
}

// Parses string containing emojis and replaces them with 8-bit PixelEmoji components
export function renderPixelText(text, size = 18) {
  if (!text || typeof text !== 'string') return text;
  const emojiRegex = /((?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]|\u{200D})(?:\u{FE0F})?|[★✓✕◯♠♥♦♣❓])/gu;
  const parts = text.split(emojiRegex);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.match(emojiRegex)) {
      return <PixelEmoji key={i} char={part} size={size} style={{ verticalAlign: 'middle', margin: '0 2px' }} />;
    }
    return part;
  });
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
