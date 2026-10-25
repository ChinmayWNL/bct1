'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import {
  USER_REGISTRY_ABI,
  DEFAULT_USER_REGISTRY_ADDRESS,
  getUserRegistryAddress,
  ARCADE_DUEL_ESCROW_ABI,
  getDuelEscrowAddress,
  TIME_CAPSULE_VAULT_ABI,
  getTimeCapsuleVaultAddress,
  INVOICE_MANAGER_ABI,
  getInvoiceManagerAddress,
  GIFT_PACKET_VAULT_ABI,
  getGiftPacketVaultAddress,
  POLL_REGISTRY_ABI,
  getPollRegistryAddress
} from './contracts';
import VoiceNotePlayer from '@/components/VoiceNotePlayer';
import HeroDashboard from '@/components/HeroDashboard';
import SendCryptoModal from '@/components/SendCryptoModal';
import QRCodeModal from '@/components/QRCodeModal';
import EmojiPicker from '@/components/EmojiPicker';
import ProfileModal from '@/components/ProfileModal';
import CryptoReceipt from '@/components/CryptoReceipt';
import CallModal from '@/components/CallModal';
import IncomingCallModal from '@/components/IncomingCallModal';
import ContactInfoDrawer from '@/components/ContactInfoDrawer';
import CoffeeThemeModal from '@/components/CoffeeThemeModal';
import PixelCoinBurst from '@/components/PixelCoinBurst';
import LevelUpToast from '@/components/LevelUpToast';
import PlayfairLockModal from '@/components/PlayfairLockModal';
import ArcadeDuelCard, { determineRpsWinner } from '@/components/ArcadeDuelCard';
import ArcadeActivitiesModal from '@/components/ArcadeActivitiesModal';
import CyberSnakeModal from '@/components/activities/CyberSnakeModal';
import CyberWordleModal from '@/components/activities/CyberWordleModal';
import CyberBlackjackModal from '@/components/activities/CyberBlackjackModal';
import PixelSketchModal from '@/components/activities/PixelSketchModal';
import SketchGuessCard from '@/components/activities/SketchGuessCard';
import SnakeChallengeCard from '@/components/activities/SnakeChallengeCard';
import TicTacToeCard, { checkTicTacToeWinner } from '@/components/TicTacToeCard';
import TimeCapsuleCard from '@/components/TimeCapsuleCard';
import TimeCapsuleModal from '@/components/TimeCapsuleModal';
import CopilotPalette from '@/components/CopilotPalette';
import CopilotWidgetCard from '@/components/CopilotWidgetCard';
import PollCard from '@/components/PollCard';
import GiftPacketCard from '@/components/GiftPacketCard';
import CreateGroupModal from '@/components/CreateGroupModal';
import GroupMembersModal from '@/components/GroupMembersModal';
import MobileArcadeHub from '@/components/MobileArcadeHub';
import MobileHeaderMenu from '@/components/MobileHeaderMenu';
import { applyInteraction, giftClaimList, buildChatExport, downloadTextFile } from '@/utils/interactions';
import {
  executeCoinFlip,
  executeDiceRoll,
  fetchLiveGas,
  fetchCryptoPrice,
  getRandomTrivia
} from '@/utils/copilotEngine';
import { getArcadeRank, loadStoredXp, saveStoredXp } from '@/utils/arcadeXp';
import {
  PixelRobot,
  PixelQr,
  PixelGamepad,
  PixelVolume,
  PixelMute,
  PixelMore,
  PixelPhone,
  PixelVideo,
  PixelSearch,
  PixelPin,
  PixelSmile,
  PixelClip,
  PixelCoin,
  PixelMic,
  PixelTrash,
  PixelSend,
  PixelShield,
  PixelLock,
  PixelSwords,
  PixelHourglass,
  PixelDice,
  PixelChest,
  PixelTerminal,
  PixelAlien
} from '@/components/PixelIcons';
import { renderWhatsAppMarkdown } from '@/utils/whatsappMarkdown';
import {
  encryptPlayfair,
  decryptPlayfair,
  isPlayfairEnvelope,
  getPlayfairCipherText,
  hashPlayfairKey,
  screenKeyFromHash
} from '@/utils/playfairCipher';

// Auto-lock unlocked cipher chats after this much inactivity
const CIPHER_IDLE_LOCK_MS = 3 * 60 * 1000;
// Pure Utility Functions
function formatAddress(address) {
  if (!address) return '';
  if (address.startsWith('0x') && address.length === 42) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  if (address.length > 12) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  return address;
}

function parseMessageData(msg) {
  if (!msg) return { type: 'text', text: '' };
  if (typeof msg.content === 'string') {
    if (msg.content.startsWith('[JSON_MSG]')) {
      try {
        return JSON.parse(msg.content.replace('[JSON_MSG]', ''));
      } catch (e) {
        return { type: 'text', text: msg.content };
      }
    }
    return { type: 'text', text: msg.content };
  }
  if (msg.content && msg.content.text) return { type: 'text', text: msg.content.text };
  if (msg.content && msg.content.content) return { type: 'text', text: String(msg.content.content) };
  return { type: 'system', text: 'System update' };
}

function formatMessageTime(dateObj) {
  if (!dateObj) return '';
  const date = new Date(dateObj);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDiscordMessageTime(dateObj) {
  if (!dateObj) return 'Today at ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const date = new Date(dateObj);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today at ${timeStr}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${timeStr}`;
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${timeStr}`;
}

function formatRecordingTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function Home() {
  // Generate or retrieve encryption key for local XMTP DB
  const getDbEncryptionKey = () => {
    let keyStr = typeof window !== 'undefined' ? localStorage.getItem('xmtp_db_key') : null;
    if (keyStr) {
      return new Uint8Array(keyStr.split(',').map(Number));
    }
    const key = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(key);
      localStorage.setItem('xmtp_db_key', key.join(','));
    }
    return key;
  };

  // Main Web3 & Messaging State
  const [walletAddress, setWalletAddress] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [userBalance, setUserBalance] = useState('0.0000');
  const [networkName, setNetworkName] = useState('');
  const [ensName, setEnsName] = useState('');
  const [xmtpClient, setXmtpClient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const activeStreamIdRef = useRef(0);

  // Tabs & Pinning State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pinned'
  const [pinnedConvos, setPinnedConvos] = useState({});

  // WhatsApp-Inspired Features State
  const [activeCall, setActiveCall] = useState(null); // null | { type: 'voice' | 'video', callId, isOutgoing }
  const [incomingCall, setIncomingCall] = useState(null); // null | { callType, callId, offer, callerAddress }
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [starredMessages, setStarredMessages] = useState({});
  const [disappearingTimer, setDisappearingTimer] = useState(0);
  const [isChatMuted, setIsChatMuted] = useState(false);

  // Modals & Popovers State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSendCryptoModal, setShowSendCryptoModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);

  // Phase 1 Unique Features: Duels, Time Capsules & Copilot
  const [showTimeCapsuleModal, setShowTimeCapsuleModal] = useState(false);
  const [showCopilotPalette, setShowCopilotPalette] = useState(false);
  const activeDuelCommitmentsRef = useRef({});
  const [openedCapsulesMap, setOpenedCapsulesMap] = useState({});

  // Arcade Activities Suite State (Discord-style activities)
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showSnakeModal, setShowSnakeModal] = useState(false);
  const [showWordleModal, setShowWordleModal] = useState(false);
  const [showBlackjackModal, setShowBlackjackModal] = useState(false);
  const [showSketchModal, setShowSketchModal] = useState(false);
  // On-chain invoice status keyed by onChainInvoiceId: { paidCount, maxPayers, cancelled, paidByMe }
  const [invoiceStatus, setInvoiceStatus] = useState({});
  // On-chain gift packet status keyed by onChainPacketId: { claimedCount, slots, expiresAt, refunded, remaining, claims, mine }
  const [giftStatus, setGiftStatus] = useState({});
  // On-chain poll status keyed by onChainPollId: { counts, total, closed, closesAt, myVote }
  const [pollStatus, setPollStatus] = useState({});

  // XMTP Groups State
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  // Mobile UI Action Hub & Header Menu States
  const [showMobileArcadeHub, setShowMobileArcadeHub] = useState(false);
  const [showMobileHeaderMenu, setShowMobileHeaderMenu] = useState(false);
  // groupMembersCache: { [convoId]: GroupMember[] } – cached after first load
  const [groupMembersCache, setGroupMembersCache] = useState({});

  // Advanced Features State (Replies, Attachments, Lightbox, Reactions)
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);
  const [showReactionModal, setShowReactionModal] = useState(null);
  const [reactionsMap, setReactionsMap] = useState({});
  const reactionUsersMapRef = useRef({});
  // Poll votes & gift claims: { [targetId]: { [voterKey]: { kind, choice, ts } } }
  const [interactions, setInteractions] = useState({});

  // Register the PWA service worker (production only)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Edit & Delete State
  const [editingMessage, setEditingMessage] = useState(null);
  const [deletedMessages, setDeletedMessages] = useState({});
  const [editedMessages, setEditedMessages] = useState({});

  // Voice Notes State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // On-Chain Profile State
  const [userProfile, setUserProfile] = useState({ username: '', profilePictureCID: '', isRegistered: false });
  const [profileFormUsername, setProfileFormUsername] = useState('');
  const [profileFormAvatar, setProfileFormAvatar] = useState('');
  const [profileContractAddress, setProfileContractAddress] = useState(DEFAULT_USER_REGISTRY_ADDRESS);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [addressProfiles, setAddressProfiles] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Arcade Cabinet Themes & Audio Preferences State
  const [coffeeTheme, setCoffeeTheme] = useState('arcade');
  const [wallpaperOpacity, setWallpaperOpacity] = useState('balanced');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Arcade Progression & Celebration States
  const [arcadeXp, setArcadeXp] = useState(50);
  const [coinBurstEvent, setCoinBurstEvent] = useState(null);
  const [levelUpEvent, setLevelUpEvent] = useState(null);

  const arcadeRank = useMemo(() => getArcadeRank(arcadeXp), [arcadeXp]);

  useEffect(() => {
    setArcadeXp(loadStoredXp());
  }, []);

  // 1. Custom Nicknames Address Book
  const [customNicknames, setCustomNicknames] = useState({});

  // Group Avatars Store (persisted locally and synced with XMTP group imageUrl)
  const [groupAvatars, setGroupAvatars] = useState({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem('blockchat_group_avatars');
      if (saved) setGroupAvatars(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleUpdateGroupAvatar = async (groupId, avatarUrl) => {
    const clean = (avatarUrl || '').trim();
    setGroupAvatars(prev => {
      const updated = { ...prev, [groupId]: clean };
      try {
        localStorage.setItem('blockchat_group_avatars', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (activeConversation && activeConversation.id === groupId) {
      activeConversation.imageUrl = clean;
      if (typeof activeConversation.updateImageUrl === 'function') {
        try {
          await activeConversation.updateImageUrl(clean);
        } catch (e) {
          console.warn('Could not update XMTP group imageUrl', e);
        }
      }
      setConversations(prev => [...prev]);
    }
  };

  // 2. Per-Chat Drafts Memory
  const [chatDrafts, setChatDrafts] = useState({});
  const chatDraftsRef = useRef({});
  const activeConversationRef = useRef(null);

  useEffect(() => {
    chatDraftsRef.current = chatDrafts;
  }, [chatDrafts]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Latest-value refs so long-lived XMTP stream callbacks never act on stale state
  const messagesRef = useRef([]);
  const handleRevealDuelMoveRef = useRef(null);
  const revealingDuelsRef = useRef(new Set());
  const sentTxHashesRef = useRef(new Set());
  const walletAddressRef = useRef(walletAddress);
  const providerRef = useRef(provider);
  const signerRef = useRef(signer);
  const chainIdRef = useRef(chainId);

  useEffect(() => { walletAddressRef.current = walletAddress; }, [walletAddress]);
  useEffect(() => { providerRef.current = provider; }, [provider]);
  useEffect(() => { signerRef.current = signer; }, [signer]);
  useEffect(() => { chainIdRef.current = chainId; }, [chainId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Restore client preferences and commitments after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const storedPinned = localStorage.getItem('blockchat_pinned_convos');
      if (storedPinned) setPinnedConvos(JSON.parse(storedPinned));

      const storedStarred = localStorage.getItem('blockchat_starred_msgs');
      if (storedStarred) setStarredMessages(JSON.parse(storedStarred));

      const storedTimer = localStorage.getItem('blockchat_disappearing_timer');
      if (storedTimer) setDisappearingTimer(Number(storedTimer));

      const storedNicks = localStorage.getItem('blockchat_custom_nicknames');
      if (storedNicks) setCustomNicknames(JSON.parse(storedNicks));

      const storedUnread = localStorage.getItem('blockchat_unread_counts');
      if (storedUnread) setUnreadCounts(JSON.parse(storedUnread));

      const storedKnown = localStorage.getItem('blockchat_known_contacts');
      if (storedKnown) setKnownContacts(JSON.parse(storedKnown));

      const storedCipher = localStorage.getItem('blockchat_playfair_settings');
      if (storedCipher) setCipherSettings(JSON.parse(storedCipher));

      const rawCommits = localStorage.getItem('blockchat_duel_commits');
      if (rawCommits) {
        activeDuelCommitmentsRef.current = { ...JSON.parse(rawCommits), ...activeDuelCommitmentsRef.current };
      }
    } catch (e) {
      console.warn("Failed to restore local preferences", e);
    }
  }, []);

  // 3. Real Unread Counts Matrix
  const [unreadCounts, setUnreadCounts] = useState({});

  // 4. Known Contacts for Safety Warning Banner
  const [knownContacts, setKnownContacts] = useState({});
  const [dismissedSafetyBanners, setDismissedSafetyBanners] = useState({});

  // 6. Playfair Cipher Chat Lock
  // Per-chat settings are persisted ({ [convoId]: { keyHash, encryptOutgoing } }), but the key
  // itself only lives in memory while a chat is unlocked, so a reload or idle timeout re-locks it.
  const [cipherSettings, setCipherSettings] = useState({});
  const [cipherKeys, setCipherKeys] = useState({});
  const [showCipherModal, setShowCipherModal] = useState(false);
  const cipherKeysRef = useRef({});

  useEffect(() => {
    cipherKeysRef.current = cipherKeys;
  }, [cipherKeys]);

  // 5. Crypto Modal Presets (for 1-click Pay Request)
  const [cryptoModalPreset, setCryptoModalPreset] = useState({
    mode: 'send',
    amount: '',
    note: '',
    requestId: null
  });

  // Helpers for Nicknames and Safety
  const getContactDisplayName = (addr, defaultProfile) => {
    if (!addr) return 'Peer';
    const key = addr.toLowerCase();
    if (customNicknames[key]) {
      return customNicknames[key];
    }
    if (defaultProfile?.username) {
      return `@${defaultProfile.username}`;
    }
    if (addressProfiles[key]?.username) {
      return `@${addressProfiles[key].username}`;
    }
    return formatAddress(addr);
  };

  const handleSaveNickname = (peerAddr, nickname) => {
    if (!peerAddr) return;
    const key = peerAddr.toLowerCase();
    const updated = { ...customNicknames };
    if (nickname && nickname.trim()) {
      updated[key] = nickname.trim();
    } else {
      delete updated[key];
    }
    setCustomNicknames(updated);
    try {
      localStorage.setItem('blockchat_custom_nicknames', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleDismissSafetyBanner = (peerAddr) => {
    if (!peerAddr) return;
    const key = peerAddr.toLowerCase();
    setDismissedSafetyBanners(prev => ({ ...prev, [key]: true }));
    setKnownContacts(prev => {
      const updated = { ...prev, [key]: true };
      try { localStorage.setItem('blockchat_known_contacts', JSON.stringify(updated)); } catch(e){}
      return updated;
    });
  };

  // Playfair Cipher Helpers
  const activeCipherSetting = activeConversation ? cipherSettings[activeConversation.id] : null;
  const activeCipherKey = activeConversation ? cipherKeys[activeConversation.id] : null;
  const isCipherLocked = !!activeCipherSetting?.keyHash && !activeCipherKey;
  const isEncryptingOutgoing = !!activeCipherSetting?.keyHash && !!activeCipherSetting?.encryptOutgoing && !!activeCipherKey;

  const isChatLocked = (convoId) => !!convoId && !!cipherSettings[convoId]?.keyHash && !cipherKeys[convoId];

  // Show message text readable when its chat is unlocked. While a cipher chat is locked the whole
  // history is scrambled: encrypted messages show their real ciphertext, and older plain messages
  // are scrambled with the screen key so nothing in the chat is readable.
  const revealText = (text, convoId = activeConversation?.id) => {
    if (!text || typeof text !== 'string') return text;
    const key = convoId ? cipherKeys[convoId] : null;
    if (isPlayfairEnvelope(text)) {
      return key ? decryptPlayfair(text, key) : getPlayfairCipherText(text);
    }
    if (isChatLocked(convoId)) {
      return getPlayfairCipherText(encryptPlayfair(text, screenKeyFromHash(cipherSettings[convoId].keyHash)));
    }
    return text;
  };

  const sealText = (text) => (isEncryptingOutgoing && text ? encryptPlayfair(text, activeCipherKey) : text);

  const persistCipherSettings = (updated) => {
    setCipherSettings(updated);
    try {
      localStorage.setItem('blockchat_playfair_settings', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSetupCipherKey = async (key) => {
    if (!activeConversation) return;
    const convoId = activeConversation.id;
    const keyHash = await hashPlayfairKey(key, convoId);
    persistCipherSettings({ ...cipherSettings, [convoId]: { keyHash, encryptOutgoing: true } });
    setCipherKeys(prev => ({ ...prev, [convoId]: key }));
    setShowCipherModal(false);
    addArcadeXp(25, 'Chat Cipher Enabled');
  };

  const handleUnlockCipher = async (key) => {
    if (!activeConversation) return false;
    const convoId = activeConversation.id;
    const keyHash = await hashPlayfairKey(key, convoId);
    if (keyHash !== cipherSettings[convoId]?.keyHash) return false;
    setCipherKeys(prev => ({ ...prev, [convoId]: key }));
    setShowCipherModal(false);
    return true;
  };

  const lockAllCiphers = () => {
    setCipherKeys({});
    setShowCipherModal(false);
    setEditingMessage(null);
  };

  const handleToggleEncryptOutgoing = (enabled) => {
    if (!activeConversation) return;
    const convoId = activeConversation.id;
    persistCipherSettings({ ...cipherSettings, [convoId]: { ...cipherSettings[convoId], encryptOutgoing: enabled } });
  };

  const handleResetCipherKey = () => {
    if (!activeConversation) return;
    const convoId = activeConversation.id;
    const updated = { ...cipherSettings };
    delete updated[convoId];
    persistCipherSettings(updated);
    setCipherKeys(prev => {
      const next = { ...prev };
      delete next[convoId];
      return next;
    });
    setShowCipherModal(false);
  };

  // Auto-lock unlocked chats after a period of no activity (e.g. you walked away)
  const hasUnlockedCipher = Object.keys(cipherKeys).length > 0;
  useEffect(() => {
    if (!hasUnlockedCipher) return;
    let timer = setTimeout(() => setCipherKeys({}), CIPHER_IDLE_LOCK_MS);
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setCipherKeys({}), CIPHER_IDLE_LOCK_MS);
    };
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [hasUnlockedCipher]);

  const handlePayRequest = async (req) => {
    // On-chain invoices are settled through the InvoiceManager contract
    if (req.onChainInvoiceId) {
      try {
        await handlePayOnChainInvoice(req);
      } catch (err) {
        alert('Could not pay invoice: ' + (err.reason || err.shortMessage || err.message));
      }
      return;
    }
    // Legacy off-chain request (messages created before InvoiceManager existed)
    setCryptoModalPreset({
      mode: 'send',
      amount: req.amount || '',
      note: `Paying invoice: ${req.note || 'Payment'}`,
      requestId: req.requestId || req.id
    });
    setShowSendCryptoModal(true);
  };

  // Reusable helper to broadcast JSON messages over XMTP or simulate in Demo Bot
  const broadcastJsonPayload = async (payload, previewText = '') => {
    if (!activeConversation) return;
    const textPayload = `[JSON_MSG]${JSON.stringify(payload)}`;
    if (activeConversation.isDemoBot) {
      const demoMsg = {
        id: `demo-${payload.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderInboxId: xmtpClient?.inboxId || 'user-inbox',
        sentAt: new Date().toISOString(),
        content: textPayload
      };
      setMessages(prev => [...prev, demoMsg]);
      triggerBotReply(previewText, payload.type, payload);
    } else {
      await activeConversation.sendText(textPayload);
    }
    playSendPop();
  };

  // Copilot Slash Command Executors
  const executeSlashFlip = async () => {
    const flipData = executeCoinFlip();
    const payload = {
      type: 'copilot_widget',
      widgetType: 'flip',
      result: flipData.result,
      entropy: flipData.entropy,
      timestamp: flipData.timestamp
    };
    await broadcastJsonPayload(payload, `Flipped a coin: ${flipData.result}!`);
    playCoinClink();
    addArcadeXp(10, 'Coin Flip');
  };

  const executeSlashRoll = async (sides = 6) => {
    const rollData = executeDiceRoll(sides);
    const payload = {
      type: 'copilot_widget',
      widgetType: 'roll',
      sides: rollData.sides,
      result: rollData.result,
      isCrit: rollData.isCrit,
      isFumble: rollData.isFumble,
      timestamp: rollData.timestamp
    };
    await broadcastJsonPayload(payload, `Rolled D${rollData.sides}: ${rollData.result}`);
    playReceiveChime();
    addArcadeXp(10, 'Dice Roll');
  };

  const executeSlashGas = async () => {
    const gasData = await fetchLiveGas();
    const payload = {
      type: 'copilot_widget',
      widgetType: 'gas',
      networks: gasData.networks,
      timestamp: gasData.timestamp
    };
    await broadcastJsonPayload(payload, 'Checked multi-chain gas matrix');
    playReceiveChime();
    addArcadeXp(10, 'Gas Matrix Check');
  };

  const executeSlashPrice = async (symbol = 'eth') => {
    const priceData = await fetchCryptoPrice(symbol);
    const payload = {
      type: 'copilot_widget',
      widgetType: 'price',
      symbol: priceData.symbol,
      priceUsd: priceData.priceUsd,
      change24h: priceData.change24h,
      timestamp: priceData.timestamp
    };
    await broadcastJsonPayload(payload, `${priceData.symbol} price quote`);
    playReceiveChime();
    addArcadeXp(10, 'Price Lookup');
  };

  const executeSlashTrivia = async () => {
    const trivData = getRandomTrivia();
    const payload = {
      type: 'copilot_widget',
      widgetType: 'trivia',
      id: trivData.id,
      question: trivData.question,
      options: trivData.options,
      answerIndex: trivData.answerIndex,
      hint: trivData.hint,
      timestamp: Date.now()
    };
    await broadcastJsonPayload(payload, 'Spawned a cypher trivia challenge');
    playReceiveChime();
    addArcadeXp(15, 'Trivia Challenge Spawned');
  };

  // 1v1 Arcade Duel Handlers
  const handleSendDuelChallenge = async (wagerAmount = '0') => {
    if (!activeConversation) return;
    const duelId = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const payload = {
      type: 'arcade_duel',
      action: 'challenge',
      duelId,
      game: 'rps',
      challenger: walletAddress || (userProfile?.username ? `@${userProfile.username}` : 'Player 1'),
      challengerInboxId: xmtpClient?.inboxId || 'user-inbox',
      opponent: activeConversation.peerAddress || 'Player 2',
      opponentInboxId: activeConversation.peerAddress || 'peer-inbox',
      wagerAmount: wagerAmount || '0',
      status: 'waiting_challenger_pick',
      timestamp: Date.now()
    };

    await broadcastJsonPayload(payload, 'Initiated a Cypher RPS Duel! ⚔️');
    addArcadeXp(10, 'Duel Challenge Created');
  };

  const handleLockChallengerMove = async (duelId, moveId) => {
    if (!activeConversation) return;
    const chosenMove = moveId.toLowerCase();
    const salt = ethers.hexlify(ethers.randomBytes(8));
    const moveMap = { rock: 1, paper: 2, scissors: 3 };
    const moveNum = moveMap[chosenMove] || 1;
    const commitHash = ethers.solidityPackedKeccak256(["uint8", "string", "string"], [moveNum, ":", salt]);

    // Check if this duel has a wager and signer is available for on-chain escrow
    let onChainDuelId = null;
    let createTxHash = null;
    let isOnChain = false;

    const existingMsg = messages.find(m => parseMessageData(m).duelId === duelId);
    const existingData = existingMsg ? parseMessageData(existingMsg) : null;
    const wagerAmount = existingData?.wagerAmount || '0';

    if (signer && !activeConversation.isDemoBot && parseFloat(wagerAmount) > 0) {
      try {
        const escrowAddr = getDuelEscrowAddress(chainId);
        const contract = new ethers.Contract(escrowAddr, ARCADE_DUEL_ESCROW_ABI, signer);
        const tx = await contract.createDuel(commitHash, { value: ethers.parseEther(wagerAmount) });
        createTxHash = tx.hash;
        const receipt = await tx.wait();
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'DuelCreated') {
              onChainDuelId = parsed.args.duelId.toString();
              isOnChain = true;
              break;
            }
          } catch {}
        }
      } catch (err) {
        console.warn("On-chain duel escrow transaction bypassed / failed:", err.message);
      }
    }

    // Store secret commitment locally
    activeDuelCommitmentsRef.current[duelId] = {
      choice: chosenMove,
      salt,
      commitHash,
      onChainDuelId,
      isOnChain
    };
    try {
      localStorage.setItem('blockchat_duel_commits', JSON.stringify(activeDuelCommitmentsRef.current));
    } catch (e) {}

    // Update message state locally immediately so challenger sees their locked state
    setMessages(prev => prev.map(m => {
      const d = parseMessageData(m);
      if (d.type === 'arcade_duel' && d.duelId === duelId) {
        return {
          ...m,
          content: `[JSON_MSG]${JSON.stringify({
            ...d,
            challengerChoice: chosenMove,
            commitHash,
            onChainDuelId: onChainDuelId || d.onChainDuelId,
            createTxHash: createTxHash || d.createTxHash,
            isOnChain: isOnChain || d.isOnChain,
            status: 'waiting_opponent'
          })}`
        };
      }
      return m;
    }));

    playCoinClink();
    addArcadeXp(15, 'Duel Hand Locked');

    if (activeConversation.isDemoBot) {
      // In Demo Bot mode, trigger BlockBot's move!
      triggerBotReply('', 'arcade_duel_turn', { duelId, userChoice: chosenMove });
    } else {
      // Broadcast over XMTP
      const payload = {
        type: 'arcade_duel',
        action: 'challenger_committed',
        duelId,
        challenger: existingData?.challenger || walletAddress,
        challengerInboxId: existingData?.challengerInboxId || xmtpClient?.inboxId,
        opponent: existingData?.opponent || activeConversation.peerAddress,
        opponentInboxId: existingData?.opponentInboxId || activeConversation.peerAddress,
        commitHash,
        onChainDuelId,
        createTxHash,
        isOnChain,
        status: 'waiting_opponent',
        timestamp: Date.now()
      };
      await broadcastJsonPayload(payload, 'Locked in secret hand! 🔒');
    }
  };

  const handleRespondDuelMove = async (duelId, moveId) => {
    if (!activeConversation) return;
    const existingMsg = messages.find(m => parseMessageData(m).duelId === duelId);
    const existingData = existingMsg ? parseMessageData(existingMsg) : null;
    let respondTxHash = null;

    if (existingData?.isOnChain && existingData?.onChainDuelId && signer && !activeConversation.isDemoBot && parseFloat(existingData.wagerAmount || '0') > 0) {
      try {
        const escrowAddr = getDuelEscrowAddress(chainId);
        const contract = new ethers.Contract(escrowAddr, ARCADE_DUEL_ESCROW_ABI, signer);
        const moveMap = { rock: 1, paper: 2, scissors: 3 };
        const moveNum = moveMap[moveId.toLowerCase()] || 1;
        const tx = await contract.respondDuel(existingData.onChainDuelId, moveNum, { value: ethers.parseEther(existingData.wagerAmount) });
        respondTxHash = tx.hash;
        await tx.wait();
      } catch (err) {
        console.warn("On-chain duel response failed:", err.message);
      }
    }

    const payload = {
      type: 'arcade_duel',
      action: 'respond',
      duelId,
      challenger: existingData?.challenger,
      challengerInboxId: existingData?.challengerInboxId,
      opponentChoice: moveId,
      opponent: walletAddress || (userProfile?.username ? `@${userProfile.username}` : 'Player 2'),
      opponentInboxId: xmtpClient?.inboxId || 'user-inbox',
      respondTxHash,
      timestamp: Date.now()
    };

    setMessages(prev => prev.map(m => {
      const d = parseMessageData(m);
      if (d.type === 'arcade_duel' && d.duelId === duelId) {
        return {
          ...m,
          content: `[JSON_MSG]${JSON.stringify({
            ...d,
            opponentChoice: moveId,
            opponent: payload.opponent,
            opponentInboxId: payload.opponentInboxId,
            respondTxHash: respondTxHash || d.respondTxHash,
            status: d.status === 'resolved' ? 'resolved' : 'waiting_reveal'
          })}`
        };
      }
      return m;
    }));

    await broadcastJsonPayload(payload, `Played ${moveId.toUpperCase()} in the duel!`);
  };

  const handleRevealDuelMove = async (duelId, opponentChoice, conv = activeConversationRef.current) => {
    const stored = activeDuelCommitmentsRef.current[duelId];
    if (!stored || !opponentChoice) return;
    if (revealingDuelsRef.current.has(duelId)) return;
    revealingDuelsRef.current.add(duelId);

    const existingMsg = messagesRef.current.find(m => parseMessageData(m).duelId === duelId);
    const existingData = existingMsg ? parseMessageData(existingMsg) : null;
    if (existingData?.status === 'resolved') return;
    let settleTxHash = null;

    if (existingData?.isOnChain && existingData?.onChainDuelId && signer && !conv?.isDemoBot) {
      try {
        const escrowAddr = getDuelEscrowAddress(chainId);
        const contract = new ethers.Contract(escrowAddr, ARCADE_DUEL_ESCROW_ABI, signer);
        const moveMap = { rock: 1, paper: 2, scissors: 3 };
        const moveNum = moveMap[stored.choice.toLowerCase()] || 1;
        const tx = await contract.revealAndSettle(existingData.onChainDuelId, moveNum, stored.salt);
        settleTxHash = tx.hash;
        await tx.wait();
      } catch (err) {
        console.warn("On-chain duel settlement failed:", err.message);
      }
    }

    const winner = determineRpsWinner(stored.choice, opponentChoice);
    const payload = {
      type: 'arcade_duel',
      action: 'reveal',
      duelId,
      challenger: existingData?.challenger || walletAddress,
      challengerInboxId: existingData?.challengerInboxId || xmtpClient?.inboxId,
      opponent: existingData?.opponent || conv?.peerAddress,
      opponentInboxId: existingData?.opponentInboxId || conv?.peerAddress,
      wagerAmount: existingData?.wagerAmount || '0',
      isOnChain: existingData?.isOnChain || false,
      onChainDuelId: existingData?.onChainDuelId || null,
      challengerChoice: stored.choice,
      salt: stored.salt,
      opponentChoice,
      winner,
      settleTxHash,
      status: 'resolved',
      timestamp: Date.now()
    };

    setMessages(prev => prev.map(m => {
      const d = parseMessageData(m);
      if (d.type === 'arcade_duel' && d.duelId === duelId) {
        return {
          ...m,
          content: `[JSON_MSG]${JSON.stringify({
            ...d,
            challenger: payload.challenger,
            challengerInboxId: payload.challengerInboxId,
            opponent: payload.opponent,
            opponentInboxId: payload.opponentInboxId,
            challengerChoice: stored.choice,
            salt: stored.salt,
            opponentChoice,
            winner,
            settleTxHash: settleTxHash || d.settleTxHash,
            status: 'resolved'
          })}`
        };
      }
      return m;
    }));

    if (winner === 'challenger') {
      addArcadeXp(100, 'Arcade Duel Victory');
      triggerCoinBurst('0.001', 'Duel Bounty');
      playReceiveChime();
    } else if (winner === 'draw') {
      addArcadeXp(25, 'Arcade Duel Draw');
      playReceiveChime();
    } else {
      addArcadeXp(25, 'Arcade Duel Match');
      playReceiveChime();
    }

    if (conv && !conv.isDemoBot) {
      try {
        await conv.sendText(`[JSON_MSG]${JSON.stringify(payload)}`);
      } catch (err) {
        console.warn("Failed to broadcast duel reveal:", err);
      }
    }
  };
  handleRevealDuelMoveRef.current = handleRevealDuelMove;

  const handleClaimDuelTimeout = async (duelId, onChainDuelId) => {
    if (!onChainDuelId || !signer) return;
    try {
      const escrowAddr = getDuelEscrowAddress(chainId);
      const contract = new ethers.Contract(escrowAddr, ARCADE_DUEL_ESCROW_ABI, signer);
      const tx = await contract.claimTimeout(onChainDuelId);
      await tx.wait();
      alert("🏆 Forfeiture claimed on-chain! Full wager pot has been paid to your wallet.");
      setMessages(prev => prev.map(m => {
        const d = parseMessageData(m);
        if (d.type === 'arcade_duel' && d.duelId === duelId) {
          return {
            ...m,
            content: `[JSON_MSG]${JSON.stringify({ ...d, winner: 'opponent', status: 'resolved', isForfeited: true })}`
          };
        }
        return m;
      }));
    } catch (err) {
      alert("Could not claim timeout: " + (err.reason || err.message));
    }
  };

  // Discord-Style Arcade Activities Suite Handlers
  const handleSelectActivity = (actId) => {
    if (actId === 'snake') setShowSnakeModal(true);
    else if (actId === 'wordle') setShowWordleModal(true);
    else if (actId === 'blackjack') setShowBlackjackModal(true);
    else if (actId === 'sketch') setShowSketchModal(true);
    else if (actId === 'tictactoe') handleSendTicTacToe();
    else if (actId === 'rps') handleSendDuelChallenge('0');
    else if (actId === 'capsule') setShowTimeCapsuleModal(true);
  };

  const handleSendTicTacToe = async () => {
    if (!activeConversation) return;
    const gameId = `ttt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      type: 'tictactoe',
      gameId,
      challenger: walletAddress || (userProfile?.username ? `@${userProfile.username}` : 'Player 1'),
      challengerInboxId: xmtpClient?.inboxId || 'user-inbox',
      opponent: activeConversation.peerAddress || 'Player 2',
      opponentInboxId: activeConversation.peerAddress || 'peer-inbox',
      board: Array(9).fill(null),
      turn: 'X',
      status: 'active',
      winner: null,
      timestamp: Date.now()
    };
    await broadcastJsonPayload(payload, 'Challenged you to Cyber Tic-Tac-Toe! ❌⭕');
    addArcadeXp(10, 'Tic-Tac-Toe Created');
  };

  const handleMakeTicTacToeMove = async ({ gameId, board, turn, status, winner }) => {
    const payload = {
      type: 'tictactoe',
      action: 'move',
      gameId,
      board,
      turn,
      status,
      winner,
      timestamp: Date.now()
    };

    setMessages(prev => prev.map(m => {
      const d = parseMessageData(m);
      if (d.type === 'tictactoe' && d.gameId === gameId) {
        return {
          ...m,
          content: `[JSON_MSG]${JSON.stringify({
            ...d,
            board,
            turn,
            status,
            winner
          })}`
        };
      }
      return m;
    }));

    if (activeConversation && !activeConversation.isDemoBot) {
      try {
        await activeConversation.sendText(`[JSON_MSG]${JSON.stringify(payload)}`);
      } catch (err) {
        console.warn("Failed to broadcast TicTacToe move:", err);
      }
    } else if (activeConversation?.isDemoBot && status !== 'resolved') {
      triggerBotReply('', 'tictactoe_turn', { gameId, board });
    }
  };

  const handleSendSnakeChallenge = async ({ score }) => {
    if (!activeConversation) return;
    const challengeId = `snake_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      type: 'snake_challenge',
      challengeId,
      challenger: walletAddress || (userProfile?.username ? `@${userProfile.username}` : 'Player 1'),
      challengerScore: score,
      status: 'open',
      opponentScore: 0,
      timestamp: Date.now()
    };
    await broadcastJsonPayload(payload, `Cyber Snake Challenge: Can you beat ${score} pts? 🐍`);
    addArcadeXp(20, 'Snake Challenge Sent');
    if (activeConversation?.isDemoBot) {
      triggerBotReply('', 'snake_challenge', { challengeId, targetScore: score });
    }
  };

  const handleAcceptSnakeChallenge = (challengeId, targetScore) => {
    setShowSnakeModal(true);
  };

  const handleSendSketch = async ({ pixels, secretWord, hint }) => {
    if (!activeConversation) return;
    const sketchId = `sketch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      type: 'sketch_guess',
      sketchId,
      creator: walletAddress || (userProfile?.username ? `@${userProfile.username}` : 'Player 1'),
      pixels,
      secretWord,
      hint,
      solved: false,
      solvedBy: null,
      timestamp: Date.now()
    };
    await broadcastJsonPayload(payload, `Pixel Pictionary Drawing! Guess the word (${hint}) 🎨`);
    addArcadeXp(25, 'Pixel Sketch Broadcasted');
    if (activeConversation?.isDemoBot) {
      triggerBotReply('', 'sketch_guess', { sketchId, secretWord });
    }
  };

  const handleSolveSketch = async (sketchId, solver) => {
    const payload = {
      type: 'sketch_guess',
      action: 'solve',
      sketchId,
      solved: true,
      solvedBy: solver,
      timestamp: Date.now()
    };

    setMessages(prev => prev.map(m => {
      const d = parseMessageData(m);
      if (d.type === 'sketch_guess' && d.sketchId === sketchId) {
        return {
          ...m,
          content: `[JSON_MSG]${JSON.stringify({
            ...d,
            solved: true,
            solvedBy: solver
          })}`
        };
      }
      return m;
    }));

    if (activeConversation && !activeConversation.isDemoBot) {
      try {
        await activeConversation.sendText(`[JSON_MSG]${JSON.stringify(payload)}`);
      } catch (e) {}
    }
  };

  // Timelocked Capsule Handlers (enforced on-chain by TimeCapsuleVault)
  const handleSendTimeCapsule = async ({ 
    title, 
    sealedText, 
    durationSeconds, 
    ethAmount = '0', 
    theme = 'chronos', 
    media = null, 
    recipient = null 
  }) => {
    // If running in demo mode or without a connected wallet, simulate locally
    if (!signer || !provider || (activeConversation?.isDemoBot && !signer)) {
      const capsuleId = `cap_demo_${Date.now()}`;
      const effectiveUser = walletAddress || '0x71C8360537aaC1957e47192070D7C98C0B29b3B1';
      const payload = {
        type: 'time_capsule',
        capsuleId,
        title: title || 'Timelocked Vault',
        theme: theme || 'chronos',
        hasMedia: Boolean(media),
        media: media || null,
        sealedText,
        unlockTimestamp: Date.now() + (durationSeconds * 1000),
        senderAddress: effectiveUser,
        recipient: effectiveUser,
        createdAt: Date.now(),
        durationSeconds,
        isOnChain: false,
        onChainCapsuleId: '1',
        createTxHash: null,
        ethAmount: String(ethAmount || '0'),
        chainId: Number(chainId) || 31337
      };
      await broadcastJsonPayload(payload, `Dispatched a timelocked capsule (${durationSeconds}s)`);
      addArcadeXp(25, 'Time Capsule Sealed');
      return;
    }

    const vaultAddr = getTimeCapsuleVaultAddress(chainId);
    if (!vaultAddr) {
      throw new Error('TimeCapsuleVault is not deployed on this network. Run: npx hardhat run scripts/deploy.js --network <network>');
    }

    // In demo bot conversations, always lock to the user's wallet so they can open & reclaim ETH
    let targetRecipient = activeConversation?.isDemoBot
      ? walletAddress
      : (recipient || activeConversation?.peerAddress || walletAddress);

    if (!targetRecipient || !ethers.isAddress(targetRecipient)) {
      targetRecipient = walletAddress;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const latestBlock = await provider.getBlock('latest');
    const blockSec = Number(latestBlock?.timestamp || nowSec);
    const baseSec = Math.max(nowSec, blockSec);
    const unlockSec = baseSec + Math.max(10, Math.round(durationSeconds));

    // Query on-chain nonce to prevent MetaMask nonce desync on Localhost
    let currentNonce = undefined;
    try {
      currentNonce = await provider.getTransactionCount(walletAddress, 'latest');
    } catch {}

    const contract = new ethers.Contract(vaultAddr, TIME_CAPSULE_VAULT_ABI, signer);
    const txOptions = {
      value: ethers.parseEther(String(ethAmount || '0')),
      gasLimit: 350000
    };
    if (typeof currentNonce === 'number') {
      txOptions.nonce = currentNonce;
    }

    let tx;
    try {
      tx = await contract.createCapsule(
        targetRecipient,
        unlockSec,
        title || 'Timelocked Vault',
        sealedText,
        txOptions
      );
    } catch (err) {
      const errMsg = err?.data?.message || err?.error?.message || err?.reason || err?.shortMessage || err?.message || '';
      if (errMsg.toLowerCase().includes('nonce') || err?.code === -32603) {
        throw new Error('MetaMask nonce out of sync with Hardhat node. To fix: In MetaMask open Settings → Advanced → Clear activity tab data / Reset account.');
      }
      throw err;
    }
    const receipt = await tx.wait();

    let onChainCapsuleId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'CapsuleCreated') {
          onChainCapsuleId = parsed.args.capsuleId.toString();
          break;
        }
      } catch {}
    }
    if (!onChainCapsuleId) throw new Error('Capsule transaction confirmed but no CapsuleCreated event was found.');

    const capsuleId = `cap_${onChainCapsuleId}_${Date.now()}`;
    const payload = {
      type: 'time_capsule',
      capsuleId,
      title: title || 'Timelocked Vault',
      theme: theme || 'chronos',
      hasMedia: Boolean(media),
      media: media || null,
      unlockTimestamp: unlockSec * 1000,
      senderAddress: walletAddress,
      recipient: targetRecipient,
      createdAt: Date.now(),
      durationSeconds,
      isOnChain: true,
      onChainCapsuleId,
      createTxHash: tx.hash,
      ethAmount: String(ethAmount || '0'),
      chainId: Number(chainId) || null
    };
    await broadcastJsonPayload(payload, `Dispatched a timelocked capsule (${durationSeconds}s)`);
    addArcadeXp(25, 'Time Capsule Sealed');
  };

  // Opens a capsule on-chain; resolves true once the payload has been revealed.
  const handleOpenTimeCapsule = async (capsuleId) => {
    const msg = messages.find(m => {
      const d = parseMessageData(m);
      return d.type === 'time_capsule' && d.capsuleId === capsuleId;
    });
    const data = msg ? parseMessageData(msg) : null;
    if (!data) throw new Error('Capsule not found.');

    // If offline / demo mode
    if (!data.isOnChain || !signer) {
      setOpenedCapsulesMap(prev => ({ ...prev, [capsuleId]: true }));
      setMessages(prev => prev.map(m => {
        const d = parseMessageData(m);
        if (d.type === 'time_capsule' && d.capsuleId === capsuleId) {
          return {
            ...m,
            content: `[JSON_MSG]${JSON.stringify({ ...d, isOpened: true })}`
          };
        }
        return m;
      }));
      return true;
    }

    const vaultAddr = getTimeCapsuleVaultAddress(data.chainId || chainId);
    if (!vaultAddr) throw new Error('TimeCapsuleVault is not deployed on this network.');

    const contract = new ethers.Contract(vaultAddr, TIME_CAPSULE_VAULT_ABI, signer);
    let payloadText = null;
    let openTxHash = null;

    const isDeadRecipient = Boolean(
      data.recipient && data.recipient.toLowerCase() === '0x000000000000000000000000000000000000dead'
    );
    const isRecipient = Boolean(
      (walletAddress && data.recipient && walletAddress.toLowerCase() === data.recipient.toLowerCase()) &&
      !isDeadRecipient
    );

    if (isRecipient) {
      // Recipient can call open() to claim any attached ETH
      try {
        const tx = await contract.open(data.onChainCapsuleId);
        openTxHash = tx.hash;
        const receipt = await tx.wait();
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'CapsuleOpened') {
              payloadText = parsed.args.payload;
              break;
            }
          } catch {}
        }
      } catch (err) {
        // If already opened or re-read, read view payload
        try {
          payloadText = await contract.getPayload(data.onChainCapsuleId);
        } catch {
          throw err;
        }
      }
    } else {
      // Sender or reader: call view function getPayload (no gas, no transaction popup, no NotRecipient revert)
      try {
        payloadText = await contract.getPayload(data.onChainCapsuleId);
      } catch (err) {
        throw new Error(err?.reason || err?.message || 'Could not view capsule payload.');
      }
    }

    if (payloadText === null) {
      payloadText = await contract.getPayload(data.onChainCapsuleId);
    }

    setOpenedCapsulesMap(prev => ({ ...prev, [capsuleId]: true }));
    setMessages(prev => prev.map(m => {
      const d = parseMessageData(m);
      if (d.type === 'time_capsule' && d.capsuleId === capsuleId) {
        return {
          ...m,
          content: `[JSON_MSG]${JSON.stringify({ ...d, sealedText: payloadText, openTxHash: openTxHash || d.openTxHash, isOpened: true })}`
        };
      }
      return m;
    }));
    return true;
  };

  // ---- Polls, Gift Packets, Split Bill, Export, Notifications ----
  const myInteractionKey = xmtpClient?.inboxId || 'user-inbox';

  const sendInteraction = async (payload) => {
    if (!activeConversation) return;
    const data = { type: 'interaction', ts: Date.now(), ...payload };
    setInteractions(prev => applyInteraction(prev, data, myInteractionKey, data.ts));
    if (activeConversation.isDemoBot) return;
    try {
      await activeConversation.sendText(`[JSON_MSG]${JSON.stringify(data)}`);
    } catch (err) {
      console.error('Failed to send interaction', err);
    }
  };

  // ---- On-chain polls (PollRegistry) ----
  const getPollContract = (cid, runner) => {
    const addr = getPollRegistryAddress(cid);
    if (!addr) {
      throw new Error('PollRegistry is not deployed on this network. Run: npx hardhat run scripts/deploy.js --network <network>');
    }
    return new ethers.Contract(addr, POLL_REGISTRY_ABI, runner);
  };

  // Trim text to a UTF-8 byte budget (the contract limits bytes, not characters).
  const clipBytes = (text, maxBytes) => {
    const enc = new TextEncoder();
    let out = String(text);
    while (enc.encode(out).length > maxBytes) out = out.slice(0, -1);
    return out;
  };

  const handleSendPoll = async (raw) => {
    const parts = (raw || '').split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length < 3 || parts.length > 7) {
      alert('Usage: /poll Question | Option A | Option B (2 to 6 options)');
      return;
    }
    try {
      if (!signer || !provider) throw new Error('Connect a wallet to create an on-chain poll.');
      const contract = getPollContract(chainId, signer);
      const latest = await provider.getBlock('latest');
      const closesAt = Number(latest.timestamp) + 24 * 3600;
      const question = clipBytes(parts[0], 140);
      const options = parts.slice(1).map(o => clipBytes(o, 60));

      const tx = await contract.createPoll(question, options, closesAt);
      const receipt = await tx.wait();
      let onChainPollId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'PollCreated') {
            onChainPollId = parsed.args.pollId.toString();
            break;
          }
        } catch {}
      }
      if (!onChainPollId) throw new Error('Poll transaction confirmed but no PollCreated event was found.');

      const payload = {
        type: 'poll',
        pollId: `poll_${onChainPollId}_${Date.now()}`,
        isOnChain: true,
        onChainPollId,
        question,
        options,
        closesAt: closesAt * 1000,
        creator: walletAddress,
        createTxHash: tx.hash,
        chainId: Number(chainId) || null,
        timestamp: Date.now()
      };
      await broadcastJsonPayload(payload, 'Created a poll');
      addArcadeXp(10, 'Poll Created');
    } catch (err) {
      alert('Could not create poll: ' + (err.reason || err.shortMessage || err.message));
    }
  };

  // Reads the authoritative tally and my vote from the contract.
  const refreshPollStatus = async (pollData) => {
    if (!provider || !pollData?.onChainPollId) return;
    const addr = getPollRegistryAddress(pollData.chainId || chainId);
    if (!addr) return;
    try {
      const contract = new ethers.Contract(addr, POLL_REGISTRY_ABI, provider);
      const id = pollData.onChainPollId;
      const p = await contract.getPoll(id);
      let myVote = null;
      if (walletAddress) {
        const [voted, option] = await contract.voteOf(id, walletAddress);
        myVote = voted ? Number(option) : null;
      }
      setPollStatus(prev => ({
        ...prev,
        [id]: {
          counts: p.counts.map(Number),
          total: Number(p.totalVotes),
          closed: p.closed,
          closesAt: Number(p.closesAt) * 1000,
          myVote
        }
      }));
    } catch (err) {
      // Contract unreachable on this network: keep the last known tally.
    }
  };

  const handleVotePoll = async (pollId, choice, pollData) => {
    if (pollData?.onChainPollId) {
      try {
        if (!signer) throw new Error('Connect a wallet to vote on-chain.');
        const known = pollStatus[pollData.onChainPollId];
        if (known?.myVote === choice) return;
        const isFirstVote = !known || known.myVote === null || known.myVote === undefined;
        const contract = getPollContract(pollData.chainId || chainId, signer);
        const tx = await contract.vote(pollData.onChainPollId, choice);
        await tx.wait();
        await refreshPollStatus(pollData);
        if (isFirstVote) addArcadeXp(5, 'Poll Vote');
      } catch (err) {
        alert('Could not vote: ' + (err.reason || err.shortMessage || err.message));
      }
      return;
    }

    // Legacy off-chain poll (messages created before PollRegistry existed)
    const isFirstVote = !interactions[pollId]?.[myInteractionKey];
    sendInteraction({ kind: 'poll_vote', targetId: pollId, choice });
    if (isFirstVote) addArcadeXp(5, 'Poll Vote');
  };

  // Creator ends voting early.
  const handleClosePoll = async (pollData) => {
    try {
      if (!signer) throw new Error('Connect a wallet to close this poll.');
      const contract = getPollContract(pollData.chainId || chainId, signer);
      const tx = await contract.closePoll(pollData.onChainPollId);
      await tx.wait();
      await refreshPollStatus(pollData);
    } catch (err) {
      alert('Could not close poll: ' + (err.reason || err.shortMessage || err.message));
    }
  };

  // Keep every visible on-chain poll in sync with the contract.
  useEffect(() => {
    if (!provider) return;
    messages.forEach(m => {
      const d = parseMessageData(m);
      if (d.type !== 'poll' || !d.onChainPollId) return;
      const known = pollStatus[d.onChainPollId];
      if (known && known.closed) return;
      refreshPollStatus(d);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, provider, chainId, walletAddress]);

  // ---- On-chain ETH gift packets (GiftPacketVault) ----
  const getGiftContract = (cid, runner) => {
    const addr = getGiftPacketVaultAddress(cid);
    if (!addr) {
      throw new Error('GiftPacketVault is not deployed on this network. Run: npx hardhat run scripts/deploy.js --network <network>');
    }
    return new ethers.Contract(addr, GIFT_PACKET_VAULT_ABI, runner);
  };

  const handleSendGift = async (arg = '') => {
    const [ethArg, slotsArg, ...msgParts] = arg.trim().split(/\s+/);
    const slots = Math.min(10, Math.max(1, parseInt(slotsArg, 10) || 3));
    if (!ethArg || !/^\d+(\.\d{1,18})?$/.test(ethArg) || !(parseFloat(ethArg) > 0)) {
      alert('Usage: /gift [ETH amount] [slots 1-10] [message]');
      return;
    }
    try {
      if (!signer || !provider) throw new Error('Connect a wallet to fund a gift packet on-chain.');
      const contract = getGiftContract(chainId, signer);
      const latest = await provider.getBlock('latest');
      const expiresAt = Number(latest.timestamp) + 24 * 3600;
      const message = msgParts.join(' ').slice(0, 60) || 'Open to win ETH!';

      const tx = await contract.createPacket(slots, expiresAt, message, { value: ethers.parseEther(ethArg) });
      const receipt = await tx.wait();
      let onChainPacketId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'PacketCreated') {
            onChainPacketId = parsed.args.packetId.toString();
            break;
          }
        } catch {}
      }
      if (!onChainPacketId) throw new Error('Packet transaction confirmed but no PacketCreated event was found.');

      const payload = {
        type: 'gift_packet',
        giftId: `gift_${onChainPacketId}_${Date.now()}`,
        isOnChain: true,
        onChainPacketId,
        totalEth: ethArg,
        slots,
        message,
        expiresAt: expiresAt * 1000,
        senderAddress: walletAddress,
        createTxHash: tx.hash,
        chainId: Number(chainId) || null,
        timestamp: Date.now()
      };
      await broadcastJsonPayload(payload, `Dropped a ${ethArg} ETH gift packet`);
      addArcadeXp(10, 'Gift Packet Dropped');
      if (provider && walletAddress) refreshBalance(provider, walletAddress);
    } catch (err) {
      alert('Could not create gift packet: ' + (err.reason || err.shortMessage || err.message));
    }
  };

  // Reads the authoritative packet state and claim history from the contract.
  const refreshGiftStatus = async (giftData) => {
    if (!provider || !giftData?.onChainPacketId) return;
    const addr = getGiftPacketVaultAddress(giftData.chainId || chainId);
    if (!addr) return;
    try {
      const contract = new ethers.Contract(addr, GIFT_PACKET_VAULT_ABI, provider);
      const id = giftData.onChainPacketId;
      const p = await contract.getPacket(id);
      const events = await contract.queryFilter(contract.filters.PacketClaimed(id));
      const claims = events.map(e => ({ claimer: e.args.claimer, prize: ethers.formatEther(e.args.prize) }));
      const mine = walletAddress
        ? claims.find(c => c.claimer.toLowerCase() === walletAddress.toLowerCase())
        : null;
      setGiftStatus(prev => ({
        ...prev,
        [id]: {
          claimedCount: Number(p.claimedCount),
          slots: Number(p.slots),
          expiresAt: Number(p.expiresAt) * 1000,
          refunded: p.refunded,
          remaining: ethers.formatEther(p.total - p.claimedAmount),
          claims,
          mine: mine ? mine.prize : null
        }
      }));
    } catch (err) {
      // Contract unreachable on this network: keep the last known state.
    }
  };

  const handleClaimGift = async (giftData) => {
    if (giftData?.onChainPacketId) {
      try {
        if (!signer) throw new Error('Connect a wallet to claim this packet.');
        const contract = getGiftContract(giftData.chainId || chainId, signer);
        const tx = await contract.claimPacket(giftData.onChainPacketId);
        const receipt = await tx.wait();
        let prizeWei = null;
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog(log);
            if (parsed && parsed.name === 'PacketClaimed') {
              prizeWei = parsed.args.prize;
              break;
            }
          } catch {}
        }
        await refreshGiftStatus(giftData);
        playCoinClink();
        if (prizeWei !== null) triggerCoinBurst(ethers.formatEther(prizeWei), giftData.message || 'Gift packet');
        addArcadeXp(25, 'Gift Packet Claimed');
        if (provider && walletAddress) refreshBalance(provider, walletAddress);
      } catch (err) {
        alert('Could not claim packet: ' + (err.reason || err.shortMessage || err.message));
      }
      return;
    }

    // Legacy off-chain XP packet (messages created before GiftPacketVault existed)
    if (!giftData?.giftId) return;
    if (interactions[giftData.giftId]?.[myInteractionKey]) return;
    const claimEvent = { type: 'interaction', kind: 'gift_claim', targetId: giftData.giftId };
    const projected = applyInteraction(interactions, claimEvent, myInteractionKey, Date.now());
    const list = giftClaimList(giftData.giftId, giftData.totalXp, giftData.slots, projected[giftData.giftId]);
    const mine = list.find(c => c.key === myInteractionKey);
    if (!mine) {
      alert('All slots in this packet have already been claimed.');
      return;
    }
    sendInteraction({ kind: 'gift_claim', targetId: giftData.giftId });
    addArcadeXp(mine.prize, 'Gift Packet');
    playCoinClink();
  };

  // Creator reclaims unclaimed ETH after the packet expires.
  const handleRefundGift = async (giftData) => {
    try {
      if (!signer) throw new Error('Connect a wallet to reclaim this packet.');
      const contract = getGiftContract(giftData.chainId || chainId, signer);
      const tx = await contract.refundExpired(giftData.onChainPacketId);
      await tx.wait();
      await refreshGiftStatus(giftData);
      if (provider && walletAddress) refreshBalance(provider, walletAddress);
    } catch (err) {
      alert('Could not reclaim packet: ' + (err.reason || err.shortMessage || err.message));
    }
  };

  // Keep every visible on-chain gift packet in sync with the contract.
  useEffect(() => {
    if (!provider) return;
    messages.forEach(m => {
      const d = parseMessageData(m);
      if (d.type !== 'gift_packet' || !d.onChainPacketId) return;
      const known = giftStatus[d.onChainPacketId];
      if (known && (known.refunded || known.claimedCount >= known.slots)) return;
      refreshGiftStatus(d);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, provider, chainId, walletAddress]);

  const handleSendSplit = async (arg = '') => {
    const parts = arg.trim().split(/\s+/);
    const total = parseFloat(parts[0]);
    const people = parseInt(parts[1], 10);
    if (!(total > 0) || !(people >= 2 && people <= 20)) {
      alert('Usage: /split [total ETH] [people 2-20] [note]');
      return;
    }
    const share = String(Number((total / people).toFixed(6)));
    const note = parts.slice(2).join(' ') || 'shared tab';
    try {
      // The creator covers one share, so the contract expects (people - 1) payers.
      await sendOnChainInvoice({
        amount: share,
        note: `Split: ${note} (${total} ETH / ${people})`,
        maxPayers: people - 1,
        split: true,
        previewText: `Split bill: ${share} ETH each`
      });
      addArcadeXp(10, 'Split Bill');
    } catch (err) {
      alert('Could not create split bill: ' + (err.reason || err.shortMessage || err.message));
    }
  };

  // ---- On-chain invoices (InvoiceManager): payment requests + split bills ----
  const getInvoiceContract = (cid, runner) => {
    const addr = getInvoiceManagerAddress(cid);
    if (!addr) {
      throw new Error('InvoiceManager is not deployed on this network. Run: npx hardhat run scripts/deploy.js --network <network>');
    }
    return new ethers.Contract(addr, INVOICE_MANAGER_ABI, runner);
  };

  // Creates the invoice on-chain, then announces it in the chat.
  const sendOnChainInvoice = async ({ amount, note, maxPayers = 1, split = false, previewText = '' }) => {
    if (!signer || !provider) throw new Error('Connect a wallet to create an on-chain invoice.');
    const peer = activeConversation?.peerAddress;
    // Lock a single invoice to the chat partner; split bills, groups and the BlockBot chat stay open to any payer.
    const lockToPeer = !split && maxPayers === 1 && !activeConversation?.isDemoBot &&
      !isGroupConversation(activeConversation) && peer && ethers.isAddress(peer);
    const payer = lockToPeer ? peer : ethers.ZeroAddress;

    const contract = getInvoiceContract(chainId, signer);
    const tx = await contract.createInvoice(
      payer,
      ethers.parseEther(String(amount)),
      maxPayers,
      String(note || '').slice(0, 48)
    );
    const receipt = await tx.wait();
    let onChainInvoiceId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'InvoiceCreated') {
          onChainInvoiceId = parsed.args.invoiceId.toString();
          break;
        }
      } catch {}
    }
    if (!onChainInvoiceId) throw new Error('Invoice transaction confirmed but no InvoiceCreated event was found.');

    const payload = {
      type: 'crypto_request',
      requestId: `req_${onChainInvoiceId}_${Date.now()}`,
      amount: String(amount),
      note,
      status: 'pending',
      requester: walletAddress,
      recipient: peer,
      timestamp: Date.now(),
      isOnChain: true,
      onChainInvoiceId,
      createTxHash: tx.hash,
      maxPayers,
      chainId: Number(chainId) || null
    };
    await broadcastJsonPayload(payload, previewText || `Invoice: ${amount} ETH`);
    return payload;
  };

  // Pays an on-chain invoice, then drops a transfer receipt in the chat.
  const handlePayOnChainInvoice = async (req) => {
    if (!signer) throw new Error('Connect a wallet to pay this invoice.');
    const contract = getInvoiceContract(req.chainId || chainId, signer);
    const tx = await contract.payInvoice(req.onChainInvoiceId, { value: ethers.parseEther(String(req.amount)) });
    await tx.wait();

    await refreshInvoiceStatus(req);
    await broadcastJsonPayload({
      type: 'crypto_transfer',
      amount: String(req.amount),
      txHash: tx.hash,
      note: `Paying invoice: ${req.note || 'Payment'}`,
      status: 'confirmed',
      chainId: req.chainId || chainId,
      from: walletAddress,
      to: req.requester || activeConversation?.peerAddress,
      timestamp: Date.now()
    }, `Paid invoice: ${req.amount} ETH`);
    triggerCoinBurst(req.amount, req.note);
    addArcadeXp(50, 'Invoice Paid');
    if (provider && walletAddress) refreshBalance(provider, walletAddress);
  };

  // Reads the authoritative invoice state from the contract.
  const refreshInvoiceStatus = async (req) => {
    if (!provider || !req?.onChainInvoiceId) return;
    const addr = getInvoiceManagerAddress(req.chainId || chainId);
    if (!addr) return;
    try {
      const contract = new ethers.Contract(addr, INVOICE_MANAGER_ABI, provider);
      const inv = await contract.getInvoice(req.onChainInvoiceId);
      const paidByMe = walletAddress ? await contract.hasPaid(req.onChainInvoiceId, walletAddress) : false;
      setInvoiceStatus(prev => ({
        ...prev,
        [req.onChainInvoiceId]: {
          paidCount: Number(inv.paidCount),
          maxPayers: Number(inv.maxPayers),
          cancelled: inv.cancelled,
          paidByMe
        }
      }));
    } catch (err) {
      // Contract unreachable on this network: leave the card on its last known state.
    }
  };

  const handleCancelOnChainInvoice = async (req) => {
    try {
      if (!signer) throw new Error('Connect a wallet to cancel this invoice.');
      const contract = getInvoiceContract(req.chainId || chainId, signer);
      const tx = await contract.cancelInvoice(req.onChainInvoiceId);
      await tx.wait();
      await refreshInvoiceStatus(req);
    } catch (err) {
      alert('Could not cancel invoice: ' + (err.reason || err.shortMessage || err.message));
    }
  };

  // Keep every visible on-chain invoice card in sync with the contract.
  useEffect(() => {
    if (!provider) return;
    messages.forEach(m => {
      const d = parseMessageData(m);
      if (d.type !== 'crypto_request' || !d.onChainInvoiceId) return;
      const known = invoiceStatus[d.onChainInvoiceId];
      if (known && (known.cancelled || known.paidCount >= known.maxPayers)) return;
      refreshInvoiceStatus(d);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, provider, chainId, walletAddress]);

  const handleExportChat = (format = 'json') => {
    if (!activeConversation) return;
    const fmt = format === 'txt' ? 'txt' : 'json';
    const visible = messages.filter(m => !deletedMessages[m.id]);
    const peerLabel = getContactDisplayName(activeConversation.peerAddress) || 'Peer';
    const text = buildChatExport(
      visible,
      m => (m.senderInboxId === (xmtpClient?.inboxId || 'user-inbox') ? 'Me' : peerLabel),
      m => getMessageSnippet(m),
      fmt
    );
    const safeName = String(peerLabel).replace(/[^a-z0-9_-]+/gi, '_').slice(0, 24);
    downloadTextFile(
      `blockchat-${safeName}-${new Date().toISOString().slice(0, 10)}.${fmt}`,
      text,
      fmt === 'txt' ? 'text/plain' : 'application/json'
    );
    addArcadeXp(5, 'Chat Backup');
  };

  const handleEnableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      alert('Desktop notifications are not supported in this browser.');
      return;
    }
    const result = await Notification.requestPermission();
    alert(result === 'granted' ? 'Desktop alerts enabled! You will be pinged when the tab is in the background.' : `Notification permission: ${result}`);
  };

  const maybeNotifyIncoming = (message) => {
    try {
      if (typeof document !== 'undefined' && document.hidden &&
          typeof Notification !== 'undefined' && Notification.permission === 'granted' &&
          message.senderInboxId !== xmtpClient?.inboxId) {
        new Notification('BlockChat Arcade', { body: 'New encrypted message received', icon: '/icon.svg', tag: 'blockchat-msg' });
      }
    } catch (e) {}
  };

  const handleSelectCopilotCommand = (cmdObj) => {
    setShowCopilotPalette(false);
    if (cmdObj.cmd === '/duel') {
      handleSendDuelChallenge('0');
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/capsule') {
      setShowTimeCapsuleModal(true);
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/flip') {
      executeSlashFlip();
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/gas') {
      executeSlashGas();
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/trivia') {
      executeSlashTrivia();
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/group') {
      setShowCreateGroupModal(true);
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/add') {
      setShowGroupMembersModal(true);
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/notify') {
      handleEnableNotifications();
      setInputValue('');
      return;
    }
    if (cmdObj.cmd === '/export') {
      handleExportChat('json');
      setInputValue('');
      return;
    }
    setInputValue(cmdObj.cmd + ' ');
  };

  const handleComposerInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (val.startsWith('/') && !val.includes(' ')) {
      setShowCopilotPalette(true);
    } else {
      setShowCopilotPalette(false);
    }
    if (activeConversation && !editingMessage) {
      setChatDrafts(prev => {
        const updated = { ...prev, [activeConversation.id]: val };
        chatDraftsRef.current = updated;
        return updated;
      });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedTheme = localStorage.getItem('blockchat_coffee_theme');
        if (storedTheme) {
          setCoffeeTheme(storedTheme);
          document.documentElement.setAttribute('data-coffee-theme', storedTheme);
        } else {
          setCoffeeTheme('arcade');
          document.documentElement.setAttribute('data-coffee-theme', 'arcade');
        }
        const storedOpacity = localStorage.getItem('blockchat_wallpaper_opacity');
        if (storedOpacity) {
          setWallpaperOpacity(storedOpacity);
          document.documentElement.setAttribute('data-wallpaper-opacity', storedOpacity);
        }
        const storedSound = localStorage.getItem('blockchat_sound_enabled');
        if (storedSound !== null) {
          setSoundEnabled(storedSound === 'true');
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Authentic 8-Bit Web Audio Synthesizer (Zero Assets, Authentic Arcade Cabinet SFX)
  const playSendPop = () => {
    if (!soundEnabled || isChatMuted) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      // 8-bit laser blaster zap: 880Hz down to 140Hz in 75ms
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.075);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.075);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.075);
    } catch (e) {}
  };

  const playReceiveChime = () => {
    if (!soundEnabled || isChatMuted) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // 8-bit 1-UP fanfare arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = ctx.currentTime + idx * 0.055;
        const noteDur = idx === notes.length - 1 ? 0.16 : 0.05;
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.14, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + noteDur);
      });
    } catch (e) {}
  };

  const playCoinClink = () => {
    if (!soundEnabled || isChatMuted) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // Authentic 8-bit coin ding: B5 (987.77Hz) for 60ms then high E6 (1318.51Hz) for 300ms
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime);
      gain1.gain.setValueAtTime(0.18, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.06);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.06);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.06);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  const playThemePreviewSound = () => {
    if (!soundEnabled) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      // 8-bit power-up stepped trill
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.04;
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.07);
      });
    } catch (e) {}
  };

  // Backward-compatible alias for existing notification chime calls
  const playNotificationSound = playReceiveChime;

  // Arcade XP Progression & Coin Burst Audio-Visual Triggers
  const addArcadeXp = (amount, reason = '') => {
    setArcadeXp(prev => {
      const next = prev + amount;
      saveStoredXp(next);
      const prevRank = getArcadeRank(prev);
      const nextRank = getArcadeRank(next);
      if (nextRank.level > prevRank.level) {
        setLevelUpEvent({
          id: Date.now(),
          level: nextRank.level,
          title: nextRank.title,
          badge: nextRank.badge
        });
        playReceiveChime();
      }
      return next;
    });
  };

  const triggerCoinBurst = (amount = '0.01', note = '') => {
    setCoinBurstEvent({
      id: Date.now(),
      amount: amount || '0.01',
      note
    });
    playCoinClink();
  };

  const handleSelectTheme = (newTheme) => {
    setCoffeeTheme(newTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-coffee-theme', newTheme);
      localStorage.setItem('blockchat_coffee_theme', newTheme);
    }
    playThemePreviewSound();
  };

  const handleSelectWallpaperOpacity = (newOpacity) => {
    setWallpaperOpacity(newOpacity);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-wallpaper-opacity', newOpacity);
      localStorage.setItem('blockchat_wallpaper_opacity', newOpacity);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('blockchat_sound_enabled', String(next));
    }
    if (next) {
      playSendPop();
    }
  };

  // Star / Unstar Message Handler
  const toggleStarMessage = (messageId) => {
    setStarredMessages(prev => {
      const updated = { ...prev, [messageId]: !prev[messageId] };
      try {
        localStorage.setItem('blockchat_starred_msgs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Disappearing Timer Handler (Synchronizes across peers via XMTP payload)
  const handleSetDisappearingTimer = async (seconds) => {
    setDisappearingTimer(seconds);
    try {
      localStorage.setItem('blockchat_disappearing_timer', String(seconds));
    } catch (e) {}

    if (activeConversation && !activeConversation.isDemoBot) {
      try {
        const configPayload = {
          type: 'disappearing_config',
          timer: seconds,
          timestamp: new Date().getTime()
        };
        await activeConversation.sendText(`[JSON_MSG]${JSON.stringify(configPayload)}`);
      } catch (err) {
        console.warn("Failed to broadcast disappearing timer over XMTP:", err);
      }
    }
  };

  // Clear Chat Handler
  const handleClearCurrentChat = () => {
    if (confirm("Are you sure you want to clear message history for this chat?")) {
      setMessages([]);
      setShowContactDrawer(false);
    }
  };

  // Refresh Balance Helper
  const refreshBalance = async (ethProvider, address) => {
    try {
      const bal = await ethProvider.getBalance(address);
      setUserBalance(ethers.formatEther(bal));
    } catch (e) {}
  };

  // Extract Ethereum address from any XMTP member object
  const getAddressFromMember = (m) => {
    if (!m) return null;
    if (typeof m === 'string' && m.startsWith('0x') && m.length === 42) return m.toLowerCase();
    if (Array.isArray(m.accountIdentifiers) && m.accountIdentifiers.length > 0) {
      const first = m.accountIdentifiers[0];
      if (typeof first === 'string' && first.startsWith('0x')) return first.toLowerCase();
      if (first && typeof first.identifier === 'string' && first.identifier.startsWith('0x')) return first.identifier.toLowerCase();
    }
    if (Array.isArray(m.accountAddresses) && m.accountAddresses.length > 0) {
      const first = m.accountAddresses[0];
      if (typeof first === 'string' && first.startsWith('0x')) return first.toLowerCase();
    }
    if (typeof m.address === 'string' && m.address.startsWith('0x')) return m.address.toLowerCase();
    if (typeof m.identifier === 'string' && m.identifier.startsWith('0x')) return m.identifier.toLowerCase();
    if (typeof m.inboxId === 'string' && m.inboxId.startsWith('0x') && m.inboxId.length === 42) return m.inboxId.toLowerCase();
    return null;
  };

  // Authoritatively resolve the 1-on-1 peer Ethereum address for an XMTP conversation
  const resolveConversationPeerAddress = async (convo, myAddr) => {
    if (!convo || isGroupConversation(convo)) return convo?.peerAddress || null;

    const myLower = (myAddr || walletAddressRef.current || walletAddress || '').toLowerCase();

    // If it already has a valid peerAddress that is NOT me, it's correct
    if (convo.peerAddress && ethers.isAddress(convo.peerAddress)) {
      if (!myLower || convo.peerAddress.toLowerCase() !== myLower) {
        return convo.peerAddress.toLowerCase();
      }
    }

    // Try XMTP DM peerInboxId
    let peerInboxId = null;
    if (typeof convo.peerInboxId === 'function') {
      try {
        peerInboxId = await convo.peerInboxId();
      } catch (e) {}
    }

    if (typeof convo.members === 'function') {
      try {
        const mems = await convo.members();
        if (Array.isArray(mems)) {
          // 1. If we have peerInboxId, match by inboxId
          if (peerInboxId) {
            const match = mems.find(m => m.inboxId === peerInboxId);
            const addr = getAddressFromMember(match);
            if (addr && ethers.isAddress(addr)) {
              convo.peerAddress = addr.toLowerCase();
              return convo.peerAddress;
            }
          }

          // 2. Find member whose address does not match my address
          const peerMem = mems.find(m => {
            const addr = getAddressFromMember(m);
            return addr && ethers.isAddress(addr) && (!myLower || addr.toLowerCase() !== myLower);
          });
          if (peerMem) {
            const addr = getAddressFromMember(peerMem);
            if (addr) {
              convo.peerAddress = addr.toLowerCase();
              return convo.peerAddress;
            }
          }

          // 3. Fallback: if 2 members and one is me, pick the other
          if (mems.length === 2 && myLower) {
            const a0 = getAddressFromMember(mems[0]);
            const a1 = getAddressFromMember(mems[1]);
            if (a0 && a0.toLowerCase() === myLower && a1 && ethers.isAddress(a1)) {
              convo.peerAddress = a1.toLowerCase();
              return convo.peerAddress;
            }
            if (a1 && a1.toLowerCase() === myLower && a0 && ethers.isAddress(a0)) {
              convo.peerAddress = a0.toLowerCase();
              return convo.peerAddress;
            }
          }
        }
      } catch (e) {
        console.warn('Could not resolve conversation members', e);
      }
    }

    return convo.peerAddress || null;
  };

  // Fetch Peer Profile
  const fetchPeerProfile = async (peerAddr, explicitRunner, explicitChainId, convoId) => {
    if (!peerAddr || !ethers.isAddress(peerAddr)) return;
    const key = peerAddr.toLowerCase();

    // Guard: Never assign a group conversation ID to an individual member's profile
    const shouldMapConvo = (cId) => {
      if (!cId) return false;
      const lower = cId.toLowerCase();
      if (lower.startsWith('group-') || lower.startsWith('demo-') || lower.includes('syndicate') || lower.includes('group')) return false;
      return true;
    };

    // 1. Check local cache (populate immediately so UI updates without lag)
    try {
      const cached = localStorage.getItem(`profile_${key}`);
      if (cached) {
        const pData = JSON.parse(cached);
        if (pData?.username) {
          setAddressProfiles(prev => {
            const next = { ...prev, [key]: pData };
            if (shouldMapConvo(convoId)) next[convoId.toLowerCase()] = pData;
            return next;
          });
        }
      }
    } catch (e) {}

    // 2. Determine runner and chainId with fallbacks
    let runner = explicitRunner || providerRef.current || provider || signerRef.current || signer;
    let effectiveChain = explicitChainId || chainIdRef.current || chainId;

    if (!runner && typeof window !== 'undefined' && window.ethereum) {
      try {
        runner = new ethers.BrowserProvider(window.ethereum);
      } catch (e) {}
    }
    // Fallback: If still no runner, or on local chain 31337, use JsonRpcProvider to local node
    if (!runner) {
      try {
        runner = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        effectiveChain = 31337;
      } catch (e) {}
    }

    if (!effectiveChain && runner?.getNetwork) {
      try {
        const net = await runner.getNetwork();
        effectiveChain = Number(net.chainId);
      } catch (e) {
        effectiveChain = 31337;
      }
    }
    if (!effectiveChain) effectiveChain = 31337;

    // 3. Reverse ENS lookup (if not local network)
    if (effectiveChain !== 31337 && runner?.lookupAddress) {
      try {
        const peerEns = await runner.lookupAddress(peerAddr);
        if (peerEns) {
          const ensProf = { username: peerEns, profilePictureCID: '', isRegistered: true };
          setAddressProfiles(prev => {
            const next = { ...prev, [key]: ensProf };
            if (shouldMapConvo(convoId)) next[convoId.toLowerCase()] = ensProf;
            return next;
          });
          return;
        }
      } catch (e) {}
    }

    // 4. Fetch on-chain profile from UserRegistry
    const registryAddr = getUserRegistryAddress(effectiveChain) || profileContractAddress;
    if (!registryAddr || !runner) return;

    try {
      const contract = new ethers.Contract(registryAddr, USER_REGISTRY_ABI, runner);
      const profile = await contract.getProfile(peerAddr);
      if (profile && profile.isRegistered) {
        const pData = {
          username: profile.username,
          profilePictureCID: profile.profilePictureCID,
          isRegistered: true
        };
        setAddressProfiles(prev => {
          const next = { ...prev, [key]: pData };
          if (shouldMapConvo(convoId)) next[convoId.toLowerCase()] = pData;
          return next;
        });
        try {
          localStorage.setItem(`profile_${key}`, JSON.stringify(pData));
        } catch (e) {}
      }
    } catch (e) {
      console.warn("Could not fetch peer profile from UserRegistry", peerAddr, e);
    }
  };

  // Fetch Profile (Local + On-Chain)
  const fetchOnChainProfile = async (ethSigner, address) => {
    // 1. Check local storage first
    try {
      const cached = localStorage.getItem(`profile_${address.toLowerCase()}`);
      if (cached) {
        const pData = JSON.parse(cached);
        setUserProfile(pData);
        setProfileFormUsername(pData.username || '');
        setProfileFormAvatar(pData.profilePictureCID || '');
        setAddressProfiles(prev => ({ ...prev, [address.toLowerCase()]: pData }));
      }
    } catch (e) {}

    // 2. Try fetching from On-chain contract if available
    const effectiveChain = chainId || chainIdRef.current || 31337;
    const registryAddr = getUserRegistryAddress(effectiveChain) || profileContractAddress;
    let runner = ethSigner || provider || signer || providerRef.current;
    if (!runner) {
      try { runner = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); } catch (e) {}
    }
    if (!registryAddr || !runner) return;

    try {
      const contract = new ethers.Contract(registryAddr, USER_REGISTRY_ABI, runner);
      const profile = await contract.getProfile(address);
      if (profile && profile.isRegistered) {
        const pData = {
          username: profile.username,
          profilePictureCID: profile.profilePictureCID,
          isRegistered: profile.isRegistered
        };
        setUserProfile(pData);
        setProfileFormUsername(pData.username);
        setProfileFormAvatar(pData.profilePictureCID);
        setAddressProfiles(prev => ({ ...prev, [address.toLowerCase()]: pData }));
        localStorage.setItem(`profile_${address.toLowerCase()}`, JSON.stringify(pData));
      }
    } catch (err) {
      // Contract not on current network or user not registered
    }
  };

  // Load XMTP Conversations
  const loadConversations = async (xmtp, explicitMyAddress, explicitChainId, explicitProvider) => {
    const myAddr = explicitMyAddress || walletAddressRef.current || walletAddress || xmtp?.accountIdentifier?.identifier;
    try {
      const convos = await xmtp.conversations.list();
      setConversations(convos);

      // Eagerly resolve peer addresses and on-chain profiles for all conversations
      convos.forEach(async (c) => {
        if (isGroupConversation(c)) {
          if (typeof c.members === 'function') {
            try {
              const mems = await c.members();
              setGroupMembersCache(prev => ({ ...prev, [c.id]: mems }));
              mems.forEach(m => {
                const addr = getAddressFromMember(m);
                if (addr && addr.toLowerCase() !== myAddr?.toLowerCase()) {
                  // Do not pass c.id so group id is never mapped to member profile!
                  fetchPeerProfile(addr, explicitProvider, explicitChainId);
                }
              });
            } catch (e) {}
          }
        } else {
          try {
            const peerAddr = await resolveConversationPeerAddress(c, myAddr);
            if (peerAddr) {
              c.peerAddress = peerAddr;
              fetchPeerProfile(peerAddr, explicitProvider, explicitChainId, c.id);
              setConversations(prev => [...prev]);
            }
          } catch (e) {}
        }
      });
      
      const stream = await xmtp.conversations.stream();
      for await (const conversation of stream) {
        setConversations(prev => {
          const exists = prev.find(c => c.id === conversation.id);
          return exists ? prev : [conversation, ...prev];
        });
        if (!isGroupConversation(conversation)) {
          resolveConversationPeerAddress(conversation, myAddr).then(peerAddr => {
            if (peerAddr) {
              conversation.peerAddress = peerAddr;
              fetchPeerProfile(peerAddr, explicitProvider, explicitChainId, conversation.id);
              setConversations(prev => [...prev]);
            }
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Error loading conversations", err);
    }
  };

  // Auto-resolve peer profiles for all conversations whenever conversations or wallet connection updates
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;
    const myAddr = walletAddressRef.current || walletAddress || xmtpClient?.accountIdentifier?.identifier;

    conversations.forEach(async (c) => {
      if (isGroupConversation(c)) {
        if (typeof c.members === 'function' && !groupMembersCache[c.id]) {
          try {
            const mems = await c.members();
            setGroupMembersCache(prev => ({ ...prev, [c.id]: mems }));
            mems.forEach(m => {
              const addr = getAddressFromMember(m);
              if (addr && addr.toLowerCase() !== myAddr?.toLowerCase()) {
                // Do not pass c.id so group id is never mapped to member profile!
                fetchPeerProfile(addr, providerRef.current || provider, chainIdRef.current || chainId);
              }
            });
          } catch (e) {}
        }
      } else {
        const peer = await resolveConversationPeerAddress(c, myAddr);
        if (peer) {
          if (!c.peerAddress || c.peerAddress !== peer) {
            c.peerAddress = peer;
            setConversations(prev => [...prev]);
          }
          fetchPeerProfile(peer, providerRef.current || provider, chainIdRef.current || chainId, c.id);
        }
      }
    });
  }, [conversations, walletAddress, provider, chainId, xmtpClient]);

  // Ensure active conversation always has authoritative peer profile loaded
  useEffect(() => {
    if (!activeConversation || isGroupConversation(activeConversation)) return;
    const myAddr = walletAddressRef.current || walletAddress || xmtpClient?.accountIdentifier?.identifier;
    resolveConversationPeerAddress(activeConversation, myAddr).then(peer => {
      if (peer) {
        if (!activeConversation.peerAddress || activeConversation.peerAddress !== peer) {
          activeConversation.peerAddress = peer;
        }
        fetchPeerProfile(peer, providerRef.current || provider, chainIdRef.current || chainId, activeConversation.id);
      }
    });
  }, [activeConversation, walletAddress, provider, chainId]);

  // Eagerly resolve profiles for message senders / participants in the active chat
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    messages.forEach(m => {
      const d = parseMessageData(m);
      const candidates = [
        d.senderAddress,
        d.requester,
        d.creator,
        d.from,
        d.to,
        d.challenger,
        d.opponent
      ].filter(a => a && typeof a === 'string' && ethers.isAddress(a));
      candidates.forEach(addr => {
        const lower = addr.toLowerCase();
        if (!addressProfiles[lower]) {
          fetchPeerProfile(lower, providerRef.current || provider, chainIdRef.current || chainId);
        }
      });
    });
  }, [messages, provider, chainId]);

  // Create XMTP Group
  const handleCreateXmtpGroup = async ({ groupName, members, groupAvatar }) => {
    const cleanAvatar = (groupAvatar || '').trim();
    if (xmtpClient) {
      const { IdentifierKind } = await import('@xmtp/browser-sdk');

      // Resolve identifiers and check XMTP eligibility
      const identifiers = members.map(addr => ({
        identifier: addr.toLowerCase(),
        identifierKind: IdentifierKind ? IdentifierKind.Ethereum : 'ethereum'
      }));

      // Verify all members can receive XMTP messages
      const canMsgMap = await xmtpClient.canMessage(identifiers);
      const notActivated = members.filter(addr => !canMsgMap.get(addr.toLowerCase()));
      if (notActivated.length > 0) {
        throw new Error(
          `These addresses have not activated XMTP yet:\n${notActivated.map(a => `${a.slice(0,6)}…${a.slice(-4)}`).join(', ')}`
        );
      }

      // Create the group on-chain via XMTP protocol
      const groupOptions = { name: groupName };
      if (cleanAvatar) groupOptions.imageUrl = cleanAvatar;

      const group = await xmtpClient.conversations.createGroupWithIdentifiers(identifiers, groupOptions);
      if (cleanAvatar) {
        group.imageUrl = cleanAvatar;
        setGroupAvatars(prev => {
          const updated = { ...prev, [group.id]: cleanAvatar };
          try {
            localStorage.setItem('blockchat_group_avatars', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }

      // Load member list eagerly
      try {
        const groupMembers = await group.members();
        setGroupMembersCache(prev => ({ ...prev, [group.id]: groupMembers }));
      } catch (e) {}

      setConversations(prev => {
        const exists = prev.find(c => c.id === group.id);
        return exists ? prev : [group, ...prev];
      });
      setShowCreateGroupModal(false);
      addArcadeXp(50, 'Group Created');
      selectConversation(group);
      return;
    }

    // Demo / Offline Group Creation Fallback
    const demoGroupId = `group-${Date.now()}`;
    const myAddr = (walletAddress || '0x71C8360537aaC1957e47192070D7C98C0B29b3B1').toLowerCase();
    const groupMembersList = [
      { accountIdentifiers: [{ identifier: myAddr }], inboxId: 'user-inbox' },
      ...members.map(addr => ({ accountIdentifiers: [{ identifier: addr.toLowerCase() }], inboxId: `inbox_${addr.slice(2, 8)}` }))
    ];

    const newGroup = {
      id: demoGroupId,
      isGroup: true,
      groupName: groupName,
      name: groupName,
      imageUrl: cleanAvatar || '',
      isDemoBot: true,
      createdAt: new Date().toISOString(),
      sendText: async (t) => {},
      messages: async () => [
        {
          id: `msg-${Date.now()}`,
          senderInboxId: 'user-inbox',
          senderName: 'You',
          sentAt: new Date().toISOString(),
          content: `👾 Group "${groupName}" initialized with ${groupMembersList.length} members.`
        }
      ],
      stream: async function* () {}
    };

    if (cleanAvatar) {
      setGroupAvatars(prev => {
        const updated = { ...prev, [demoGroupId]: cleanAvatar };
        try {
          localStorage.setItem('blockchat_group_avatars', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    setGroupMembersCache(prev => ({ ...prev, [demoGroupId]: groupMembersList }));
    setConversations(prev => [newGroup, ...prev]);
    setShowCreateGroupModal(false);
    addArcadeXp(50, 'Group Created');
    selectConversation(newGroup);
  };

  // Eagerly load group members when entering a group conversation
  const loadGroupMembers = async (convo) => {
    if (!convo || convo.isDemoBot || groupMembersCache[convo.id]) return;
    if (!isGroupConversation(convo)) return;
    if (typeof convo.members !== 'function') return;
    try {
      const members = await convo.members();
      setGroupMembersCache(prev => ({ ...prev, [convo.id]: members }));
    } catch (e) {}
  };

  // Add a new member to an active XMTP group
  const handleAddGroupMember = async (memberAddress) => {
    if (!activeConversation) throw new Error('No active group selected.');
    const addr = memberAddress.trim();
    if (!addr.match(/^0x[0-9a-fA-F]{40}$/)) {
      throw new Error('Please enter a valid 0x Ethereum address.');
    }

    if (activeConversation.isDemoBot) {
      const newMemberObj = {
        accountIdentifiers: [{ identifier: addr.toLowerCase() }],
        inboxId: `inbox_${addr.slice(2, 8)}`
      };
      setGroupMembersCache(prev => ({
        ...prev,
        [activeConversation.id]: [...(prev[activeConversation.id] || []), newMemberObj]
      }));
      addArcadeXp(25, 'Member Added to Group');
      playCoinClink();
      return;
    }

    if (!xmtpClient) throw new Error('Connect a Web3 wallet first.');
    const { IdentifierKind } = await import('@xmtp/browser-sdk');
    const identifier = {
      identifier: addr.toLowerCase(),
      identifierKind: IdentifierKind ? IdentifierKind.Ethereum : 'ethereum'
    };

    // Duplicate check
    const existingMembers = groupMembersCache[activeConversation.id] || [];
    const alreadyIn = existingMembers.some(m => {
      const mAddr = m.accountIdentifiers?.[0]?.identifier?.toLowerCase() || m.inboxId?.toLowerCase();
      return mAddr === addr.toLowerCase();
    });
    if (alreadyIn) {
      throw new Error('This address is already a member of the group.');
    }

    // Verify member has activated XMTP
    const canMsgMap = await xmtpClient.canMessage([identifier]);
    if (!canMsgMap.get(addr.toLowerCase())) {
      throw new Error(`Address ${addr.slice(0, 6)}…${addr.slice(-4)} has not activated XMTP yet.`);
    }

    // Add member on-chain via XMTP MLS
    let convoObj = activeConversation;
    if (typeof convoObj.addMembersByIdentifiers !== 'function' && xmtpClient.conversations?.getConversationById) {
      convoObj = xmtpClient.conversations.getConversationById(activeConversation.id) || activeConversation;
    }

    if (typeof convoObj.addMembersByIdentifiers === 'function') {
      await convoObj.addMembersByIdentifiers([identifier]);
    } else {
      throw new Error('addMembersByIdentifiers is not available on this group object.');
    }

    // Reload members
    try {
      const updated = await convoObj.members();
      setGroupMembersCache(prev => ({ ...prev, [activeConversation.id]: updated }));
    } catch (e) {
      setGroupMembersCache(prev => ({
        ...prev,
        [activeConversation.id]: [...(prev[activeConversation.id] || []), {
          accountIdentifiers: [identifier],
          inboxId: `inbox_${addr.slice(2, 8)}`
        }]
      }));
    }

    addArcadeXp(25, 'Member Added to Group');
    playCoinClink();
  };

  // Remove a member from an active group
  const handleRemoveGroupMember = async (memberAddress) => {
    if (!activeConversation) return;
    const addr = memberAddress.trim();

    if (activeConversation.isDemoBot) {
      setGroupMembersCache(prev => ({
        ...prev,
        [activeConversation.id]: (prev[activeConversation.id] || []).filter(m => {
          const mAddr = m.accountIdentifiers?.[0]?.identifier?.toLowerCase() || m.inboxId?.toLowerCase();
          return mAddr !== addr.toLowerCase();
        })
      }));
      return;
    }

    if (!xmtpClient) throw new Error('Connect a Web3 wallet first.');
    const { IdentifierKind } = await import('@xmtp/browser-sdk');
    const identifier = {
      identifier: addr.toLowerCase(),
      identifierKind: IdentifierKind ? IdentifierKind.Ethereum : 'ethereum'
    };

    let convoObj = activeConversation;
    if (typeof convoObj.removeMembersByIdentifiers !== 'function' && xmtpClient.conversations?.getConversationById) {
      convoObj = xmtpClient.conversations.getConversationById(activeConversation.id) || activeConversation;
    }

    if (typeof convoObj.removeMembersByIdentifiers === 'function') {
      await convoObj.removeMembersByIdentifiers([identifier]);
    }

    try {
      const updated = await convoObj.members();
      setGroupMembersCache(prev => ({ ...prev, [activeConversation.id]: updated }));
    } catch (e) {}
  };

  // Connect Wallet & Initialize XMTP
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        await ethProvider.send("eth_requestAccounts", []);
        const ethSigner = await ethProvider.getSigner();
        const address = await ethSigner.getAddress();
        
        setProvider(ethProvider);
        setSigner(ethSigner);
        setWalletAddress(address);
        walletAddressRef.current = address;
        providerRef.current = ethProvider;
        signerRef.current = ethSigner;

        // Fetch balance
        refreshBalance(ethProvider, address);

        // Fetch Network & Chain ID
        let detectedChainId = null;
        try {
          const net = await ethProvider.getNetwork();
          detectedChainId = Number(net.chainId);
          setChainId(detectedChainId);
          chainIdRef.current = detectedChainId;
          setProfileContractAddress(getUserRegistryAddress(detectedChainId));

          const netNames = {
            1: 'Ethereum Mainnet',
            11155111: 'Sepolia Testnet',
            42161: 'Arbitrum One',
            8453: 'Base',
            137: 'Polygon',
            31337: 'Hardhat Local'
          };
          setNetworkName(netNames[detectedChainId] || net.name || `Chain ${detectedChainId}`);
        } catch (e) {}

        // Reverse ENS lookup
        try {
          const lookup = await ethProvider.lookupAddress(address);
          if (lookup) {
            setEnsName(lookup);
            setUserProfile(prev => ({ ...prev, username: prev.username || lookup }));
          }
        } catch (e) {}
        
        fetchOnChainProfile(ethSigner, address);
        addArcadeXp(50, 'Wallet Connected');

        try {
          const { Client, IdentifierKind } = await import('@xmtp/browser-sdk');
          const xmtpSigner = {
            type: "EOA",
            getIdentifier: () => ({
              identifier: address.toLowerCase(),
              identifierKind: IdentifierKind ? IdentifierKind.Ethereum : 'ethereum'
            }),
            signMessage: async (message) => {
              const sig = await ethSigner.signMessage(message);
              return ethers.getBytes(sig);
            }
          };

          const xmtpEnv = process.env.NEXT_PUBLIC_XMTP_ENV || "dev";
          const xmtp = await Client.create(xmtpSigner, { env: xmtpEnv, dbEncryptionKey: getDbEncryptionKey() });
          setXmtpClient(xmtp);
          loadConversations(xmtp, address, detectedChainId, ethProvider);
        } catch (xmtpError) {
          console.warn("XMTP client initialization notice:", xmtpError);
        }
      } catch (error) {
        console.error("Connection failed", error);
        alert("Wallet connection failed: " + error.message);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert('Please install MetaMask or a Web3 wallet to connect!');
    }
  };

  // Disconnect Wallet Handler
  const disconnectWallet = () => {
    setWalletAddress(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
    setNetworkName('');
    setEnsName('');
    setUserBalance('0.0000');
    setXmtpClient(null);
    setActiveConversation(null);
    setMessages([]);
    setShowProfileModal(false);
    lockAllCiphers();
  };

  // EIP-1193 Listeners for Account and Network Changes
  const connectWalletRef = useRef(connectWallet);
  const disconnectWalletRef = useRef(disconnectWallet);

  useEffect(() => {
    connectWalletRef.current = connectWallet;
    disconnectWalletRef.current = disconnectWallet;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnectWalletRef.current?.();
      } else if (walletAddress && accounts[0].toLowerCase() !== walletAddress.toLowerCase()) {
        connectWalletRef.current?.();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [walletAddress]);

  // Save Profile Handler (Supports Instant & Smart Contract)
  const handleSaveProfile = async (e, mode = 'local') => {
    if (e) e.preventDefault();
    if (!walletAddress) return;

    const username = profileFormUsername.trim();
    if (!username) {
      alert("Please enter a username.");
      return;
    }

    const updated = {
      username: username,
      profilePictureCID: profileFormAvatar.trim(),
      isRegistered: userProfile.isRegistered
    };

    // Fast / Instant save mode (Free, local cache)
    if (mode === 'local') {
      setUserProfile(updated);
      setAddressProfiles(prev => ({ ...prev, [walletAddress.toLowerCase()]: updated }));
      localStorage.setItem(`profile_${walletAddress.toLowerCase()}`, JSON.stringify(updated));
      addArcadeXp(35, 'Profile Updated');
      alert("Profile updated locally!");
      setShowProfileModal(false);
      return;
    }

    // On-chain Smart contract mode
    if (!signer) {
      alert("Please connect your wallet first.");
      return;
    }

    const registryAddr = getUserRegistryAddress(chainId) || profileContractAddress;
    if (!registryAddr) {
      alert("UserRegistry smart contract address not found for this network.");
      return;
    }

    try {
      setIsSavingProfile(true);
      const contract = new ethers.Contract(registryAddr, USER_REGISTRY_ABI, signer);
      
      // Authoritatively check on-chain registration status
      let onChainRegistered = false;
      try {
        const onChainProfile = await contract.getProfile(walletAddress);
        onChainRegistered = Boolean(onChainProfile && onChainProfile.isRegistered);
      } catch (checkErr) {
        onChainRegistered = false;
      }

      let tx;
      if (onChainRegistered) {
        tx = await contract.updateProfilePicture(profileFormAvatar.trim() || "");
      } else {
        tx = await contract.registerUser(username, profileFormAvatar.trim() || "");
      }
      
      await tx.wait();
      const onChainData = { ...updated, isRegistered: true };
      setUserProfile(onChainData);
      setAddressProfiles(prev => ({ ...prev, [walletAddress.toLowerCase()]: onChainData }));
      localStorage.setItem(`profile_${walletAddress.toLowerCase()}`, JSON.stringify(onChainData));
      addArcadeXp(100, 'On-Chain Identity Registered');
      alert("Profile permanently registered on the blockchain!");
      setShowProfileModal(false);
    } catch (error) {
      console.error("On-chain profile registration failed", error);
      if (error.code === 'ACTION_REJECTED' || error.message?.includes('user rejected')) {
        alert("Transaction was cancelled in your wallet.");
      } else {
        alert("Smart contract transaction failed: " + (error.reason || error.message) + "\n\nTip: You can use 'Save Profile (Instant)' to save without gas fees.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Helper to apply incoming control events (delete / edit / disappearing) with sender authorization
  const processIncomingMessage = (message, messageList = messages) => {
    const data = parseMessageData(message);
    if (data.type === 'delete' && data.targetId) {
      const target = messageList.find(m => m.id === data.targetId);
      // Ensure only the sender can delete their own message
      if (!target || target.senderInboxId === message.senderInboxId) {
        setDeletedMessages(prev => ({ ...prev, [data.targetId]: true }));
      } else {
        console.warn("Unauthorized delete attempt rejected for message", data.targetId);
      }
      return false;
    }
    if (data.type === 'edit' && data.targetId) {
      const target = messageList.find(m => m.id === data.targetId);
      // Ensure only the sender can edit their own message
      if (!target || target.senderInboxId === message.senderInboxId) {
        setEditedMessages(prev => ({ ...prev, [data.targetId]: data.newText }));
      } else {
        console.warn("Unauthorized edit attempt rejected for message", data.targetId);
      }
      return false;
    }
    if (data.type === 'call_signal') {
      // Prevent processing signals originating from self
      const isFromSelf = (message.senderInboxId && xmtpClient?.inboxId && message.senderInboxId === xmtpClient.inboxId) ||
                         (data.senderInboxId && xmtpClient?.inboxId && data.senderInboxId === xmtpClient.inboxId) ||
                         (data.senderAddress && walletAddress && data.senderAddress.toLowerCase() === walletAddress.toLowerCase());
      if (isFromSelf) {
        return false;
      }

      if (data.subType === 'offer') {
        const callerPeerAddr = data.senderAddress || activeConversation?.peerAddress || message.senderInboxId;
        const callerProfile = callerPeerAddr ? addressProfiles[callerPeerAddr.toLowerCase()] : null;
        setIncomingCall({
          callType: data.callType || 'voice',
          callId: data.callId,
          offer: data.sdp,
          callerAddress: callerPeerAddr,
          callerName: callerProfile?.username,
          callerAvatar: callerProfile?.profilePictureCID
        });
      } else if (data.subType === 'end' || data.subType === 'reject') {
        setIncomingCall(prev => (prev?.callId === data.callId ? null : prev));
        window.dispatchEvent(new CustomEvent('blockchat:call-signal', { detail: data }));
      } else {
        window.dispatchEvent(new CustomEvent('blockchat:call-signal', { detail: data }));
      }
      return false;
    }
    if (data.type === 'reaction' && data.targetId && data.emoji) {
      const isFromSelf = (message.senderInboxId && xmtpClient?.inboxId && message.senderInboxId === xmtpClient.inboxId) ||
                         (data.senderInboxId && xmtpClient?.inboxId && data.senderInboxId === xmtpClient.inboxId) ||
                         (data.senderAddress && walletAddress && data.senderAddress.toLowerCase() === walletAddress.toLowerCase());
      
      // If the reaction was dispatched by our own local client, it was already applied optimistically
      if (isFromSelf) {
        return false;
      }

      const senderKey = message.senderInboxId || data.senderInboxId || data.senderAddress || 'peer';
      if (!reactionUsersMapRef.current[data.targetId]) {
        reactionUsersMapRef.current[data.targetId] = {};
      }

      if (data.action === 'remove') {
        delete reactionUsersMapRef.current[data.targetId][senderKey];
      } else if (data.action === 'add') {
        reactionUsersMapRef.current[data.targetId][senderKey] = data.emoji;
      } else {
        // Fallback for legacy messages without action field
        if (reactionUsersMapRef.current[data.targetId][senderKey] === data.emoji) {
          delete reactionUsersMapRef.current[data.targetId][senderKey];
        } else {
          reactionUsersMapRef.current[data.targetId][senderKey] = data.emoji;
        }
      }

      const updatedEmojis = Array.from(new Set(Object.values(reactionUsersMapRef.current[data.targetId])));
      setReactionsMap(prev => ({
        ...prev,
        [data.targetId]: updatedEmojis
      }));
      return false;
    }
    if (data.type === 'interaction') {
      setInteractions(prev => applyInteraction(prev, data, message.senderInboxId || 'peer', data.ts));
      return false;
    }
    if (data.type === 'disappearing_config' && typeof data.timer === 'number') {
      setDisappearingTimer(data.timer);
      try {
        localStorage.setItem('blockchat_disappearing_timer', String(data.timer));
      } catch (e) {}
      return false;
    }
    if (data.type === 'arcade_duel') {
      const duelId = data.duelId;
      if (data.action === 'challenger_committed') {
        setMessages(prev => prev.map(m => {
          const d = parseMessageData(m);
          if (d.type === 'arcade_duel' && d.duelId === data.duelId) {
            return {
              ...m,
              content: `[JSON_MSG]${JSON.stringify({
                ...d,
                challenger: data.challenger || d.challenger,
                challengerInboxId: data.challengerInboxId || d.challengerInboxId,
                opponent: data.opponent || d.opponent,
                opponentInboxId: data.opponentInboxId || d.opponentInboxId,
                commitHash: data.commitHash || d.commitHash,
                onChainDuelId: data.onChainDuelId || d.onChainDuelId,
                createTxHash: data.createTxHash || d.createTxHash,
                isOnChain: (data.isOnChain !== undefined) ? data.isOnChain : d.isOnChain,
                status: d.status === 'resolved' ? 'resolved' : 'waiting_opponent'
              })}`
            };
          }
          return m;
        }));
        return false;
      }
      if (data.action === 'respond') {
        const stored = activeDuelCommitmentsRef.current[duelId];
        if (stored) {
          handleRevealDuelMoveRef.current?.(duelId, data.opponentChoice);
        } else {
          setMessages(prev => prev.map(m => {
            const d = parseMessageData(m);
            if (d.type === 'arcade_duel' && d.duelId === duelId) {
              return {
                ...m,
                content: `[JSON_MSG]${JSON.stringify({
                  ...d,
                  opponent: data.opponent || d.opponent,
                  opponentInboxId: data.opponentInboxId || d.opponentInboxId,
                  opponentChoice: data.opponentChoice || d.opponentChoice,
                  respondTxHash: data.respondTxHash || d.respondTxHash,
                  status: d.status === 'resolved' ? 'resolved' : 'waiting_reveal'
                })}`
              };
            }
            return m;
          }));
        }
        return false;
      }
      if (data.action === 'reveal') {
        const isFromSelf = (message.senderInboxId && xmtpClient?.inboxId && message.senderInboxId === xmtpClient.inboxId) ||
                           (data.challengerInboxId && xmtpClient?.inboxId && data.challengerInboxId === xmtpClient.inboxId);

        setMessages(prev => prev.map(m => {
          const d = parseMessageData(m);
          if (d.type === 'arcade_duel' && d.duelId === duelId) {
            return {
              ...m,
              content: `[JSON_MSG]${JSON.stringify({
                ...d,
                challenger: data.challenger || d.challenger,
                challengerInboxId: data.challengerInboxId || d.challengerInboxId,
                opponent: data.opponent || d.opponent,
                opponentInboxId: data.opponentInboxId || d.opponentInboxId,
                challengerChoice: data.challengerChoice || d.challengerChoice,
                salt: data.salt || d.salt,
                opponentChoice: data.opponentChoice || d.opponentChoice,
                winner: data.winner || d.winner,
                settleTxHash: data.settleTxHash || d.settleTxHash,
                status: 'resolved'
              })}`
            };
          }
          return m;
        }));

        if (!isFromSelf) {
          if (data.winner === 'opponent') {
            addArcadeXp(100, 'Arcade Duel Victory');
            triggerCoinBurst('0.001', 'Duel Bounty');
            playReceiveChime();
          } else if (data.winner === 'draw') {
            addArcadeXp(25, 'Arcade Duel Draw');
            playReceiveChime();
          } else {
            addArcadeXp(25, 'Arcade Duel Match');
            playReceiveChime();
          }
        }
        return false;
      }
      return true;
    }
    if (data.type === 'tictactoe' && data.action === 'move') {
      setMessages(prev => prev.map(m => {
        const d = parseMessageData(m);
        if (d.type === 'tictactoe' && d.gameId === data.gameId) {
          return {
            ...m,
            content: `[JSON_MSG]${JSON.stringify({
              ...d,
              board: data.board || d.board,
              turn: data.turn || d.turn,
              status: data.status || d.status,
              winner: data.winner !== undefined ? data.winner : d.winner
            })}`
          };
        }
        return m;
      }));
      playReceiveChime();
      return false;
    }
    if (data.type === 'sketch_guess' && data.action === 'solve') {
      setMessages(prev => prev.map(m => {
        const d = parseMessageData(m);
        if (d.type === 'sketch_guess' && d.sketchId === data.sketchId) {
          return {
            ...m,
            content: `[JSON_MSG]${JSON.stringify({
              ...d,
              solved: true,
              solvedBy: data.solvedBy || d.solvedBy
            })}`
          };
        }
        return m;
      }));
      playReceiveChime();
      return false;
    }
    if (data.type === 'snake_challenge' && data.action === 'defend') {
      setMessages(prev => prev.map(m => {
        const d = parseMessageData(m);
        if (d.type === 'snake_challenge' && d.challengeId === data.challengeId) {
          return {
            ...m,
            content: `[JSON_MSG]${JSON.stringify({
              ...d,
              opponent: data.opponent || d.opponent,
              opponentScore: data.opponentScore !== undefined ? data.opponentScore : d.opponentScore,
              status: 'resolved'
            })}`
          };
        }
        return m;
      }));
      playReceiveChime();
      return false;
    }
    return true;
  };

  const selectConversation = async (conversation) => {
    // Eagerly load group members if this is an XMTP group
    loadGroupMembers(conversation);

    // Authoritatively resolve and verify 1-on-1 peer address
    const myAddr = walletAddressRef.current || walletAddress || xmtpClient?.accountIdentifier?.identifier;
    if (!isGroupConversation(conversation)) {
      const resolvedPeer = await resolveConversationPeerAddress(conversation, myAddr);
      if (resolvedPeer) {
        conversation.peerAddress = resolvedPeer;
        fetchPeerProfile(resolvedPeer, providerRef.current || provider, chainIdRef.current || chainId, conversation.id);
      }
    }

    // Preserve draft of previous conversation if any
    if (activeConversation && !editingMessage) {
      const curDraft = inputValue;
      setChatDrafts(prev => {
        const updated = { ...prev, [activeConversation.id]: curDraft };
        chatDraftsRef.current = updated;
        return updated;
      });
    }

    const streamId = ++activeStreamIdRef.current;
    // Re-lock cipher chats whenever you leave a chat
    if (activeConversation?.id !== conversation.id) {
      setCipherKeys({});
      setShowCipherModal(false);
    }
    setActiveConversation(conversation);
    setReplyingTo(null);
    setSelectedImage(null);
    setEditingMessage(null);
    setInChatSearchQuery('');
    setShowInChatSearch(false);
    setShowContactDrawer(false);

    // Restore draft for newly active conversation
    const savedDraft = chatDraftsRef.current[conversation.id] || '';
    setInputValue(savedDraft);

    // Clear unread count for selected conversation
    setUnreadCounts(prev => {
      if (!prev[conversation.id]) return prev;
      const updated = { ...prev, [conversation.id]: 0 };
      try { localStorage.setItem('blockchat_unread_counts', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    if (conversation.isDemoBot) {
      // Demo bot conversation loading
      const botMsgs = await conversation.messages();
      setMessages(botMsgs);
      return;
    }

    try {
      const rawMsgs = await conversation.messages();
      if (activeStreamIdRef.current !== streamId) return;

      const displayMsgs = [];
      const newDeleted = {};
      const newEdited = {};
      const userReactions = {};
      let histInteractions = {};
      const duelSubActions = {}; // duelId -> merged subaction updates

      // First pass: collect subactions (challenger_committed, respond, reveal)
      for (const m of rawMsgs) {
        const d = parseMessageData(m);
        if (d.type === 'arcade_duel' && d.duelId) {
          if (d.action && d.action !== 'challenge') {
            if (!duelSubActions[d.duelId]) duelSubActions[d.duelId] = {};
            Object.assign(duelSubActions[d.duelId], d);
          }
        }
      }

      for (const m of rawMsgs) {
        const d = parseMessageData(m);
        if (d.type === 'call_signal') {
          continue;
        } else if (d.type === 'delete' && d.targetId) {
          const target = rawMsgs.find(orig => orig.id === d.targetId);
          if (!target || target.senderInboxId === m.senderInboxId) {
            newDeleted[d.targetId] = true;
          }
        } else if (d.type === 'edit' && d.targetId) {
          const target = rawMsgs.find(orig => orig.id === d.targetId);
          if (!target || target.senderInboxId === m.senderInboxId) {
            newEdited[d.targetId] = d.newText;
          }
        } else if (d.type === 'reaction' && d.targetId && d.emoji) {
          const sender = m.senderInboxId || d.senderInboxId || d.senderAddress || 'peer';
          if (!userReactions[d.targetId]) userReactions[d.targetId] = {};

          if (d.action === 'remove') {
            delete userReactions[d.targetId][sender];
          } else if (d.action === 'add') {
            userReactions[d.targetId][sender] = d.emoji;
          } else {
            // Legacy toggle fallback
            if (userReactions[d.targetId][sender] === d.emoji) {
              delete userReactions[d.targetId][sender];
            } else {
              userReactions[d.targetId][sender] = d.emoji;
            }
          }
        } else if (d.type === 'interaction') {
          histInteractions = applyInteraction(histInteractions, d, m.senderInboxId || 'peer', d.ts);
        } else if (d.type === 'disappearing_config' && typeof d.timer === 'number') {
          setDisappearingTimer(d.timer);
        } else if (d.type === 'arcade_duel') {
          // If it's a subaction (not the root challenge), fold it, don't display as separate card!
          if (d.action && d.action !== 'challenge') {
            const rootMsg = displayMsgs.find(orig => parseMessageData(orig).duelId === d.duelId);
            if (rootMsg) {
              const origData = parseMessageData(rootMsg);
              rootMsg.content = `[JSON_MSG]${JSON.stringify({ ...origData, ...d })}`;
            }
            continue;
          } else {
            // It's the root challenge
            const subUpdates = duelSubActions[d.duelId];
            if (subUpdates) {
              const merged = { ...d, ...subUpdates };
              displayMsgs.push({
                ...m,
                content: `[JSON_MSG]${JSON.stringify(merged)}`
              });
            } else {
              displayMsgs.push(m);
            }
          }
        } else {
          displayMsgs.push(m);
        }
      }

      reactionUsersMapRef.current = userReactions;
      const newReactions = {};
      for (const [targetId, userMap] of Object.entries(userReactions)) {
        const emojis = Object.values(userMap);
        if (emojis.length > 0) {
          newReactions[targetId] = Array.from(new Set(emojis));
        }
      }

      setDeletedMessages(prev => ({ ...prev, ...newDeleted }));
      setEditedMessages(prev => ({ ...prev, ...newEdited }));
      setReactionsMap(newReactions);
      setInteractions(histInteractions);
      messagesRef.current = displayMsgs;
      setMessages(displayMsgs);

      // Recover duels where I committed, the opponent already answered, but no reveal was sent yet
      for (const dm of displayMsgs) {
        const dd = parseMessageData(dm);
        if (
          dd.type === 'arcade_duel' &&
          dd.status !== 'resolved' &&
          dd.opponentChoice &&
          activeDuelCommitmentsRef.current[dd.duelId]
        ) {
          handleRevealDuelMoveRef.current?.(dd.duelId, dd.opponentChoice, conversation);
        }
      }
      
      const stream = await conversation.stream();
      for await (const message of stream) {
        // Cancel stream processing if user switched to another conversation
        if (activeStreamIdRef.current !== streamId) {
          break;
        }

        const isDisplayable = processIncomingMessage(message, displayMsgs);
        if (isDisplayable) {
          maybeNotifyIncoming(message);
          setMessages(prev => {
            const exists = prev.find(m => m.id === message.id);
            if (exists) return prev;
            playNotificationSound();
            return [...prev, message];
          });
        }
      }
    } catch (err) {
      console.error("Error selecting conversation", err);
    }
  };

  // Start New Conversation with ENS & Address Resolution
  const startNewConversation = async (targetInput) => {
    const rawTarget = (targetInput || newContactAddress || '').trim();
    if (!rawTarget) return;

    let targetAddress = rawTarget;
    let resolvedEns = null;

    // Check for ENS domain (e.g. vitalik.eth)
    if (rawTarget.endsWith('.eth')) {
      try {
        if (!provider) {
          alert("Wallet provider required to resolve ENS.");
          return;
        }
        const resolved = await provider.resolveName(rawTarget);
        if (!resolved) {
          alert(`Could not resolve ENS name: ${rawTarget}`);
          return;
        }
        targetAddress = resolved;
        resolvedEns = rawTarget;
      } catch (e) {
        alert(`ENS resolution error: ${e.message}`);
        return;
      }
    }

    try {
      if (!ethers.isAddress(targetAddress)) {
        alert("Please enter a valid Ethereum address (0x...) or ENS name (.eth).");
        return;
      }

      if (!xmtpClient) {
        // Fallback for demo / offline mode: start a 1-on-1 direct contact chat
        const demoDmId = `demo-dm-${targetAddress.toLowerCase()}`;
        const demoDm = {
          id: demoDmId,
          peerAddress: targetAddress.toLowerCase(),
          isGroup: false,
          isDemoBot: true,
          createdAt: new Date().toISOString(),
          sendText: async (text) => {},
          messages: async () => [],
          stream: async function* () {}
        };
        setConversations(prev => {
          const exists = prev.find(c => c.id === demoDmId);
          return exists ? prev : [demoDm, ...prev];
        });
        if (resolvedEns) {
          setAddressProfiles(prev => ({
            ...prev,
            [targetAddress.toLowerCase()]: { username: resolvedEns, profilePictureCID: '', isRegistered: true }
          }));
        } else {
          fetchPeerProfile(targetAddress);
        }
        setNewContactAddress('');
        selectConversation(demoDm);
        return;
      }

      const { IdentifierKind } = await import('@xmtp/browser-sdk');
      const contactIdentifier = {
        identifier: targetAddress.toLowerCase(),
        identifierKind: IdentifierKind ? IdentifierKind.Ethereum : 'ethereum'
      };

      const canMessageMap = await xmtpClient.canMessage([contactIdentifier]);
      const canMessage = canMessageMap.get(targetAddress.toLowerCase());
      
      if (!canMessage) {
        alert("This address has not activated XMTP yet. They need to connect their wallet to an XMTP dApp first.");
        return;
      }

      const conversation = await xmtpClient.conversations.createDmWithIdentifier(contactIdentifier);
      conversation.peerAddress = targetAddress.toLowerCase();
      
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        return exists ? prev : [conversation, ...prev];
      });
      
      if (resolvedEns) {
        setAddressProfiles(prev => ({
          ...prev,
          [targetAddress.toLowerCase()]: { username: resolvedEns, profilePictureCID: '', isRegistered: true }
        }));
      } else {
        fetchPeerProfile(targetAddress, providerRef.current || provider, chainIdRef.current || chainId, conversation.id);
      }

      setNewContactAddress('');
      selectConversation(conversation);
    } catch (error) {
      console.error("Failed to start conversation", error);
      alert("Failed to start conversation: " + error.message);
    }
  };

  // Built-in BlockBot Demo Contact
  const startBlockBotChat = () => {
    const botAddress = '0x000000000000000000000000000000000000dEaD';
    const botConvo = {
      id: 'demo-blockbot',
      peerAddress: botAddress,
      createdAt: new Date().toISOString(),
      isDemoBot: true,
      sendText: async (text) => {},
      messages: async () => [
        {
          id: 'bot-welcome-1',
          senderInboxId: 'bot-inbox',
          sentAt: new Date(new Date().getTime() - 120000).toISOString(),
          content: 'Hey there! 👋 I am BlockBot, your built-in Web3 test companion.'
        },
        {
          id: 'bot-welcome-2',
          senderInboxId: 'bot-inbox',
          sentAt: new Date(new Date().getTime() - 60000).toISOString(),
          content: 'You can test WhatsApp-style calls 📞📹, voice speed 1.5x/2x, starred messages ⭐, encrypted chat, and ETH tipping with me!'
        }
      ],
      stream: async function* () {}
    };

    setAddressProfiles(prev => ({
      ...prev,
      [botAddress.toLowerCase()]: {
        username: 'BlockBot AI 🤖',
        profilePictureCID: '',
        isRegistered: true
      }
    }));

    setConversations(prev => {
      const exists = prev.find(c => c.id === 'demo-blockbot');
      return exists ? prev : [botConvo, ...prev];
    });

    selectConversation(botConvo);
  };

  const startDemoGroupChat = () => {
    const demoGroupId = 'demo-cypher-syndicate';
    const demoAddr = '0x71C8360537aaC1957e47192070D7C98C0B29b3B1';
    const member1 = '0x3841C392576b26d83A39A2083b8b64e528b8E5b0';
    const member2 = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

    const membersList = [
      { accountIdentifiers: [{ identifier: demoAddr.toLowerCase() }], inboxId: 'user-inbox' },
      { accountIdentifiers: [{ identifier: member1.toLowerCase() }], inboxId: 'inbox-cypher' },
      { accountIdentifiers: [{ identifier: member2.toLowerCase() }], inboxId: 'inbox-knight' }
    ];

    const groupConvo = {
      id: demoGroupId,
      isGroup: true,
      groupName: 'Cypher Syndicate 👾',
      name: 'Cypher Syndicate 👾',
      isDemoBot: true,
      createdAt: new Date().toISOString(),
      sendText: async (text) => {},
      messages: async () => [
        {
          id: 'demo-grp-msg-1',
          senderInboxId: 'inbox-cypher',
          senderName: 'CypherPunk #42',
          sentAt: new Date(new Date().getTime() - 120000).toISOString(),
          content: '👾 Welcome to Cypher Syndicate! Test group features here — click "+ Add" above or the PixelAlien button to manage members!'
        },
        {
          id: 'demo-grp-msg-2',
          senderInboxId: 'inbox-knight',
          senderName: 'PixelKnight 🛡️',
          sentAt: new Date(new Date().getTime() - 60000).toISOString(),
          content: 'You can test /add [0xAddress], /poll, or /gift right in this group chat.'
        }
      ],
      stream: async function* () {}
    };

    setGroupMembersCache(prev => ({
      ...prev,
      [demoGroupId]: membersList
    }));

    setConversations(prev => {
      const exists = prev.find(c => c.id === demoGroupId);
      return exists ? prev : [groupConvo, ...prev];
    });

    selectConversation(groupConvo);
    return groupConvo;
  };

  const startDemoMode = () => {
    const demoAddr = '0x71C8360537aaC1957e47192070D7C98C0B29b3B1';
    setWalletAddress(demoAddr);
    setUserBalance('1.854');
    setNetworkName('Sepolia Testnet');
    setChainId(11155111);
    setUserProfile({
      username: 'Web3_Explorer',
      profilePictureCID: '',
      isRegistered: true
    });
    setProfileFormUsername('Web3_Explorer');
    startBlockBotChat();
    startDemoGroupChat();
  };

  // Bot Response Simulator for BlockBot Demo (With WhatsApp "Typing..." state)
  const triggerBotReply = (userMsgText, type = 'text', extraData = null) => {
    setPeerTyping(true);

    setTimeout(() => {
      setPeerTyping(false);
      let replyContent = "Encrypted message verified! 🚀 BlockChat is performing at peak efficiency.";
      if (type === 'crypto_transfer') {
        replyContent = "Thank you so much for the ETH tip! 💎 Transaction confirmed and logged to blockchain state.";
      } else if (type === 'crypto_request') {
        replyContent = "Invoice received! 📥 Ready to settle on-chain whenever you are.";
      } else if (type === 'audio') {
        replyContent = "Received your voice note! 🎙️ Decoded audio waveform with 100% clarity.";
      } else if (type === 'media') {
        replyContent = "Media packet received and cached! 📷 Great photo.";
      } else if (type === 'arcade_duel') {
        replyContent = "⚔️ Duel challenge initiated! Choose your hand to throw first.";
      } else if (type === 'arcade_duel_turn') {
        // BlockBot defends with its hand
        const botMoves = ['rock', 'paper', 'scissors'];
        const botMove = botMoves[Math.floor(Math.random() * botMoves.length)];
        const duelId = extraData?.duelId;
        const userChoice = extraData?.userChoice;
        const winner = determineRpsWinner(userChoice, botMove);
        setMessages(prev => prev.map(m => {
          const d = parseMessageData(m);
          if (d.type === 'arcade_duel' && d.duelId === duelId) {
            return {
              ...m,
              content: `[JSON_MSG]${JSON.stringify({
                ...d,
                opponent: 'BlockBot AI 🤖',
                opponentChoice: botMove,
                challengerChoice: userChoice,
                winner,
                status: 'resolved'
              })}`
            };
          }
          return m;
        }));

        const rules = {
          'rock:scissors': 'Rock crushes Scissors!',
          'scissors:paper': 'Scissors cuts Paper!',
          'paper:rock': 'Paper covers Rock!'
        };
        let narrative = '';
        if (winner === 'draw') narrative = `Both threw ${userChoice.toUpperCase()} — Draw! 🤝`;
        else if (winner === 'challenger') narrative = `${rules[`${userChoice}:${botMove}`] || ''} You win! +100 XP! 🏆`;
        else narrative = `${rules[`${botMove}:${userChoice}`] || ''} BlockBot wins! 🤖`;

        if (winner === 'challenger') {
          addArcadeXp(100, 'Arcade Duel Victory');
          triggerCoinBurst('0.001', 'Duel Bounty');
          playReceiveChime();
        } else if (winner === 'draw') {
          addArcadeXp(25, 'Arcade Duel Draw');
        } else {
          addArcadeXp(25, 'Arcade Duel Match');
        }
        replyContent = `⚔️ I threw ${botMove.toUpperCase()}! ${narrative}`;
      } else if (type === 'poll') {
        replyContent = "📊 Poll received! I'll cast my vote in a moment.";
      } else if (type === 'gift_packet') {
        replyContent = "🧧 A gift packet! Let me grab a slot before they're gone.";
      } else if (type === 'time_capsule') {
        replyContent = "Vault coordinates locked! ⏳ I have secured your time capsule in memory.";
      } else if (type === 'copilot_widget') {
        if (extraData?.widgetType === 'flip') {
          replyContent = `Nice flip! 🪙 The entropy was verified on-chain.`;
        } else if (extraData?.widgetType === 'roll') {
          replyContent = `Dice rolled! 🎲 Result: ${extraData?.result}.`;
        } else if (extraData?.widgetType === 'gas') {
          replyContent = `Gas tracker confirmed! ⛽ L2s are running ultra-smooth today.`;
        } else if (extraData?.widgetType === 'price') {
          replyContent = `Price ticker verified! 📈 Keep stacking those sats and gwei.`;
        } else if (extraData?.widgetType === 'trivia') {
          replyContent = `Trivia battle ready! 👾 Pick your answer wisely for +50 XP.`;
        }
      } else if (type === 'tictactoe_turn') {
        const gameId = extraData?.gameId;
        const currentBoard = extraData?.board || [];
        const openSpots = [];
        currentBoard.forEach((val, idx) => {
          if (!val) openSpots.push(idx);
        });

        if (openSpots.length > 0) {
          const botChoice = openSpots[Math.floor(Math.random() * openSpots.length)];
          const nextBoard = [...currentBoard];
          nextBoard[botChoice] = 'O';
          const evalRes = checkTicTacToeWinner(nextBoard);

          setMessages(prev => prev.map(m => {
            const d = parseMessageData(m);
            if (d.type === 'tictactoe' && d.gameId === gameId) {
              return {
                ...m,
                content: `[JSON_MSG]${JSON.stringify({
                  ...d,
                  board: nextBoard,
                  turn: 'X',
                  status: evalRes ? 'resolved' : 'active',
                  winner: evalRes?.winner || null
                })}`
              };
            }
            return m;
          }));

          if (evalRes?.winner === 'O') {
            replyContent = "❌⭕ I placed 'O' and took 3-in-a-row! Good game! 🤖";
            addArcadeXp(25, 'Tic-Tac-Toe Match');
          } else if (evalRes?.winner === 'draw') {
            replyContent = "❌⭕ Stated at a draw! Stalemate across the grid. 🤝";
            addArcadeXp(25, 'Tic-Tac-Toe Draw');
          } else {
            replyContent = `❌⭕ I placed my token at cell #${botChoice + 1}. Your turn!`;
          }
        }
      } else if (type === 'sketch_guess') {
        const sketchId = extraData?.sketchId;
        const secretWord = extraData?.secretWord || 'ROCKET';
        handleSolveSketch(sketchId, 'BlockBot AI 🤖');
        replyContent = `🎨 Eureka! That 16x16 pixel masterpiece is definitely a ${secretWord.toUpperCase()}! 🚀 Fantastic drawing.`;
        playReceiveChime();
        addArcadeXp(50, 'Sketch Solved by Bot');
      } else if (type === 'snake_challenge') {
        const challengeId = extraData?.challengeId;
        const targetScore = extraData?.targetScore || 100;
        const botScore = targetScore + Math.floor(Math.random() * 50) - 20;

        setMessages(prev => prev.map(m => {
          const d = parseMessageData(m);
          if (d.type === 'snake_challenge' && d.challengeId === challengeId) {
            return {
              ...m,
              content: `[JSON_MSG]${JSON.stringify({
                ...d,
                opponent: 'BlockBot AI 🤖',
                opponentScore: botScore,
                status: 'resolved'
              })}`
            };
          }
          return m;
        }));

        if (botScore > targetScore) {
          replyContent = `🐍 Challenge accepted! I just slithered my way to ${botScore} pts! Beat that next time! 🤖`;
        } else {
          replyContent = `🐍 Phew! I only managed ${botScore} pts. Your score of ${targetScore} pts is untouchable! 🏆`;
          addArcadeXp(100, 'Snake Challenge Victory');
        }
      } else if (userMsgText && (userMsgText.toLowerCase().includes('hello') || userMsgText.toLowerCase().includes('hi'))) {
        replyContent = "Greetings! ⚡ Excited to pair with you on decentralized messaging.";
      }

      // BlockBot plays a peer who knows the shared key: reply encrypted while the chat is unlocked
      const botCipherKey = cipherKeysRef.current['demo-blockbot'];
      const botMessage = {
        id: `bot-reply-${new Date().getTime()}`,
        senderInboxId: 'bot-inbox',
        senderName: 'BlockBot AI 🤖',
        sentAt: new Date().toISOString(),
        content: botCipherKey ? encryptPlayfair(replyContent, botCipherKey) : replyContent
      };

      const curId = activeConversationRef.current?.id;
      if (curId === 'demo-blockbot') {
        setMessages(prev => [...prev, botMessage]);
      } else if (curId) {
        setUnreadCounts(prev => {
          const next = (prev[curId] || 0) + 1;
          const updated = { ...prev, [curId]: next };
          try { localStorage.setItem('blockchat_unread_counts', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
      playNotificationSound();
    }, 1100);
  };

  // Toggle Pinned Conversation
  const togglePinConversation = (e, convoId) => {
    e.stopPropagation();
    setPinnedConvos(prev => {
      const updated = { ...prev, [convoId]: !prev[convoId] };
      try {
        localStorage.setItem('blockchat_pinned_convos', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  // Image Upload Handler
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Please select an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedImage({
          dataUrl: uploadEvent.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Notes Recorder
  const startRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert("Voice recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error", err);
      alert("Could not access microphone: " + err.message);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  const sendVoiceNote = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    const duration = recordingDuration;
    clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result;
        try {
          const payload = {
            type: 'audio',
            audioUrl: base64Audio,
            duration: duration || 1,
            replyTo: replyingTo ? buildReplyRef(replyingTo) : null,
            timestamp: new Date().getTime()
          };
          const textPayload = `[JSON_MSG]${JSON.stringify(payload)}`;

          if (activeConversation?.isDemoBot) {
            const demoMsg = {
              id: `demo-vn-${new Date().getTime()}`,
              senderInboxId: xmtpClient?.inboxId || 'user-inbox',
              sentAt: new Date().toISOString(),
              content: textPayload
            };
            setMessages(prev => [...prev, demoMsg]);
            triggerBotReply('', 'audio');
          } else {
            await activeConversation.sendText(textPayload);
          }
          playSendPop();
          addArcadeXp(20, 'Voice Note Broadcast');
          setReplyingTo(null);
        } catch (err) {
          console.error("Failed to send voice note", err);
          alert("Failed to send voice note: " + err.message);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Edit & Delete Handlers
  const handleStartEdit = (msg) => {
    const rawText = editedMessages[msg.id] || parseMessageData(msg).text;
    const currentText = revealText(rawText);
    setEditingMessage({ id: msg.id, originalText: currentText, wasCipher: isPlayfairEnvelope(rawText) });
    setInputValue(currentText);
    setSelectedImage(null);
    setReplyingTo(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputValue('');
  };

  const handleDeleteMessage = async (msg) => {
    if (!confirm("Delete this message for everyone?")) return;
    try {
      const deletePayload = {
        type: 'delete',
        targetId: msg.id,
        timestamp: new Date().getTime()
      };
      const textPayload = `[JSON_MSG]${JSON.stringify(deletePayload)}`;
      if (activeConversation && !activeConversation.isDemoBot) {
        await activeConversation.sendText(textPayload);
      }
      setDeletedMessages(prev => ({ ...prev, [msg.id]: true }));
    } catch (err) {
      console.error("Failed to delete message", err);
      alert("Failed to delete message: " + err.message);
    }
  };

  // Send Message (or Save Edit, or Direct Programmatic Share)
  const handleSendMessage = async (e, directText = null) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!activeConversation) return;

    const explicitText = typeof e === 'string' ? e : directText;
    const rawText = explicitText !== null && explicitText !== undefined ? explicitText : inputValue;

    // A cipher-locked chat can't send until the key is entered
    if (isCipherLocked) {
      setShowCipherModal(true);
      return;
    }

    // Handle saving an edited message
    if (editingMessage && !explicitText) {
      if (!rawText.trim()) return;
      try {
        // Encrypted messages stay encrypted when edited
        const newText = editingMessage.wasCipher && activeCipherKey
          ? encryptPlayfair(rawText.trim(), activeCipherKey)
          : sealText(rawText.trim());
        const editPayload = {
          type: 'edit',
          targetId: editingMessage.id,
          newText,
          timestamp: new Date().getTime()
        };
        const textPayload = `[JSON_MSG]${JSON.stringify(editPayload)}`;
        if (!activeConversation.isDemoBot) {
          await activeConversation.sendText(textPayload);
        }
        setEditedMessages(prev => ({ ...prev, [editingMessage.id]: newText }));
        setEditingMessage(null);
        setInputValue('');
      } catch (err) {
        console.error("Failed to edit message", err);
        alert("Failed to edit message: " + err.message);
      }
      return;
    }

    // Intercept Copilot Slash Commands
    const trimmedInput = rawText.trim();
    if (trimmedInput.startsWith('/') && !selectedImage && !editingMessage && !explicitText) {
      setShowCopilotPalette(false);
      const parts = trimmedInput.split(/\s+/);
      const command = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ');

      setInputValue('');
      if (activeConversation) {
        setChatDrafts(prev => {
          const updated = { ...prev };
          delete updated[activeConversation.id];
          chatDraftsRef.current = updated;
          return updated;
        });
      }

      if (command === '/flip') {
        await executeSlashFlip();
        return;
      }
      if (command === '/roll') {
        const sides = parseInt(arg, 10) || 6;
        await executeSlashRoll(sides);
        return;
      }
      if (command === '/gas') {
        await executeSlashGas();
        return;
      }
      if (command === '/price') {
        await executeSlashPrice(arg || 'eth');
        return;
      }
      if (command === '/trivia') {
        await executeSlashTrivia();
        return;
      }
      if (command === '/duel') {
        await handleSendDuelChallenge(arg || '0');
        return;
      }
      if (command === '/capsule') {
        setShowTimeCapsuleModal(true);
        return;
      }
      if (command === '/poll') {
        await handleSendPoll(arg);
        return;
      }
      if (command === '/gift') {
        await handleSendGift(arg);
        return;
      }
      if (command === '/split') {
        await handleSendSplit(arg);
        return;
      }
      if (command === '/export') {
        handleExportChat((arg || 'json').toLowerCase());
        return;
      }
      if (command === '/notify') {
        await handleEnableNotifications();
        return;
      }
      if (command === '/group') {
        setShowCreateGroupModal(true);
        return;
      }
      if (command === '/add' || command === '/invite') {
        if (!arg) {
          setShowGroupMembersModal(true);
          return;
        }
        try {
          await handleAddGroupMember(arg.trim());
          const confirmMsg = `👾 Added ${arg.trim().slice(0, 6)}…${arg.trim().slice(-4)} to the group!`;
          if (activeConversation.isDemoBot) {
            setMessages(prev => [...prev, {
              id: `sys-${Date.now()}`,
              senderInboxId: 'bot-inbox',
              sentAt: new Date().toISOString(),
              content: confirmMsg
            }]);
          } else {
            await activeConversation.sendText(confirmMsg);
          }
        } catch (e) {
          alert(e.message || 'Failed to add member.');
        }
        return;
      }
      if (command === '/help') {
        const helpText = "🕹️ **BLOCKCHAT COPILOT COMMANDS**\n• `/flip`: Provably fair coin toss\n• `/roll [sides]`: Roll tabletop dice (e.g. /roll 20)\n• `/gas`: Check live gas across ETH, Base, Sepolia, Arbitrum\n• `/price [eth/btc/sol]`: Real-time crypto price ticker\n• `/trivia`: Crypto & arcade trivia duel\n• `/duel [wager]`: 1v1 Cypher RPS arcade duel\n• `/capsule`: Seal a timelocked vault capsule\n• `/poll Q | A | B`: Live vote in chat\n• `/gift [eth] [slots] [message]`: Drop an on-chain ETH gift packet\n• `/split [eth] [people] [note]`: Split a bill into invoices\n• `/export [json|txt]`: Download this chat\n• `/notify`: Enable desktop alerts\n• `/group`: Create decentralized group chat\n• `/add [0xaddr]`: Add member to group";
        if (activeConversation.isDemoBot) {
          const localMsg = {
            id: `demo-help-${Date.now()}`,
            senderInboxId: 'bot-inbox',
            sentAt: new Date().toISOString(),
            content: helpText
          };
          setMessages(prev => [...prev, localMsg]);
        } else {
          await activeConversation.sendText(helpText);
        }
        playReceiveChime();
        return;
      }
    }

    // Normal Send
    if (!trimmedInput && !selectedImage) return;

    try {
      let payload = {};

      if (selectedImage || replyingTo) {
        payload = {
          type: selectedImage ? 'media' : 'text',
          text: sealText(trimmedInput),
          media: selectedImage ? selectedImage.dataUrl : null,
          replyTo: replyingTo ? buildReplyRef(replyingTo) : null,
          timestamp: new Date().getTime()
        };
        const textPayload = `[JSON_MSG]${JSON.stringify(payload)}`;
        if (activeConversation.isDemoBot) {
          const localMsg = {
            id: `demo-msg-${new Date().getTime()}`,
            senderInboxId: xmtpClient?.inboxId || 'user-inbox',
            sentAt: new Date().toISOString(),
            content: textPayload
          };
          setMessages(prev => [...prev, localMsg]);
          if (!isGroupConversation(activeConversation) && activeConversation.id === 'demo-blockbot') {
            triggerBotReply(trimmedInput, selectedImage ? 'media' : 'text');
          }
        } else {
          await activeConversation.sendText(textPayload);
        }
      } else {
        if (activeConversation.isDemoBot) {
          const localMsg = {
            id: `demo-msg-${new Date().getTime()}`,
            senderInboxId: xmtpClient?.inboxId || 'user-inbox',
            sentAt: new Date().toISOString(),
            content: sealText(trimmedInput)
          };
          setMessages(prev => [...prev, localMsg]);
          if (!isGroupConversation(activeConversation) && activeConversation.id === 'demo-blockbot') {
            triggerBotReply(trimmedInput, 'text');
          }
        } else {
          await activeConversation.sendText(sealText(trimmedInput));
        }
      }

      playSendPop();
      addArcadeXp(selectedImage ? 15 : 10, 'Message Sent');
      if (!explicitText) {
        setInputValue('');
        if (activeConversation) {
          setChatDrafts(prev => {
            const updated = { ...prev };
            delete updated[activeConversation.id];
            chatDraftsRef.current = updated;
            return updated;
          });
        }
        setSelectedImage(null);
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Failed to send message: " + err.message);
    }
  };

  // Crypto Transfer / Request Handler (with status & chainId tracking)
  const handleCryptoTransferSuccess = async ({ amount, txHash, note, status = 'confirmed', type = 'crypto_transfer' }) => {
    if (!activeConversation) return;

    if (type === 'crypto_request') {
      try {
        await sendOnChainInvoice({ amount, note, maxPayers: 1, previewText: `Invoice: ${amount} ETH` });
        addArcadeXp(25, 'Payment Request Broadcast');
      } catch (err) {
        console.error("Failed to create on-chain invoice", err);
        alert('Could not create invoice: ' + (err.reason || err.shortMessage || err.message));
      }
      return;
    }

    try {
      // Prevent duplicate processing of the same transaction
      if (txHash && sentTxHashesRef.current.has(txHash)) {
        return;
      }
      if (txHash) {
        sentTxHashesRef.current.add(txHash);
      }

      // Check if a receipt for this txHash is already recorded
      const alreadyExists = messages.some(m => {
        const d = parseMessageData(m);
        return d.type === 'crypto_transfer' && d.txHash === txHash;
      });

      // If already recorded and this is a confirmation update, update existing receipt status and return
      if (status === 'confirmed' && alreadyExists) {
        setMessages(prev => prev.map(m => {
          const d = parseMessageData(m);
          if (d.type === 'crypto_transfer' && d.txHash === txHash) {
            const updatedData = { ...d, status: 'confirmed' };
            return { ...m, content: `[JSON_MSG]${JSON.stringify(updatedData)}` };
          }
          return m;
        }));

        if (provider && walletAddress) {
          refreshBalance(provider, walletAddress);
        }
        triggerCoinBurst(amount, note);
        addArcadeXp(50, 'ETH Tip Confirmed');
        return;
      }

      const cryptoPayload = {
        type: 'crypto_transfer',
        amount: amount,
        txHash: txHash,
        note: note,
        status: status,
        chainId: chainId,
        from: walletAddress,
        to: activeConversation.peerAddress,
        timestamp: new Date().getTime()
      };
      const textPayload = `[JSON_MSG]${JSON.stringify(cryptoPayload)}`;

      // If paying a pending invoice request, mark it paid
      if (cryptoModalPreset.requestId) {
        setMessages(prev => prev.map(m => {
          const d = parseMessageData(m);
          if (d.type === 'crypto_request' && (d.requestId === cryptoModalPreset.requestId || m.id === cryptoModalPreset.requestId)) {
            return {
              ...m,
              content: `[JSON_MSG]${JSON.stringify({ ...d, status: 'paid', paidTxHash: txHash })}`
            };
          }
          return m;
        }));
      }

      if (activeConversation.isDemoBot) {
        const localMsg = {
          id: `demo-crypto-${new Date().getTime()}`,
          senderInboxId: xmtpClient?.inboxId || 'user-inbox',
          sentAt: new Date().toISOString(),
          content: textPayload
        };
        setMessages(prev => [...prev, localMsg]);
        triggerBotReply('', 'crypto_transfer');
      } else {
        await activeConversation.sendText(textPayload);
      }

      triggerCoinBurst(amount, note);
      addArcadeXp(50, 'ETH Tip Broadcasted');

      // Refresh balance
      if (provider && walletAddress) {
        refreshBalance(provider, walletAddress);
      }
    } catch (err) {
      console.error("Failed to record crypto transfer message", err);
    }
  };

  const handleAddReaction = async (messageId, emoji) => {
    const mySenderId = xmtpClient?.inboxId || walletAddress || 'me';
    if (!reactionUsersMapRef.current[messageId]) {
      reactionUsersMapRef.current[messageId] = {};
    }

    const currentEmoji = reactionUsersMapRef.current[messageId][mySenderId];
    const isRemoving = currentEmoji === emoji;

    if (isRemoving) {
      delete reactionUsersMapRef.current[messageId][mySenderId];
    } else {
      reactionUsersMapRef.current[messageId][mySenderId] = emoji;
    }

    const updatedEmojis = Array.from(new Set(Object.values(reactionUsersMapRef.current[messageId])));
    setReactionsMap(prev => ({
      ...prev,
      [messageId]: updatedEmojis
    }));
    setActiveReactionPicker(null);
    if (!isRemoving) addArcadeXp(5, 'Reaction Added');

    // 2. Broadcast reaction over XMTP network to peer
    if (activeConversation) {
      try {
        const reactionPayload = {
          type: 'reaction',
          targetId: messageId,
          emoji: emoji,
          action: isRemoving ? 'remove' : 'add',
          senderInboxId: xmtpClient?.inboxId || walletAddress,
          senderAddress: walletAddress,
          timestamp: new Date().getTime()
        };
        const textPayload = `[JSON_MSG]${JSON.stringify(reactionPayload)}`;

        if (activeConversation.isDemoBot) {
          if (!isRemoving) triggerBotReply(emoji, 'text');
        } else {
          await activeConversation.sendText(textPayload);
        }
      } catch (err) {
        console.error("Failed to broadcast reaction over XMTP:", err);
      }
    }
  };

  // WebRTC Call Signaling over XMTP
  const handleSendCallSignal = async (signalData) => {
    if (!activeConversation) return;
    try {
      const payload = {
        type: 'call_signal',
        senderInboxId: xmtpClient?.inboxId || walletAddress,
        senderAddress: walletAddress,
        ...signalData,
        timestamp: new Date().getTime()
      };
      const textPayload = `[JSON_MSG]${JSON.stringify(payload)}`;

      if (activeConversation.isDemoBot) {
        if (signalData.subType === 'offer') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('blockchat:call-signal', {
              detail: { subType: 'demo_connected', callId: signalData.callId }
            }));
          }, 2400);
        }
      } else {
        await activeConversation.sendText(textPayload);
      }
    } catch (err) {
      console.warn("Failed to send call signal over XMTP:", err);
    }
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      type: incomingCall.callType,
      isOutgoing: false,
      callId: incomingCall.callId,
      initialOffer: incomingCall.offer,
      peerAddress: incomingCall.callerAddress,
      peerName: incomingCall.callerName,
      peerAvatar: incomingCall.callerAvatar
    });
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall) return;
    handleSendCallSignal({
      subType: 'reject',
      callId: incomingCall.callId
    });
    setIncomingCall(null);
  };

  // Group Conversation Identifier
  const isGroupConversation = (convo) => {
    if (!convo) return false;

    // 1. Explicit group flag (e.g. demo group, local group object)
    if (convo.isGroup === true) return true;
    if (convo.isGroup === false) return false;

    // 2. Class check from @xmtp/browser-sdk
    if (convo.constructor?.name === 'Group') return true;
    if (convo.constructor?.name === 'Dm') return false;

    // 3. Group-only methods in @xmtp/browser-sdk
    if (typeof convo.addMembersByIdentifiers === 'function') return true;
    if (typeof convo.updateName === 'function') return true;
    if (typeof convo.updateImageUrl === 'function') return true;
    if (typeof convo.updateDescription === 'function') return true;

    // 4. DM-only methods in @xmtp/browser-sdk
    if (typeof convo.peerInboxId === 'function') return false;
    if (typeof convo.duplicateDms === 'function') return false;

    // 5. Metadata checks
    if (convo.metadata?.conversationType === 1 || convo.metadata?.conversationType === 'group') return true;
    if (convo.metadata?.conversationType === 0 || convo.metadata?.conversationType === 'dm') return false;

    // 6. Name / bot / address heuristics
    if (Boolean(convo.groupName)) return true;
    if (convo.isDemoBot && !convo.groupName) return false;
    if (convo.peerAddress && !convo.groupName && !convo.name) return false;

    return false;
  };

  // Helpers
  // `locked: true` always shows cipher text scrambled, even if the chat is unlocked
  const getMessageSnippet = (msg, { convoId = activeConversation?.id, locked = false } = {}) => {
    const show = (text) => (locked ? getPlayfairCipherText(text) : revealText(text, convoId));
    if (deletedMessages[msg.id]) return '🚫 Deleted message';
    if (editedMessages[msg.id]) return show(editedMessages[msg.id]);
    const data = parseMessageData(msg);
    if (data.type === 'crypto_transfer') return `💸 Sent ${data.amount} ETH`;
    if (data.type === 'crypto_request') return `📥 Request: ${data.amount} ETH`;
    if (data.type === 'arcade_duel') return '⚔️ Cypher RPS Duel';
    if (data.type === 'time_capsule') return '⏳ Timelocked Vault Capsule';
    if (data.type === 'copilot_widget') return `🤖 Copilot ${data.widgetType?.toUpperCase() || 'Action'}`;
    if (data.type === 'poll') return `📊 Poll: ${data.question || ''}`;
    if (data.type === 'gift_packet') return data.onChainPacketId ? `🧧 ETH Gift Packet (${data.totalEth} ETH)` : `🧧 XP Gift Packet (${data.totalXp} XP)`;
    if (data.type === 'media') return data.text ? `📷 ${show(data.text)}` : '📷 Photo';
    if (data.type === 'audio') return `🎤 Voice Note (${data.duration || 0}s)`;
    return show(data.text) || 'Message';
  };

  // Quoted-reply reference for an outgoing message: encrypted if this message is encrypted,
  // otherwise only ever the scrambled form so no plaintext leaks out of a cipher chat
  const buildReplyRef = (msg) => ({
    id: msg.id,
    text: isEncryptingOutgoing ? sealText(getMessageSnippet(msg)) : getMessageSnippet(msg, { locked: true }),
    sender: msg.senderInboxId === xmtpClient?.inboxId ? 'You' : 'Peer'
  });

  // Memoized Filtered Conversations based on Search, Nicknames, Pinned, and Tabs
  const filteredConversations = useMemo(() => {
    return conversations
      .filter(convo => {
        const isGroup = isGroupConversation(convo);
        const peerAddr = isGroup ? null : convo.peerAddress;
        const peerProf = !isGroup ? ((peerAddr && addressProfiles[peerAddr.toLowerCase()]) || addressProfiles[convo.id?.toLowerCase()]) : null;
        const displayId = isGroup ? (convo.groupName || convo.name || convo.id || '') : (peerAddr || convo.id || '');
        const customNick = !isGroup ? ((peerAddr && customNicknames[peerAddr.toLowerCase()]) || customNicknames[convo.id?.toLowerCase()] || '') : '';
        const name = isGroup ? (convo.groupName || convo.name || 'Group Chat') : (peerProf?.username || displayId);
        const q = searchQuery.toLowerCase();
        const matchesSearch = name.toLowerCase().includes(q) || 
                              customNick.toLowerCase().includes(q) || 
                              displayId.toLowerCase().includes(q);
        if (!matchesSearch) return false;

        if (activeTab === 'pinned') {
          return !!pinnedConvos[convo.id];
        }
        if (activeTab === 'unread') {
          return (unreadCounts[convo.id] || 0) > 0;
        }
        return true;
      })
      .sort((a, b) => {
        const aPinned = !!pinnedConvos[a.id];
        const bPinned = !!pinnedConvos[b.id];
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [conversations, addressProfiles, customNicknames, unreadCounts, searchQuery, activeTab, pinnedConvos]);

  const pinnedCount = useMemo(() => {
    return Object.values(pinnedConvos).filter(Boolean).length;
  }, [pinnedConvos]);

  const unreadTotalCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((acc, count) => acc + (Number(count) > 0 ? 1 : 0), 0);
  }, [unreadCounts]);

  // Memoized Filtered Messages for active in-thread search and disappearing messages
  const visibleMessages = useMemo(() => {
    return messages.filter(msg => {
      // Check Disappearing timer
      if (disappearingTimer > 0 && msg.sentAt) {
        const ageSeconds = (new Date().getTime() - new Date(msg.sentAt).getTime()) / 1000;
        if (ageSeconds > disappearingTimer) {
          return false;
        }
      }
      if (!inChatSearchQuery.trim()) return true;
      const data = parseMessageData(msg);
      const text = revealText(editedMessages[msg.id] || data.text) || revealText(data.note) || '';
      return text.toLowerCase().includes(inChatSearchQuery.toLowerCase());
    });
  }, [messages, disappearingTimer, inChatSearchQuery, editedMessages, cipherKeys, activeConversation]);

  return (
    <div className={`app-container whatsapp-app-container ${walletAddress ? 'has-wallet' : 'no-wallet'} ${activeConversation ? 'has-active-chat' : 'no-active-chat'}`}>
      {/* 1. WhatsApp Sidebar (Left 380px-420px) */}
      <div className="sidebar whatsapp-sidebar">
        {/* WhatsApp Top Profile & Controls Header */}
        <div className="whatsapp-sidebar-header">
          <div 
            className="whatsapp-my-avatar-wrap"
            onClick={() => setShowProfileModal(true)}
            title="Profile & Settings"
          >
            <div className="whatsapp-avatar">
              {userProfile.profilePictureCID ? (
                <img 
                  src={userProfile.profilePictureCID.startsWith('http') ? userProfile.profilePictureCID : `https://ipfs.io/ipfs/${userProfile.profilePictureCID}`} 
                  alt="My Avatar" 
                />
              ) : (
                (userProfile.username || walletAddress || '☕').substring(0, 2).toUpperCase()
              )}
            </div>
            {walletAddress && <span className="whatsapp-online-dot"></span>}
          </div>

          {arcadeRank && (
            <div 
              className="whatsapp-sidebar-rank"
              onClick={() => setShowProfileModal(true)}
              title={`Arcade Rank: LVL ${arcadeRank.level} ${arcadeRank.title} (${arcadeRank.currentXp}/${arcadeRank.nextRankMin} XP)`}
            >
              <span>{arcadeRank.badge}</span>
              <span>LVL {arcadeRank.level}</span>
            </div>
          )}

          <div className="whatsapp-header-actions">
            {/* BlockBot AI Companion Button */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Chat with BlockBot Companion"
              onClick={startBlockBotChat}
            >
              <PixelRobot size={18} color="#00f0ff" />
            </button>

            {/* New XMTP Group Button (repurposing PixelAlien logo) */}
            <button
              type="button"
              className="whatsapp-icon-btn group-btn"
              title="Create New Group Chat"
              onClick={() => {
                if (!walletAddress) {
                  startDemoMode();
                }
                setShowCreateGroupModal(true);
              }}
            >
              <PixelAlien size={18} color="var(--arcade-neon-magenta, #ff007f)" />
            </button>

            {/* Wallet QR Code Button */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Share Wallet QR"
              onClick={() => setShowQRModal(true)}
            >
              <PixelQr size={18} color="#ffd166" />
            </button>


            {/* Arcade Cabinet Themes & Sound Studio */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Arcade Cabinet Themes & 8-Bit Audio Studio"
              onClick={() => setShowThemeModal(true)}
            >
              <PixelGamepad size={18} color="#00f0ff" />
            </button>

            {/* Quick 8-Bit Audio Mute/Unmute */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title={soundEnabled ? "8-Bit Arcade SFX: Active (Click to Mute)" : "8-Bit Arcade SFX: Muted (Click to Unmute)"}
              onClick={handleToggleSound}
            >
              {soundEnabled ? <PixelVolume size={18} color="#39ff14" /> : <PixelMute size={18} color="#8b9bb4" />}
            </button>

            {/* Profile Settings */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Settings & Profile"
              onClick={() => setShowProfileModal(true)}
            >
              <PixelMore size={18} color="#d8e2ec" />
            </button>
          </div>
        </div>

        {/* WhatsApp Search Bar & Filter Tabs */}
        <div className="whatsapp-search-container">
          <div className="whatsapp-search-pill" onClick={() => searchInputRef.current?.focus()}>
            <span className="whatsapp-search-icon">🔍</span>
            <input 
              ref={searchInputRef}
              type="text" 
              className="whatsapp-search-input" 
              placeholder="Search or start new chat" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="whatsapp-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
          
          {/* WhatsApp Filter Tabs */}
          <div className="whatsapp-filter-pills">
            <button 
              type="button" 
              className={`whatsapp-filter-pill ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              type="button" 
              className={`whatsapp-filter-pill ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread {unreadTotalCount > 0 ? `(${unreadTotalCount})` : ''}
            </button>
            <button 
              type="button" 
              className={`whatsapp-filter-pill ${activeTab === 'pinned' ? 'active' : ''}`}
              onClick={() => setActiveTab('pinned')}
            >
              Pinned ({pinnedCount})
            </button>
          </div>
        </div>

        {/* Inline Add Contact / ENS bar */}
        {walletAddress && (
          <div className="whatsapp-new-chat-bar">
            <input 
              type="text" 
              className="whatsapp-new-chat-input" 
              placeholder="Enter 0x... or name.eth" 
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startNewConversation()}
            />
            <button 
              type="button" 
              className="whatsapp-new-chat-btn" 
              onClick={() => startNewConversation()}
              title="Start Chat"
            >
              +
            </button>
          </div>
        )}

        {/* WhatsApp Conversations List */}
        <div className="whatsapp-chat-list chat-list">
          {filteredConversations.map(convo => {
            const isGroup = isGroupConversation(convo);
            const peerAddr = isGroup ? null : convo.peerAddress;
            const peerProf = !isGroup ? ((peerAddr && addressProfiles[peerAddr.toLowerCase()]) || addressProfiles[convo.id?.toLowerCase()]) : null;
            const displayId = isGroup ? (convo.groupName || convo.name || convo.id || "Group Chat") : (peerAddr || convo.id || "Unknown");
            const displayName = isGroup ? (convo.groupName || convo.name || "Group Chat") : getContactDisplayName(peerAddr || displayId, peerProf);
            const customNick = !isGroup ? ((peerAddr && customNicknames[peerAddr.toLowerCase()]) || customNicknames[convo.id?.toLowerCase()]) : null;
            const avatarChar = isGroup 
              ? (displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) || 'GP').toUpperCase()
              : (customNick || peerProf?.username || displayId).substring(displayId.startsWith('0x') && !customNick ? 2 : 0, displayId.startsWith('0x') && !customNick ? 4 : 2).toUpperCase();
            const groupAvatarUrl = isGroup ? (convo.imageUrl || convo.groupAvatar || groupAvatars[convo.id]) : null;
            const isPinned = !!pinnedConvos[convo.id];
            const isBot = !isGroup && (convo.isDemoBot || displayId.toLowerCase().includes('bot'));
            const isSelected = activeConversation?.id === convo.id;
            const draftText = chatDrafts[convo.id];
            const unreadCount = unreadCounts[convo.id] || 0;

            return (
              <div 
                key={convo.id} 
                className={`whatsapp-chat-card ${isSelected ? 'active' : ''}`}
                onClick={() => selectConversation(convo)}
              >
                <div className="whatsapp-card-avatar-wrap">
                  <div className={`avatar ${isGroup ? 'group-avatar' : ''} ${isBot ? 'bot-avatar' : ''}`}>
                    {isGroup ? (
                      groupAvatarUrl ? (
                        <img 
                          src={groupAvatarUrl.startsWith('http') ? groupAvatarUrl : `https://ipfs.io/ipfs/${groupAvatarUrl}`} 
                          alt={displayName} 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <PixelAlien size={20} color="var(--arcade-neon-magenta, #ff007f)" />
                      )
                    ) : peerProf?.profilePictureCID ? (
                      <img 
                        src={peerProf.profilePictureCID.startsWith('http') ? peerProf.profilePictureCID : `https://ipfs.io/ipfs/${peerProf.profilePictureCID}`} 
                        alt="Avatar" 
                      />
                    ) : isBot ? (
                      <PixelRobot size={20} color="var(--arcade-neon-cyan, #00f0ff)" />
                    ) : (
                      avatarChar || "??"
                    )}
                  </div>
                  <span className={`whatsapp-status-dot ${isBot ? 'bot' : isGroup ? 'group' : 'online'}`}></span>
                </div>

                <div className="whatsapp-card-content">
                  <div className="whatsapp-card-row-top">
                    <span className="whatsapp-card-title">
                      {displayName}
                      {isGroup ? (
                        <span className="whatsapp-group-tag">GROUP</span>
                      ) : isBot ? (
                        <span className="whatsapp-bot-tag">BOT</span>
                      ) : null}
                    </span>
                    <span className="whatsapp-card-time">
                      {convo.latestMessage?.sentAt ? formatMessageTime(convo.latestMessage.sentAt) : ''}
                    </span>
                  </div>

                  <div className="whatsapp-card-row-bottom">
                    <p className="whatsapp-card-snippet">
                      {draftText && !isSelected ? (
                        <span className="whatsapp-snippet-draft">
                          Draft: {cipherSettings[convo.id]?.keyHash && !cipherKeys[convo.id] ? '🔒 hidden' : draftText}
                        </span>
                      ) : (
                        <>
                          <span className="whatsapp-snippet-ticks">✓✓</span>
                          <span>{convo.latestMessage ? getMessageSnippet(convo.latestMessage, { convoId: convo.id }) : 'Direct message'}</span>
                        </>
                      )}
                    </p>
                    <div className="whatsapp-card-badges">
                      {unreadCount > 0 && !isSelected && (
                        <span className="whatsapp-unread-badge">{unreadCount}</span>
                      )}
                      <button 
                        type="button" 
                        className={`whatsapp-pin-btn ${isPinned ? 'pinned' : ''}`}
                        title={isPinned ? "Unpin chat" : "Pin chat"}
                        onClick={(e) => togglePinConversation(e, convo.id)}
                      >
                        📌
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && walletAddress && (
            <div className="whatsapp-empty-chats">
              <p>No conversations found.</p>
              <button 
                type="button" 
                className="coffee-btn-secondary"
                style={{ marginTop: '10px', fontSize: '0.82rem', padding: '6px 14px' }}
                onClick={startBlockBotChat}
              >
                🤖 Chat with BlockBot AI
              </button>
            </div>
          )}

          {!walletAddress && (
            <div className="whatsapp-connect-prompt">
              <p>Connect Web3 wallet to load on-chain chats.</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="coffee-btn-primary" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
                {startDemoMode && (
                  <button 
                    type="button" 
                    className="coffee-btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                    onClick={startDemoMode}
                  >
                    🧪 Demo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main WhatsApp Chat Area with Coffee Doodle Wallpaper */}
      <div className="chat-area whatsapp-chat-area whatsapp-wallpaper">
        {activeConversation ? (
          <>
            {/* Active Header */}
            <div className="whatsapp-active-header">
              {(() => {
                const isGroup = isGroupConversation(activeConversation);
                const peerAddr = isGroup ? null : activeConversation.peerAddress;
                const peerProf = !isGroup ? ((peerAddr && addressProfiles[peerAddr.toLowerCase()]) || addressProfiles[activeConversation.id?.toLowerCase()]) : null;
                const displayId = isGroup ? (activeConversation.groupName || activeConversation.name || activeConversation.id || "Group Chat") : (peerAddr || activeConversation.id || "Unknown");
                const displayName = isGroup ? (activeConversation.groupName || activeConversation.name || "Group Chat") : getContactDisplayName(peerAddr || displayId, peerProf);
                const customNick = !isGroup ? ((peerAddr && customNicknames[peerAddr.toLowerCase()]) || customNicknames[activeConversation.id?.toLowerCase()]) : null;
                const isBot = !isGroup && (activeConversation.isDemoBot || displayId.toLowerCase().includes('bot'));
                const avatarChar = isGroup
                  ? (displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2) || 'GP').toUpperCase()
                  : (customNick || peerProf?.username || displayId).substring(displayId.startsWith('0x') && !customNick ? 2 : 0, displayId.startsWith('0x') && !customNick ? 4 : 2).toUpperCase();
                const groupAvatarUrl = isGroup ? (activeConversation.imageUrl || activeConversation.groupAvatar || groupAvatars[activeConversation.id]) : null;

                return (
                  <div className="whatsapp-header-inner">
                    {/* Left: Avatar + Peer Details */}
                    <div className="whatsapp-header-left">
                      <button 
                        type="button" 
                        className="mobile-back-btn" 
                        onClick={() => {
                          setActiveConversation(null);
                          lockAllCiphers();
                        }}
                        title="Back to conversations"
                        aria-label="Back to conversations"
                      >
                        ←
                      </button>

                      <div 
                        className="whatsapp-header-contact"
                        onClick={() => isGroup ? setShowGroupMembersModal(true) : setShowContactDrawer(true)}
                        title={isGroup ? "View group details and members" : "View contact info"}
                      >
                        <div className={`avatar ${isGroup ? 'group-avatar' : ''} ${isBot ? 'bot-avatar' : ''}`}>
                          {isGroup ? (
                            groupAvatarUrl ? (
                              <img 
                                src={groupAvatarUrl.startsWith('http') ? groupAvatarUrl : `https://ipfs.io/ipfs/${groupAvatarUrl}`} 
                                alt={displayName} 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <PixelAlien size={22} color="var(--arcade-neon-magenta, #ff007f)" />
                            )
                          ) : peerProf?.profilePictureCID ? (
                            <img 
                              src={peerProf.profilePictureCID.startsWith('http') ? peerProf.profilePictureCID : `https://ipfs.io/ipfs/${peerProf.profilePictureCID}`} 
                              alt="Avatar" 
                            />
                          ) : isBot ? (
                            <PixelRobot size={22} color="var(--arcade-neon-cyan, #00f0ff)" />
                          ) : (
                            avatarChar || "??"
                          )}
                        </div>

                        <div className="whatsapp-header-meta">
                          <h3 className="whatsapp-header-name">
                            <span>{displayName}</span>
                            {isGroup ? (
                              <span className="whatsapp-group-tag">GROUP</span>
                            ) : isBot ? (
                              <span className="whatsapp-bot-tag">BOT</span>
                            ) : null}
                            {pinnedConvos[activeConversation.id] && <span className="whatsapp-pin-icon"><PixelPin size={14} color="#ffd166" /></span>}
                          </h3>
                          {isGroupConversation(activeConversation) && (() => {
                            const cachedMembers = groupMembersCache[activeConversation.id];
                            return (
                              <div 
                                className="whatsapp-header-members-subtitle font-arcade"
                                onClick={() => setShowGroupMembersModal(true)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Click to view and add group members"
                              >
                                <PixelAlien size={12} color="var(--arcade-neon-magenta, #ff007f)" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                                <span>
                                  {cachedMembers
                                    ? `${cachedMembers.length} members`
                                    : 'Group Chat'}
                                </span>
                                {cachedMembers && cachedMembers.length > 0 && (
                                  <span style={{ marginLeft: 6, opacity: 0.6 }}>
                                    • {cachedMembers.slice(0, 3).map(m => {
                                      const addr = m.accountIdentifiers?.[0]?.identifier || m.inboxId || '';
                                      return addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : m.inboxId;
                                    }).join(', ')}{cachedMembers.length > 3 ? ` +${cachedMembers.length - 3}` : ''}
                                  </span>
                                )}
                                <span style={{
                                  marginLeft: 8,
                                  color: 'var(--arcade-neon-magenta, #ff007f)',
                                  fontSize: '0.62rem',
                                  textDecoration: 'underline',
                                  textUnderlineOffset: '2px'
                                }}>
                                  + Add
                                </span>
                              </div>
                            );
                          })()}
                          {peerTyping ? (
                            <p className="whatsapp-status typing">
                              <span>typing</span>
                              <span className="typing-dot">.</span>
                              <span className="typing-dot">.</span>
                              <span className="typing-dot">.</span>
                            </p>
                          ) : (
                            <p className="whatsapp-status online">
                              <span className="status-indicator"></span> 
                              <span>online • E2EE</span>
                              {activeCipherSetting?.keyHash && (
                                <span className={`cipher-chip ${isCipherLocked ? 'locked' : 'unlocked'}`}>
                                  {isCipherLocked ? '🔒 CIPHER' : '🔓 CIPHER'}
                                </span>
                              )}
                              {disappearingTimer > 0 && (
                                <span className="disappearing-chip">
                                  ⏱️ {disappearingTimer === 60 ? '1m' : disappearingTimer === 86400 ? '24h' : '7d'}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Add member, Voice call, Video call, Tip, Search, Drawer) */}
                    <div className="whatsapp-header-actions">
                      {/* Add Member / Group Members Button */}
                      {isGroupConversation(activeConversation) && (
                        <button
                          type="button"
                          className="whatsapp-icon-action"
                          title="Manage Group Members & Add New Members"
                          onClick={() => setShowGroupMembersModal(true)}
                          style={{
                            borderColor: 'var(--arcade-neon-magenta, #ff007f)',
                            background: 'rgba(255, 0, 127, 0.12)',
                            color: 'var(--arcade-neon-magenta, #ff007f)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <PixelAlien size={16} color="var(--arcade-neon-magenta, #ff007f)" />
                          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>+</span>
                        </button>
                      )}

                      <button 
                        type="button" 
                        className="whatsapp-icon-action" 
                        title="Voice Call"
                        onClick={() => setActiveCall({
                          type: 'voice',
                          isOutgoing: true,
                          callId: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                        })}
                      >
                        <PixelPhone size={18} color="#39ff14" />
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action" 
                        title="Video Call"
                        onClick={() => setActiveCall({
                          type: 'video',
                          isOutgoing: true,
                          callId: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                        })}
                      >
                        <PixelVideo size={18} color="#00f0ff" />
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action tip-action" 
                        title="Send ETH Tip / Transfer or Request ETH"
                        onClick={() => {
                          setCryptoModalPreset({ mode: 'send', amount: '', note: '' });
                          setShowSendCryptoModal(true);
                        }}
                      >
                        <PixelCoin size={18} color="#ffd166" />
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action duel-action" 
                        title="Arcade Activities & Games (Snake, Wordle, 21, Pictionary & Duels)"
                        onClick={() => setShowActivitiesModal(true)}
                      >
                        <PixelGamepad size={18} color="#ff007f" />
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action capsule-action" 
                        title="Timelocked Vault Capsule"
                        onClick={() => setShowTimeCapsuleModal(true)}
                      >
                        <PixelHourglass size={18} color="#ffd166" />
                      </button>

                      <button 
                        type="button" 
                        className={`whatsapp-icon-action cipher-action ${isCipherLocked ? 'locked' : activeCipherKey ? 'unlocked' : ''}`}
                        title={
                          !activeCipherSetting?.keyHash
                            ? 'Playfair Cipher: set a secret key for this chat'
                            : isCipherLocked ? 'Unlock chat with secret key' : 'Cipher unlocked (click to lock / settings)'
                        }
                        onClick={() => setShowCipherModal(true)}
                      >
                        <PixelLock size={18} color={isCipherLocked ? '#ff007f' : activeCipherKey ? '#39ff14' : '#d8e2ec'} />
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action" 
                        title="Search in conversation"
                        onClick={() => setShowInChatSearch(!showInChatSearch)}
                      >
                        <PixelSearch size={18} color="#d8e2ec" />
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action" 
                        title="Conversation Controls & Options"
                        onClick={() => {
                          if (window.innerWidth <= 768) {
                            setShowMobileHeaderMenu(true);
                          } else {
                            isGroup ? setShowGroupMembersModal(true) : setShowContactDrawer(true);
                          }
                        }}
                      >
                        <PixelMore size={18} color="#d8e2ec" />
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* WhatsApp First-Time Sender Safety Warning Banner */}
            {(() => {
              const peerAddr = activeConversation?.peerAddress;
              const isUnknown = activeConversation && 
                                !activeConversation.isDemoBot && 
                                peerAddr && 
                                !knownContacts[peerAddr.toLowerCase()] && 
                                !customNicknames[peerAddr.toLowerCase()] && 
                                !dismissedSafetyBanners[peerAddr.toLowerCase()];
              if (!isUnknown) return null;
              return (
                <div className="whatsapp-safety-banner">
                  <div className="safety-banner-left">
                    <span className="safety-banner-icon"><PixelShield size={18} color="#ffd166" /></span>
                    <div>
                      <span style={{ fontWeight: 600 }}>Unknown Sender: </span>
                      <span>{formatAddress(peerAddr)} is not in your address book. Verify before sending ETH.</span>
                    </div>
                  </div>
                  <div className="safety-banner-actions">
                    <button 
                      type="button" 
                      className="safety-btn-action"
                      onClick={() => setShowContactDrawer(true)}
                    >
                      📇 Set Nickname
                    </button>
                    <button 
                      type="button" 
                      className="safety-btn-dismiss"
                      onClick={() => handleDismissSafetyBanner(peerAddr)}
                      title="Dismiss warning"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Playfair Cipher Banner: encrypted messages received but no key set on this device */}
            {!activeCipherSetting?.keyHash && messages.some(m => isPlayfairEnvelope(editedMessages[m.id] || parseMessageData(m).text)) && (
              <div className="whatsapp-safety-banner cipher-banner">
                <div className="safety-banner-left">
                  <span className="safety-banner-icon"><PixelLock size={18} color="#ffd166" /></span>
                  <div>
                    <span style={{ fontWeight: 600 }}>Playfair encrypted: </span>
                    <span>Some messages here are scrambled. Enter the shared key to read them.</span>
                  </div>
                </div>
                <div className="safety-banner-actions">
                  <button type="button" className="safety-btn-action" onClick={() => setShowCipherModal(true)}>
                    🔐 Enter Key
                  </button>
                </div>
              </div>
            )}

            {/* In-Chat Search Bar */}
            {showInChatSearch && (
              <div className="whatsapp-inchat-search">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  className="whatsapp-inchat-input" 
                  placeholder="Filter messages in this conversation..." 
                  value={inChatSearchQuery}
                  onChange={(e) => setInChatSearchQuery(e.target.value)}
                  autoFocus
                />
                {inChatSearchQuery && (
                  <span className="search-count-pill">
                    {visibleMessages.length} {visibleMessages.length === 1 ? 'match' : 'matches'}
                  </span>
                )}
                <button className="banner-close-btn" onClick={() => { setShowInChatSearch(false); setInChatSearchQuery(''); }}>✕</button>
              </div>
            )}

            {/* WhatsApp Message Bubbles Stream */}
            <div className="whatsapp-messages-stream messages">
              {visibleMessages.map((msg, idx) => {
                const isSent = msg.senderInboxId === xmtpClient?.inboxId || (!xmtpClient && msg.senderInboxId !== 'bot-inbox' && msg.senderInboxId !== 'cypher-inbox' && msg.senderInboxId !== 'knight-inbox');
                const isDeleted = deletedMessages[msg.id];
                const msgData = parseMessageData(msg);
                const rawText = editedMessages[msg.id] || msgData.text;
                const isCipherMsg = isPlayfairEnvelope(rawText);
                const renderedText = revealText(rawText);
                const isScrambled = isCipherLocked || (isCipherMsg && !activeCipherKey);
                const isEdited = !!editedMessages[msg.id];
                const reactions = reactionsMap[msg.id] || [];
                const isStarred = !!starredMessages[msg.id];

                return (
                  <div key={msg.id || idx} className={`whatsapp-bubble-row ${isSent ? 'sent' : 'received'}`}>
                    <div className={`whatsapp-bubble ${isSent ? 'sent' : 'received'} ${isStarred ? 'starred' : ''}`}>
                      {/* Bubble Action Controls (Hover Chevron) */}
                      {!isDeleted && (
                        <div className="whatsapp-bubble-hover-actions">
                          <button 
                            type="button" 
                            className="bubble-action-btn" 
                            title="React"
                            onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
                          >
                            <PixelSmile size={15} color="#ffd166" />
                          </button>
                          <button 
                            type="button" 
                            className="bubble-action-btn" 
                            title="Reply"
                            onClick={() => setReplyingTo(msg)}
                          >
                            ↩
                          </button>
                          <button 
                            type="button" 
                            className={`bubble-action-btn ${isStarred ? 'active-star' : ''}`}
                            title={isStarred ? "Unstar" : "Star"}
                            onClick={() => toggleStarMessage(msg.id)}
                          >
                            ⭐
                          </button>
                          {msgData.type === 'text' && (
                            <button 
                              type="button" 
                              className="bubble-action-btn" 
                              title="Copy Text"
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(renderedText);
                                }
                              }}
                            >
                              📋
                            </button>
                          )}
                          {isSent && msgData.type === 'text' && !isCipherLocked && (
                            <button 
                              type="button" 
                              className="bubble-action-btn" 
                              title="Edit"
                              onClick={() => handleStartEdit(msg)}
                            >
                              ✏️
                            </button>
                          )}
                          {isSent && (
                            <button 
                              type="button" 
                              className="bubble-action-btn delete-btn" 
                              title="Delete"
                              onClick={() => handleDeleteMessage(msg)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}

                      {/* Quoted Reply inside Bubble */}
                      {msgData.replyTo && (
                        <div className="whatsapp-quoted-reply">
                          <div className="quoted-sender">@{msgData.replyTo.sender}</div>
                          <div className="quoted-text">{revealText(msgData.replyTo.text)}</div>
                        </div>
                      )}

                      {/* Deleted State */}
                      {isDeleted ? (
                        <div className="whatsapp-deleted-text">
                          🚫 <em>This message was deleted</em>
                        </div>
                      ) : (
                        <>
                          {/* Group sender name tag (only in group conversations) */}
                          {!isSent && isGroupConversation(activeConversation) && (
                            <span className={`whatsapp-bubble-sender-name font-arcade ${
                              msg.senderInboxId === 'knight-inbox' ? 'peer-knight' :
                              msg.senderInboxId === 'cypher-inbox' ? 'peer-cypher' : 'peer-bot'
                            }`}>
                              {msg.senderName || (msg.senderInboxId === 'knight-inbox' ? 'PixelKnight 🛡️' : msg.senderInboxId === 'cypher-inbox' ? 'CypherPunk #42' : (msg.senderInboxId ? `${msg.senderInboxId.slice(0, 6)}…` : 'Member'))}
                            </span>
                          )}

                          {/* Crypto Transfer Receipt Card */}
                          {msgData.type === 'crypto_transfer' && (
                            <CryptoReceipt 
                              data={{ ...msgData, note: revealText(msgData.note) }} 
                              isSent={isSent} 
                              networkName={networkName} 
                              chainId={chainId}
                            />
                          )}

                          {/* Crypto Request Invoice Card */}
                          {msgData.type === 'crypto_request' && (
                            <div className="crypto-request-card">
                              <div className="crypto-request-header">
                                <span className="crypto-request-tag">📥 ETH Invoice</span>
                                {(() => {
                                  const inv = msgData.onChainInvoiceId ? invoiceStatus[msgData.onChainInvoiceId] : null;
                                  const label = inv
                                    ? (inv.cancelled ? 'CANCELLED'
                                      : inv.paidCount >= inv.maxPayers ? 'PAID ✓'
                                      : inv.maxPayers > 1 ? `${inv.paidCount}/${inv.maxPayers} PAID` : 'PENDING')
                                    : (msgData.status === 'paid' ? 'PAID ✓' : 'PENDING');
                                  const cls = label === 'PAID ✓' ? 'paid' : (msgData.status || 'pending');
                                  return <span className={`crypto-request-status ${cls}`}>{label}</span>;
                                })()}
                              </div>
                              <div className="crypto-request-amount">
                                <span className="crypto-request-val">{msgData.amount}</span>
                                <span className="crypto-request-symbol">ETH</span>
                              </div>
                              {msgData.note && (
                                <div className="crypto-request-note">
                                  &ldquo;{revealText(msgData.note)}&rdquo;
                                </div>
                              )}
                              <div className="crypto-request-footer">
                                {(() => {
                                  const inv = msgData.onChainInvoiceId ? invoiceStatus[msgData.onChainInvoiceId] : null;
                                  const isFull = inv ? inv.paidCount >= inv.maxPayers : msgData.status === 'paid';
                                  const isCancelled = !!inv?.cancelled;
                                  if (isCancelled) {
                                    return <div className="crypto-paid-label"><span>✕ Cancelled by requester</span></div>;
                                  }
                                  if (isFull || inv?.paidByMe) {
                                    return (
                                      <div className="crypto-paid-label">
                                        <span>{isFull ? '✓ Settled on-chain' : '✓ You paid your share'}</span>
                                        {msgData.paidTxHash && (
                                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                                            ({formatAddress(msgData.paidTxHash)})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }
                                  if (isSent) {
                                    return msgData.onChainInvoiceId ? (
                                      <button
                                        type="button"
                                        className="crypto-request-pay-btn"
                                        onClick={() => handleCancelOnChainInvoice(msgData)}
                                      >
                                        ✕ Cancel Invoice
                                      </button>
                                    ) : null;
                                  }
                                  return (
                                    <button
                                      type="button"
                                      className="crypto-request-pay-btn"
                                      onClick={() => handlePayRequest(msgData)}
                                    >
                                      ⚡ Pay {msgData.amount} ETH Now
                                    </button>
                                  );
                                })()}
                                <div className="crypto-requester-info" style={{ marginTop: '4px' }}>
                                  {isSent ? 'Requested by You' : `Requested by ${getContactDisplayName(activeConversation.peerAddress)}`}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Voice Note Audio */}
                          {msgData.type === 'audio' && (
                            isCipherLocked ? (
                              <div className="whatsapp-cipher-hidden-media">🔒 Voice note ({msgData.duration || 0}s) hidden</div>
                            ) : (
                              <VoiceNotePlayer audioUrl={msgData.audioUrl} duration={msgData.duration} />
                            )
                          )}

                          {/* Media Image Attachment */}
                          {msgData.type === 'media' && msgData.media && (
                            <div 
                              className={`whatsapp-bubble-image-wrap ${isCipherLocked ? 'cipher-blurred' : ''}`}
                              onClick={() => !isCipherLocked && setLightboxImage(msgData.media)}
                            >
                              <img src={msgData.media} alt="Attached Media" />
                            </div>
                          )}

                          {/* 1v1 Arcade Duel Card */}
                          {msgData.type === 'arcade_duel' && (
                            <ArcadeDuelCard
                              duelData={msgData}
                              currentAddress={walletAddress}
                              currentInboxId={xmtpClient?.inboxId}
                              isSent={isSent}
                              onLockChallengerMove={handleLockChallengerMove}
                              onRespondMove={handleRespondDuelMove}
                              onStartNewDuel={() => handleSendDuelChallenge('0')}
                              onClaimTimeout={handleClaimDuelTimeout}
                              chainId={chainId}
                            />
                          )}

                          {/* Cyber Tic-Tac-Toe Duel Card */}
                          {msgData.type === 'tictactoe' && (
                            <TicTacToeCard
                              gameData={msgData}
                              currentAddress={walletAddress}
                              currentInboxId={xmtpClient?.inboxId}
                              isSent={isSent}
                              onMakeMove={handleMakeTicTacToeMove}
                              onStartRematch={handleSendTicTacToe}
                              onAddXp={addArcadeXp}
                              onPlayChime={playReceiveChime}
                            />
                          )}

                          {/* Pixel Pictionary Guess Card */}
                          {msgData.type === 'sketch_guess' && (
                            <SketchGuessCard
                              cardData={msgData}
                              currentAddress={walletAddress}
                              isSent={isSent}
                              onSolve={handleSolveSketch}
                              onAddXp={addArcadeXp}
                              onPlayFanfare={playReceiveChime}
                            />
                          )}

                          {/* Cyber Snake Challenge Card */}
                          {msgData.type === 'snake_challenge' && (
                            <SnakeChallengeCard
                              cardData={msgData}
                              currentAddress={walletAddress}
                              isSent={isSent}
                              onAcceptAndPlay={handleAcceptSnakeChallenge}
                            />
                          )}

                          {/* Timelocked Vault Capsule Card */}
                          {msgData.type === 'time_capsule' && (
                            <TimeCapsuleCard
                              capsuleData={{ ...msgData, isOpened: openedCapsulesMap[msgData.capsuleId] || msgData.isOpened }}
                              isRecipient={Boolean(
                                (walletAddress && msgData.recipient && walletAddress.toLowerCase() === msgData.recipient.toLowerCase()) ||
                                activeConversation?.isDemoBot ||
                                (msgData.recipient && msgData.recipient.toLowerCase() === '0x000000000000000000000000000000000000dead')
                              )}
                              isSent={isSent}
                              onOpenCapsule={handleOpenTimeCapsule}
                              onPlayFanfare={playReceiveChime}
                              onAddXp={addArcadeXp}
                              onOpenLightbox={(img) => setLightboxImage(img)}
                            />
                          )}

                          {/* Copilot Slash Command Widget */}
                          {msgData.type === 'copilot_widget' && (
                            <CopilotWidgetCard
                              widgetData={msgData}
                              onAddXp={addArcadeXp}
                              onPlayChime={playReceiveChime}
                            />
                          )}

                          {/* Live Poll */}
                          {msgData.type === 'poll' && (
                            <PollCard
                              pollData={msgData}
                              votes={interactions[msgData.pollId]}
                              myKey={myInteractionKey}
                              onVote={(pid, choice) => handleVotePoll(pid, choice, msgData)}
                              chain={msgData.onChainPollId ? pollStatus[msgData.onChainPollId] : null}
                              isSent={isSent}
                              onClose={handleClosePoll}
                            />
                          )}

                          {/* Gift Packet (on-chain ETH, or legacy XP) */}
                          {msgData.type === 'gift_packet' && (
                            <GiftPacketCard
                              giftData={msgData}
                              votes={interactions[msgData.giftId]}
                              myKey={myInteractionKey}
                              isSent={isSent}
                              onClaim={handleClaimGift}
                              chain={msgData.onChainPacketId ? giftStatus[msgData.onChainPacketId] : null}
                              onRefund={handleRefundGift}
                            />
                          )}

                          {/* Text Content with WhatsApp Markdown formatting */}
                          {renderedText &&
                            msgData.type !== 'crypto_transfer' &&
                            msgData.type !== 'crypto_request' &&
                            msgData.type !== 'arcade_duel' &&
                            msgData.type !== 'time_capsule' &&
                            msgData.type !== 'poll' &&
                            msgData.type !== 'gift_packet' &&
                            msgData.type !== 'copilot_widget' && (
                            <div className={`whatsapp-bubble-text ${isScrambled ? 'cipher-scrambled' : ''}`}>
                              {isScrambled ? renderedText : renderWhatsAppMarkdown(renderedText)}
                              {isEdited && <span className="whatsapp-edited-tag">(edited)</span>}
                            </div>
                          )}

                          {/* Bubble Footer: Time & Double Ticks */}
                          <div className="whatsapp-bubble-meta">
                            {isStarred && <span className="whatsapp-starred-icon">⭐</span>}
                            {isCipherMsg && (
                              <span className="whatsapp-cipher-tag" title={activeCipherKey ? 'Playfair encrypted (unlocked)' : 'Playfair encrypted'}>
                                {activeCipherKey ? '🔓' : '🔒'}
                              </span>
                            )}
                            <span className="whatsapp-time">{msg.sentAt ? formatMessageTime(msg.sentAt) : ''}</span>
                            {isSent && <span className="whatsapp-checks">✓✓</span>}
                          </div>
                        </>
                      )}

                      {/* Emoji Reactions Popover */}
                      {activeReactionPicker === msg.id && (
                        <div className="whatsapp-reaction-picker">
                          {['👾', '🪙', '⭐', '❤️', '🔥', '⚡', '💎', '🤖', '💀', '🚀', '👍', '☕'].map(emoji => (
                            <span 
                              key={emoji} 
                              className="reaction-option" 
                              onClick={() => {
                                handleAddReaction(msg.id, emoji);
                                playSendPop();
                              }}
                            >
                              {emoji}
                            </span>
                          ))}
                          <button
                            type="button"
                            className="reaction-more-btn"
                            title="More reactions"
                            onClick={() => {
                              setShowReactionModal(showReactionModal === msg.id ? null : msg.id);
                              setActiveReactionPicker(null);
                            }}
                          >
                            ➕
                          </button>
                        </div>
                      )}

                      {/* Full 250+ Emoji Picker for Message Reaction */}
                      {showReactionModal === msg.id && (
                        <div className="message-reaction-popover-wrap">
                          <EmojiPicker 
                            onSelectEmoji={(emoji) => {
                              handleAddReaction(msg.id, emoji);
                              setShowReactionModal(null);
                            }}
                            onClose={() => setShowReactionModal(null)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Reactions Pill Below Bubble */}
                    {!isDeleted && reactions.length > 0 && (
                      <div className="whatsapp-reactions-pills-row">
                        {reactions.map((r, rIdx) => (
                          <div 
                            key={rIdx} 
                            className="whatsapp-reaction-pill"
                            onClick={() => handleAddReaction(msg.id, r)}
                            title="Click to toggle reaction"
                            style={{ cursor: 'pointer' }}
                          >
                            {r}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp Chat Composer */}
            <div className="whatsapp-composer-container chat-composer-container">
              {/* Attached Banner: Editing */}
              {editingMessage && (
                <div className="whatsapp-banner editing">
                  <div>
                    <span style={{ fontWeight: 600 }}>✏️ Editing message: </span>
                    <span>{editingMessage.originalText}</span>
                  </div>
                  <button className="banner-close-btn" onClick={handleCancelEdit}>✕</button>
                </div>
              )}

              {/* Attached Banner: Replying */}
              {!editingMessage && replyingTo && (
                <div className="whatsapp-banner replying">
                  <div>
                    <span style={{ fontWeight: 600 }}>Replying to: </span>
                    <span>{getMessageSnippet(replyingTo)}</span>
                  </div>
                  <button className="banner-close-btn" onClick={() => setReplyingTo(null)}>✕</button>
                </div>
              )}

              {/* Attached Banner: Image Preview */}
              {!editingMessage && selectedImage && (
                <div className="whatsapp-banner media">
                  <div className="whatsapp-media-thumb">
                    <img src={selectedImage.dataUrl} alt="Preview" />
                    <button className="remove-media-btn" onClick={() => setSelectedImage(null)}>✕</button>
                  </div>
                  <span>Image ready to send</span>
                </div>
              )}

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <EmojiPicker 
                  onSelectEmoji={(emoji) => setInputValue(prev => prev + emoji)}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}

              {/* Copilot Palette Floating */}
              {showCopilotPalette && (
                <CopilotPalette
                  filterQuery={inputValue}
                  onSelectCommand={handleSelectCopilotCommand}
                  onClose={() => setShowCopilotPalette(false)}
                />
              )}

              {/* Input Bar Form */}
              <div className="whatsapp-composer-bar">
                {isCipherLocked ? (
                  <div className="whatsapp-cipher-locked-bar">
                    <span><PixelLock size={16} color="#ff007f" /> Chat is cipher-locked</span>
                    <button type="button" className="coffee-btn-primary" onClick={() => setShowCipherModal(true)}>
                      🔐 Enter Key
                    </button>
                  </div>
                ) : isRecording ? (
                  <div className="whatsapp-recording-bar">
                    <div className="recording-indicator">
                      <div className="rec-dot"></div>
                      <span className="rec-timer">{formatRecordingTime(recordingDuration)}</span>
                      <div className="rec-waves">
                        <div className="rec-bar"></div>
                        <div className="rec-bar"></div>
                        <div className="rec-bar"></div>
                        <div className="rec-bar"></div>
                        <div className="rec-bar"></div>
                      </div>
                    </div>
                    <div className="recording-actions">
                      <button 
                        type="button" 
                        className="btn-cancel-rec" 
                        title="Cancel Recording"
                        onClick={cancelRecording}
                      >
                        <PixelTrash size={18} color="#ff007f" />
                      </button>
                      <button 
                        type="button" 
                        className="whatsapp-send-btn" 
                        title="Send Voice Note"
                        onClick={sendVoiceNote}
                      >
                        <PixelSend size={18} color="#000000" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="whatsapp-composer-form">
                    {!editingMessage && (
                      <>
                        <button 
                          type="button" 
                          className="whatsapp-composer-icon" 
                          title="Insert Pixel Emoji"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          <PixelSmile size={20} color="#ffd166" />
                        </button>

                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          style={{ display: 'none' }} 
                          accept="image/*" 
                          onChange={handleImageSelect}
                        />
                        <button 
                          type="button" 
                          className="whatsapp-composer-icon" 
                          title="Attach Media"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <PixelClip size={20} color="#00f0ff" />
                        </button>

                        {/* Mobile Arcade Actions Hub Button */}
                        <button
                          type="button"
                          className="whatsapp-composer-icon mobile-arcade-hub-btn"
                          title="Arcade Actions & Web3 dApps"
                          onClick={() => setShowMobileArcadeHub(true)}
                        >
                          <PixelGamepad size={20} color="var(--arcade-neon-magenta, #ff007f)" />
                        </button>

                        <button 
                          type="button" 
                          className="whatsapp-composer-icon composer-extra-btn" 
                          title="Send ETH Tip or Request ETH"
                          onClick={() => {
                            setCryptoModalPreset({ mode: 'send', amount: '', note: '' });
                            setShowSendCryptoModal(true);
                          }}
                        >
                          <PixelCoin size={20} color="#ffd166" />
                        </button>

                        <button 
                          type="button" 
                          className="whatsapp-composer-icon composer-extra-btn" 
                          title="Arcade Activities & Games (Snake, Wordle, 21, Pictionary & Duels)"
                          onClick={() => setShowActivitiesModal(true)}
                        >
                          <PixelGamepad size={20} color="#ff007f" />
                        </button>

                        <button 
                          type="button" 
                          className="whatsapp-composer-icon composer-extra-btn" 
                          title="Timelocked Vault Capsule"
                          onClick={() => setShowTimeCapsuleModal(true)}
                        >
                          <PixelHourglass size={20} color="#ffd166" />
                        </button>
                      </>
                    )}

                    <input 
                      type="text" 
                      className="whatsapp-input-field"
                      placeholder={
                        editingMessage 
                          ? "> Edit message buffer..." 
                          : isEncryptingOutgoing
                            ? "> 🔐 Playfair-encrypted message..."
                            : selectedImage 
                            ? "> Add photo caption..." 
                            : "> Type a message or / for copilot commands (*bold*, _italic_, `code`)..."
                      } 
                      value={inputValue}
                      onChange={handleComposerInputChange}
                    />

                    {!editingMessage && (
                      <button 
                        type="button" 
                        className="whatsapp-composer-icon" 
                        title="Record Voice Note"
                        onClick={startRecording}
                      >
                        <PixelMic size={20} color="#39ff14" />
                      </button>
                    )}

                    <button 
                      type="submit" 
                      className="whatsapp-send-btn" 
                      title={editingMessage ? "Save Edit" : "Send Message"}
                    >
                      {editingMessage ? (
                        <span>✓</span>
                      ) : (
                        <PixelSend size={18} color="#000000" />
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </>
        ) : (
          <HeroDashboard 
            walletAddress={walletAddress}
            ensName={ensName}
            userBalance={userBalance}
            networkName={networkName}
            userProfile={userProfile}
            arcadeRank={arcadeRank}
            onStartChatClick={() => searchInputRef.current?.focus()}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenQR={() => setShowQRModal(true)}
            onConnectWallet={connectWallet}
            onStartBlockBotChat={startBlockBotChat}
            onStartDemoMode={startDemoMode}
            onCreateGroup={() => {
              if (!walletAddress) startDemoMode();
              setShowCreateGroupModal(true);
            }}
          />
        )}
      </div>

      {/* WhatsApp Voice / Video Calling Modal (WebRTC P2P) */}
      {activeCall && (
        <CallModal 
          callType={activeCall.type}
          callId={activeCall.callId}
          isOutgoing={activeCall.isOutgoing}
          initialOffer={activeCall.initialOffer}
          peerAddress={activeCall.peerAddress || activeConversation?.peerAddress}
          peerName={activeCall.peerName || addressProfiles[activeConversation?.peerAddress?.toLowerCase()]?.username || ensName}
          peerAvatar={activeCall.peerAvatar || addressProfiles[activeConversation?.peerAddress?.toLowerCase()]?.profilePictureCID}
          isDemoBot={activeConversation?.isDemoBot}
          onSendSignal={handleSendCallSignal}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* WhatsApp Incoming Call Dialog */}
      {incomingCall && (
        <IncomingCallModal 
          callType={incomingCall.callType}
          callerAddress={incomingCall.callerAddress}
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {/* WhatsApp Contact Info Slide-Out Drawer */}
      {showContactDrawer && activeConversation && !isGroupConversation(activeConversation) && (
        <ContactInfoDrawer 
          peerAddress={activeConversation.peerAddress}
          peerName={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.username || addressProfiles[activeConversation.id?.toLowerCase()]?.username || ensName}
          peerAvatar={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.profilePictureCID || addressProfiles[activeConversation.id?.toLowerCase()]?.profilePictureCID}
          customNickname={customNicknames[activeConversation.peerAddress?.toLowerCase()] || customNicknames[activeConversation.id?.toLowerCase()] || ''}
          onSaveNickname={(nick) => handleSaveNickname(activeConversation.peerAddress, nick)}
          messages={messages}
          revealText={revealText}
          isCipherLocked={isCipherLocked}
          starredMessages={starredMessages}
          disappearingTimer={disappearingTimer}
          setDisappearingTimer={handleSetDisappearingTimer}
          isMuted={isChatMuted}
          setIsMuted={setIsChatMuted}
          onClearChat={handleClearCurrentChat}
          onOpenQR={() => setShowQRModal(true)}
          onOpenLightbox={(img) => setLightboxImage(img)}
          onUnstarMessage={toggleStarMessage}
          onClose={() => setShowContactDrawer(false)}
        />
      )}

      {/* Playfair Cipher Chat Lock Modal */}
      {showCipherModal && activeConversation && (
        <PlayfairLockModal
          mode={!activeCipherSetting?.keyHash ? 'setup' : isCipherLocked ? 'unlock' : 'unlocked'}
          peerName={getContactDisplayName(activeConversation.peerAddress, addressProfiles[activeConversation.peerAddress?.toLowerCase()])}
          sampleEnvelope={[...messages].reverse().map(m => editedMessages[m.id] || parseMessageData(m).text).find(isPlayfairEnvelope)}
          encryptOutgoing={!!activeCipherSetting?.encryptOutgoing}
          unlockedKey={activeCipherKey}
          onSetupKey={handleSetupCipherKey}
          onUnlock={handleUnlockCipher}
          onLock={lockAllCiphers}
          onToggleEncryptOutgoing={handleToggleEncryptOutgoing}
          onResetKey={handleResetCipherKey}
          onClose={() => setShowCipherModal(false)}
        />
      )}

      {/* On-Chain Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          walletAddress={walletAddress}
          userProfile={userProfile}
          profileFormUsername={profileFormUsername}
          setProfileFormUsername={setProfileFormUsername}
          profileFormAvatar={profileFormAvatar}
          setProfileFormAvatar={setProfileFormAvatar}
          isSavingProfile={isSavingProfile}
          arcadeRank={arcadeRank}
          onSaveProfile={handleSaveProfile}
          onDisconnect={disconnectWallet}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* In-Chat Send Crypto Modal */}
      {showSendCryptoModal && activeConversation && (
        <SendCryptoModal 
          recipientAddress={activeConversation.peerAddress}
          recipientName={getContactDisplayName(activeConversation.peerAddress, addressProfiles[activeConversation.peerAddress?.toLowerCase()])}
          groupMembers={groupMembersCache[activeConversation.id] || []}
          userBalance={userBalance}
          signer={signer}
          initialMode={cryptoModalPreset.mode || 'send'}
          initialAmount={cryptoModalPreset.amount || ''}
          initialNote={cryptoModalPreset.note || ''}
          onClose={() => {
            setShowSendCryptoModal(false);
            setCryptoModalPreset({ mode: 'send', amount: '', note: '', requestId: null });
          }}
          onSuccess={handleCryptoTransferSuccess}
        />
      )}

      {/* Wallet QR Code Modal */}
      {showQRModal && (
        <QRCodeModal 
          address={activeConversation?.peerAddress || walletAddress}
          username={
            activeConversation?.peerAddress
              ? addressProfiles[activeConversation.peerAddress.toLowerCase()]?.username
              : userProfile.username || ensName
          }
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Coffee Roast Themes & Audio Modal */}
      {showThemeModal && (
        <CoffeeThemeModal
          currentTheme={coffeeTheme}
          onSelectTheme={handleSelectTheme}
          wallpaperOpacity={wallpaperOpacity}
          onSelectWallpaperOpacity={handleSelectWallpaperOpacity}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onPlaySendPop={playSendPop}
          onPlayReceiveChime={playReceiveChime}
          onPlayCoinClink={playCoinClink}
          onTestCoinBurst={() => triggerCoinBurst('0.05', 'Soundboard Test')}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* Timelocked Capsule Creation Modal */}
      {showTimeCapsuleModal && (
        <TimeCapsuleModal
          isOpen={showTimeCapsuleModal}
          onClose={() => setShowTimeCapsuleModal(false)}
          onSendCapsule={handleSendTimeCapsule}
          activeConversation={activeConversation}
          walletAddress={walletAddress}
          groupMembers={groupMembersCache[activeConversation?.id] || []}
          addressProfiles={addressProfiles}
        />
      )}

      {/* Full-screen Lightbox Image */}
      {lightboxImage && (
        <div className="modal-overlay" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Enlarged media" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Pixel Coin Burst & Floating Pop Celebration */}
      {coinBurstEvent && (
        <PixelCoinBurst
          event={coinBurstEvent}
          onComplete={() => setCoinBurstEvent(null)}
        />
      )}

      {/* XMTP Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal
          walletAddress={walletAddress}
          onClose={() => setShowCreateGroupModal(false)}
          onCreate={handleCreateXmtpGroup}
        />
      )}

      {/* XMTP Group Members & Add Member Modal */}
      {showGroupMembersModal && activeConversation && (
        <GroupMembersModal
          groupName={activeConversation.groupName || activeConversation.name || 'Group Chat'}
          groupAvatar={activeConversation.imageUrl || activeConversation.groupAvatar || groupAvatars[activeConversation.id]}
          members={groupMembersCache[activeConversation.id] || []}
          walletAddress={walletAddress}
          addressProfiles={addressProfiles}
          onAddMember={handleAddGroupMember}
          onRemoveMember={handleRemoveGroupMember}
          onUpdateGroupAvatar={(avatarUrl) => handleUpdateGroupAvatar(activeConversation.id, avatarUrl)}
          onClose={() => setShowGroupMembersModal(false)}
        />
      )}

      {/* Arcade Level Up Celebration Banner */}
      {levelUpEvent && (
        <LevelUpToast
          event={levelUpEvent}
          onComplete={() => setLevelUpEvent(null)}
        />
      )}

      {/* Discord-style Arcade Activities Suite Modals */}
      <ArcadeActivitiesModal
        isOpen={showActivitiesModal}
        onClose={() => setShowActivitiesModal(false)}
        onSelectActivity={handleSelectActivity}
      />

      <CyberSnakeModal
        isOpen={showSnakeModal}
        onClose={() => setShowSnakeModal(false)}
        onSendChallenge={handleSendSnakeChallenge}
        onAddXp={addArcadeXp}
        onPlayChime={playReceiveChime}
      />

      <CyberWordleModal
        isOpen={showWordleModal}
        onClose={() => setShowWordleModal(false)}
        onShareToChat={(text) => handleSendMessage(text)}
        onAddXp={addArcadeXp}
        onPlayChime={playReceiveChime}
      />

      <CyberBlackjackModal
        isOpen={showBlackjackModal}
        onClose={() => setShowBlackjackModal(false)}
        onShareToChat={(text) => handleSendMessage(text)}
        onAddXp={addArcadeXp}
        onPlayChime={playReceiveChime}
      />

      <PixelSketchModal
        isOpen={showSketchModal}
        onClose={() => setShowSketchModal(false)}
        onSendSketch={handleSendSketch}
        onPlayChime={playReceiveChime}
      />

      {/* Mobile Arcade Hub Slide-Up Drawer */}
      <MobileArcadeHub
        isOpen={showMobileArcadeHub}
        onClose={() => setShowMobileArcadeHub(false)}
        onOpenSendCrypto={() => {
          setCryptoModalPreset({ mode: 'send', amount: '', note: '' });
          setShowSendCryptoModal(true);
        }}
        onOpenRequestCrypto={() => {
          setCryptoModalPreset({ mode: 'request', amount: '', note: '' });
          setShowSendCryptoModal(true);
        }}
        onOpenDuel={(wager) => handleSendDuelChallenge(wager || '0')}
        onOpenActivities={() => setShowActivitiesModal(true)}
        onOpenTimeCapsule={() => setShowTimeCapsuleModal(true)}
        onOpenCipher={() => setShowCipherModal(true)}
        onSetDisappearingTimer={(timer) => setDisappearingTimer(timer)}
        disappearingTimer={disappearingTimer}
        onExecuteCommand={(cmd) => {
          setInputValue(cmd);
        }}
        isGroup={isGroupConversation(activeConversation)}
      />

      {/* Mobile Header Menu Slide-Up Sheet */}
      <MobileHeaderMenu
        isOpen={showMobileHeaderMenu}
        onClose={() => setShowMobileHeaderMenu(false)}
        isGroup={isGroupConversation(activeConversation)}
        peerName={activeConversation ? getContactDisplayName(activeConversation.peerAddress || activeConversation.id, addressProfiles[activeConversation.peerAddress?.toLowerCase()]) : ''}
        peerAddress={activeConversation?.peerAddress}
        onOpenSearch={() => setShowInChatSearch(true)}
        onOpenGroupMembers={() => setShowGroupMembersModal(true)}
        onOpenContactDetails={() => setShowContactDrawer(true)}
        onOpenCipher={() => setShowCipherModal(true)}
        disappearingTimer={disappearingTimer}
        onSetDisappearingTimer={(timer) => setDisappearingTimer(timer)}
        onExportChat={() => {
          const text = buildChatExport(messages, activeConversation);
          downloadTextFile(`chat_${Date.now()}.txt`, text);
        }}
        onClearChat={() => {
          setMessages([]);
        }}
      />
    </div>
  );
}
