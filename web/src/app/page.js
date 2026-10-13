'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ethers } from 'ethers';
import { USER_REGISTRY_ABI, DEFAULT_USER_REGISTRY_ADDRESS, getUserRegistryAddress } from './contracts';
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
import { renderWhatsAppMarkdown } from '@/utils/whatsappMarkdown';
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
  const [pinnedConvos, setPinnedConvos] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blockchat_pinned_convos');
        return stored ? JSON.parse(stored) : {};
      } catch (e) {}
    }
    return {};
  });

  // WhatsApp-Inspired Features State
  const [activeCall, setActiveCall] = useState(null); // null | { type: 'voice' | 'video', callId, isOutgoing }
  const [incomingCall, setIncomingCall] = useState(null); // null | { callType, callId, offer, callerAddress }
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [starredMessages, setStarredMessages] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blockchat_starred_msgs');
        return stored ? JSON.parse(stored) : {};
      } catch (e) {}
    }
    return {};
  });
  const [disappearingTimer, setDisappearingTimer] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blockchat_disappearing_timer');
        return stored ? Number(stored) : 0;
      } catch (e) {}
    }
    return 0;
  });
  const [isChatMuted, setIsChatMuted] = useState(false);

  // Modals & Popovers State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSendCryptoModal, setShowSendCryptoModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);

  // Advanced Features State (Replies, Attachments, Lightbox, Reactions)
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);
  const [showReactionModal, setShowReactionModal] = useState(null);
  const [reactionsMap, setReactionsMap] = useState({});
  const reactionUsersMapRef = useRef({});

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

  // 1. Custom Nicknames Address Book
  const [customNicknames, setCustomNicknames] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blockchat_custom_nicknames');
        return stored ? JSON.parse(stored) : {};
      } catch (e) {}
    }
    return {};
  });

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

  // 3. Real Unread Counts Matrix
  const [unreadCounts, setUnreadCounts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blockchat_unread_counts');
        return stored ? JSON.parse(stored) : {};
      } catch (e) {}
    }
    return {};
  });

  // 4. Known Contacts for Safety Warning Banner
  const [knownContacts, setKnownContacts] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('blockchat_known_contacts');
        return stored ? JSON.parse(stored) : {};
      } catch (e) {}
    }
    return {};
  });
  const [dismissedSafetyBanners, setDismissedSafetyBanners] = useState({});

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

  const handlePayRequest = (req) => {
    setCryptoModalPreset({
      mode: 'send',
      amount: req.amount || '',
      note: `Paying invoice: ${req.note || 'Payment'}`,
      requestId: req.requestId || req.id
    });
    setShowSendCryptoModal(true);
  };

  const handleComposerInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
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

  // Fetch Peer Profile
  const fetchPeerProfile = async (peerAddr) => {
    if (!peerAddr || addressProfiles[peerAddr.toLowerCase()]) return;
    
    // Check local cache
    try {
      const cached = localStorage.getItem(`profile_${peerAddr.toLowerCase()}`);
      if (cached) {
        const pData = JSON.parse(cached);
        setAddressProfiles(prev => ({ ...prev, [peerAddr.toLowerCase()]: pData }));
        return;
      }
    } catch (e) {}

    // Check Reverse ENS if provider available
    if (provider && ethers.isAddress(peerAddr)) {
      try {
        const peerEns = await provider.lookupAddress(peerAddr);
        if (peerEns) {
          const ensProf = { username: peerEns, profilePictureCID: '', isRegistered: true };
          setAddressProfiles(prev => ({ ...prev, [peerAddr.toLowerCase()]: ensProf }));
          return;
        }
      } catch (e) {}
    }

    if (!signer) return;
    try {
      const contract = new ethers.Contract(profileContractAddress, USER_REGISTRY_ABI, signer);
      const profile = await contract.getProfile(peerAddr);
      if (profile && profile.isRegistered) {
        const pData = {
          username: profile.username,
          profilePictureCID: profile.profilePictureCID,
          isRegistered: true
        };
        setAddressProfiles(prev => ({ ...prev, [peerAddr.toLowerCase()]: pData }));
        localStorage.setItem(`profile_${peerAddr.toLowerCase()}`, JSON.stringify(pData));
      }
    } catch (e) {}
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
    try {
      const contract = new ethers.Contract(profileContractAddress, USER_REGISTRY_ABI, ethSigner);
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
  const loadConversations = async (xmtp) => {
    try {
      const convos = await xmtp.conversations.list();
      setConversations(convos);
      
      const stream = await xmtp.conversations.stream();
      for await (const conversation of stream) {
        setConversations(prev => {
          const exists = prev.find(c => c.id === conversation.id);
          return exists ? prev : [conversation, ...prev];
        });
      }
    } catch (err) {
      console.error("Error loading conversations", err);
    }
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

        // Fetch balance
        refreshBalance(ethProvider, address);

        // Fetch Network & Chain ID
        let detectedChainId = null;
        try {
          const net = await ethProvider.getNetwork();
          detectedChainId = Number(net.chainId);
          setChainId(detectedChainId);
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

          const xmtp = await Client.create(xmtpSigner, { env: "dev", dbEncryptionKey: getDbEncryptionKey() });
          setXmtpClient(xmtp);
          loadConversations(xmtp);
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
      isRegistered: true
    };

    // Fast / Instant save mode (Free, local cache)
    if (mode === 'local') {
      setUserProfile(updated);
      setAddressProfiles(prev => ({ ...prev, [walletAddress.toLowerCase()]: updated }));
      localStorage.setItem(`profile_${walletAddress.toLowerCase()}`, JSON.stringify(updated));
      alert("Profile updated successfully!");
      setShowProfileModal(false);
      return;
    }

    // On-chain Smart contract mode
    if (!signer) return;
    try {
      setIsSavingProfile(true);
      const contract = new ethers.Contract(profileContractAddress, USER_REGISTRY_ABI, signer);
      
      let tx;
      if (userProfile.isRegistered) {
        tx = await contract.updateProfilePicture(profileFormAvatar || "");
      } else {
        tx = await contract.registerUser(username, profileFormAvatar || "");
      }
      
      await tx.wait();
      setUserProfile(updated);
      setAddressProfiles(prev => ({ ...prev, [walletAddress.toLowerCase()]: updated }));
      localStorage.setItem(`profile_${walletAddress.toLowerCase()}`, JSON.stringify(updated));
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
    if (data.type === 'disappearing_config' && typeof data.timer === 'number') {
      setDisappearingTimer(data.timer);
      try {
        localStorage.setItem('blockchat_disappearing_timer', String(data.timer));
      } catch (e) {}
      return false;
    }
    return true;
  };

  const selectConversation = async (conversation) => {
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
        } else if (d.type === 'disappearing_config' && typeof d.timer === 'number') {
          setDisappearingTimer(d.timer);
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
      setMessages(displayMsgs);
      
      const stream = await conversation.stream();
      for await (const message of stream) {
        // Cancel stream processing if user switched to another conversation
        if (activeStreamIdRef.current !== streamId) {
          break;
        }

        const isDisplayable = processIncomingMessage(message, displayMsgs);
        if (isDisplayable) {
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
    if (!xmtpClient || !rawTarget) return;

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
        fetchPeerProfile(targetAddress);
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
  };

  // Bot Response Simulator for BlockBot Demo (With WhatsApp "Typing..." state)
  const triggerBotReply = (userMsgText, type = 'text') => {
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
      } else if (userMsgText.toLowerCase().includes('hello') || userMsgText.toLowerCase().includes('hi')) {
        replyContent = "Greetings! ⚡ Excited to pair with you on decentralized messaging.";
      }

      const botMessage = {
        id: `bot-reply-${new Date().getTime()}`,
        senderInboxId: 'bot-inbox',
        sentAt: new Date().toISOString(),
        content: replyContent
      };

      if (activeConversationRef.current?.id === 'demo-blockbot') {
        setMessages(prev => [...prev, botMessage]);
      } else {
        setUnreadCounts(prev => {
          const next = (prev['demo-blockbot'] || 0) + 1;
          const updated = { ...prev, ['demo-blockbot']: next };
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
            replyTo: replyingTo ? {
              id: replyingTo.id,
              text: getMessageSnippet(replyingTo),
              sender: replyingTo.senderInboxId === xmtpClient?.inboxId ? 'You' : 'Peer'
            } : null,
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
    const currentText = editedMessages[msg.id] || parseMessageData(msg).text;
    setEditingMessage({ id: msg.id, originalText: currentText });
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

  // Send Message (or Save Edit)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!activeConversation) return;

    // Handle saving an edited message
    if (editingMessage) {
      if (!inputValue.trim()) return;
      try {
        const editPayload = {
          type: 'edit',
          targetId: editingMessage.id,
          newText: inputValue.trim(),
          timestamp: new Date().getTime()
        };
        const textPayload = `[JSON_MSG]${JSON.stringify(editPayload)}`;
        if (!activeConversation.isDemoBot) {
          await activeConversation.sendText(textPayload);
        }
        setEditedMessages(prev => ({ ...prev, [editingMessage.id]: inputValue.trim() }));
        setEditingMessage(null);
        setInputValue('');
      } catch (err) {
        console.error("Failed to edit message", err);
        alert("Failed to edit message: " + err.message);
      }
      return;
    }

    // Normal Send
    if (!inputValue.trim() && !selectedImage) return;

    try {
      let payload = {};

      if (selectedImage || replyingTo) {
        payload = {
          type: selectedImage ? 'media' : 'text',
          text: inputValue.trim(),
          media: selectedImage ? selectedImage.dataUrl : null,
          replyTo: replyingTo ? {
            id: replyingTo.id,
            text: getMessageSnippet(replyingTo),
            sender: replyingTo.senderInboxId === xmtpClient?.inboxId ? 'You' : 'Peer'
          } : null,
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
          triggerBotReply(inputValue.trim(), selectedImage ? 'media' : 'text');
        } else {
          await activeConversation.sendText(textPayload);
        }
      } else {
        if (activeConversation.isDemoBot) {
          const localMsg = {
            id: `demo-msg-${new Date().getTime()}`,
            senderInboxId: xmtpClient?.inboxId || 'user-inbox',
            sentAt: new Date().toISOString(),
            content: inputValue.trim()
          };
          setMessages(prev => [...prev, localMsg]);
          triggerBotReply(inputValue.trim(), 'text');
        } else {
          await activeConversation.sendText(inputValue.trim());
        }
      }

      playSendPop();
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
        const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const requestPayload = {
          type: 'crypto_request',
          requestId: reqId,
          amount: amount,
          note: note,
          status: 'pending',
          requester: walletAddress,
          recipient: activeConversation.peerAddress,
          timestamp: new Date().getTime()
        };
        const textPayload = `[JSON_MSG]${JSON.stringify(requestPayload)}`;

        if (activeConversation.isDemoBot) {
          const localMsg = {
            id: `demo-req-${new Date().getTime()}`,
            senderInboxId: xmtpClient?.inboxId || 'user-inbox',
            sentAt: new Date().toISOString(),
            content: textPayload
          };
          setMessages(prev => [...prev, localMsg]);
          triggerBotReply('', 'crypto_request');
        } else {
          await activeConversation.sendText(textPayload);
        }

        playSendPop();
      } catch (err) {
        console.error("Failed to broadcast crypto request", err);
      }
      return;
    }

    try {
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
        playCoinClink();
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

      playCoinClink();

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

  // Helpers
  const getMessageSnippet = (msg) => {
    if (deletedMessages[msg.id]) return '🚫 Deleted message';
    if (editedMessages[msg.id]) return editedMessages[msg.id];
    const data = parseMessageData(msg);
    if (data.type === 'crypto_transfer') return `💸 Sent ${data.amount} ETH`;
    if (data.type === 'crypto_request') return `📥 Request: ${data.amount} ETH`;
    if (data.type === 'media') return data.text ? `📷 ${data.text}` : '📷 Photo';
    if (data.type === 'audio') return `🎤 Voice Note (${data.duration || 0}s)`;
    return data.text || 'Message';
  };

  // Memoized Filtered Conversations based on Search, Nicknames, Pinned, and Tabs
  const filteredConversations = useMemo(() => {
    return conversations
      .filter(convo => {
        const displayId = convo.peerAddress || convo.id || '';
        const peerProf = addressProfiles[displayId.toLowerCase()];
        const customNick = customNicknames[displayId.toLowerCase()] || '';
        const name = peerProf?.username || displayId;
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
      const text = editedMessages[msg.id] || data.text || data.note || '';
      return text.toLowerCase().includes(inChatSearchQuery.toLowerCase());
    });
  }, [messages, disappearingTimer, inChatSearchQuery, editedMessages]);

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

          <div className="whatsapp-header-actions">
            {/* BlockBot AI Companion Button */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Chat with BlockBot Companion"
              onClick={startBlockBotChat}
            >
              🤖
            </button>

            {/* Wallet QR Code Button */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Share Wallet QR"
              onClick={() => setShowQRModal(true)}
            >
              🏁
            </button>

            {/* New conversation focus */}
            {walletAddress && (
              <button 
                type="button" 
                className="whatsapp-icon-btn" 
                title="New Chat"
                onClick={() => searchInputRef.current?.focus()}
              >
                💬
              </button>
            )}

            {/* Arcade Cabinet Themes & Sound Studio */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Arcade Cabinet Themes & 8-Bit Audio Studio"
              onClick={() => setShowThemeModal(true)}
            >
              🕹️
            </button>

            {/* Quick 8-Bit Audio Mute/Unmute */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title={soundEnabled ? "8-Bit Arcade SFX: Active (Click to Mute)" : "8-Bit Arcade SFX: Muted (Click to Unmute)"}
              onClick={handleToggleSound}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>

            {/* Profile Settings */}
            <button 
              type="button" 
              className="whatsapp-icon-btn" 
              title="Settings & Profile"
              onClick={() => setShowProfileModal(true)}
            >
              ⋮
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
            const displayId = convo.peerAddress || convo.id || "Unknown";
            const peerProf = addressProfiles[displayId.toLowerCase()];
            const displayName = getContactDisplayName(displayId, peerProf);
            const customNick = customNicknames[displayId.toLowerCase()];
            const avatarChar = (customNick || peerProf?.username || displayId).substring(displayId.startsWith('0x') && !customNick ? 2 : 0, displayId.startsWith('0x') && !customNick ? 4 : 2).toUpperCase();
            const isPinned = !!pinnedConvos[convo.id];
            const isBot = convo.isDemoBot;
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
                  <div className={`avatar ${isBot ? 'bot-avatar' : ''}`}>
                    {peerProf?.profilePictureCID ? (
                      <img 
                        src={peerProf.profilePictureCID.startsWith('http') ? peerProf.profilePictureCID : `https://ipfs.io/ipfs/${peerProf.profilePictureCID}`} 
                        alt="Avatar" 
                      />
                    ) : (
                      avatarChar || "??"
                    )}
                  </div>
                  <span className={`whatsapp-status-dot ${isBot ? 'bot' : 'online'}`}></span>
                </div>

                <div className="whatsapp-card-content">
                  <div className="whatsapp-card-row-top">
                    <span className="whatsapp-card-title">
                      {displayName}
                      {isBot && <span className="whatsapp-bot-tag">BOT</span>}
                    </span>
                    <span className="whatsapp-card-time">
                      {convo.latestMessage?.sentAt ? formatMessageTime(convo.latestMessage.sentAt) : ''}
                    </span>
                  </div>

                  <div className="whatsapp-card-row-bottom">
                    <p className="whatsapp-card-snippet">
                      {draftText && !isSelected ? (
                        <span className="whatsapp-snippet-draft">Draft: {draftText}</span>
                      ) : (
                        <>
                          <span className="whatsapp-snippet-ticks">✓✓</span>
                          <span>{convo.latestMessage ? getMessageSnippet(convo.latestMessage) : 'Direct message'}</span>
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
                const displayId = activeConversation.peerAddress || activeConversation.id || "Unknown";
                const peerProf = addressProfiles[displayId.toLowerCase()];
                const displayName = getContactDisplayName(displayId, peerProf);
                const customNick = customNicknames[displayId.toLowerCase()];
                const isBot = activeConversation.isDemoBot || displayId.toLowerCase().includes('bot');
                const avatarChar = (customNick || peerProf?.username || displayId).substring(displayId.startsWith('0x') && !customNick ? 2 : 0, displayId.startsWith('0x') && !customNick ? 4 : 2).toUpperCase();

                return (
                  <div className="whatsapp-header-inner">
                    {/* Left: Avatar + Peer Details */}
                    <div className="whatsapp-header-left">
                      <button 
                        type="button" 
                        className="mobile-back-btn" 
                        onClick={() => setActiveConversation(null)}
                        title="Back to conversations"
                        aria-label="Back to conversations"
                      >
                        ←
                      </button>

                      <div 
                        className="whatsapp-header-contact"
                        onClick={() => setShowContactDrawer(true)}
                        title="View contact info"
                      >
                        <div className="avatar">
                          {peerProf?.profilePictureCID ? (
                            <img 
                              src={peerProf.profilePictureCID.startsWith('http') ? peerProf.profilePictureCID : `https://ipfs.io/ipfs/${peerProf.profilePictureCID}`} 
                              alt="Avatar" 
                            />
                          ) : (
                            avatarChar || "??"
                          )}
                        </div>

                        <div className="whatsapp-header-meta">
                          <h3 className="whatsapp-header-name">
                            <span>{displayName}</span>
                            {isBot && <span className="whatsapp-bot-tag">BOT</span>}
                            {pinnedConvos[activeConversation.id] && <span className="whatsapp-pin-icon">📌</span>}
                          </h3>
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

                    {/* Right: Actions (Voice call, Video call, Tip, Search, Drawer) */}
                    <div className="whatsapp-header-actions">
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
                        📞
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
                        📹
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
                        💸
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action" 
                        title="Search in conversation"
                        onClick={() => setShowInChatSearch(!showInChatSearch)}
                      >
                        🔍
                      </button>

                      <button 
                        type="button" 
                        className="whatsapp-icon-action" 
                        title="Contact Details"
                        onClick={() => setShowContactDrawer(true)}
                      >
                        ⋮
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
                    <span className="safety-banner-icon">🛡️</span>
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
                const isSent = msg.senderInboxId === xmtpClient?.inboxId || (!xmtpClient && msg.senderInboxId !== 'bot-inbox');
                const isDeleted = deletedMessages[msg.id];
                const msgData = parseMessageData(msg);
                const renderedText = editedMessages[msg.id] || msgData.text;
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
                            😊
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
                          {isSent && msgData.type === 'text' && (
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
                          <div className="quoted-text">{msgData.replyTo.text}</div>
                        </div>
                      )}

                      {/* Deleted State */}
                      {isDeleted ? (
                        <div className="whatsapp-deleted-text">
                          🚫 <em>This message was deleted</em>
                        </div>
                      ) : (
                        <>
                          {/* Crypto Transfer Receipt Card */}
                          {msgData.type === 'crypto_transfer' && (
                            <CryptoReceipt 
                              data={msgData} 
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
                                <span className={`crypto-request-status ${msgData.status || 'pending'}`}>
                                  {msgData.status === 'paid' ? 'PAID ✓' : 'PENDING'}
                                </span>
                              </div>
                              <div className="crypto-request-amount">
                                <span className="crypto-request-val">{msgData.amount}</span>
                                <span className="crypto-request-symbol">ETH</span>
                              </div>
                              {msgData.note && (
                                <div className="crypto-request-note">
                                  "{msgData.note}"
                                </div>
                              )}
                              <div className="crypto-request-footer">
                                {msgData.status === 'paid' ? (
                                  <div className="crypto-paid-label">
                                    <span>✓ Settled on-chain</span>
                                    {msgData.paidTxHash && (
                                      <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                                        ({formatAddress(msgData.paidTxHash)})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  !isSent && (
                                    <button 
                                      type="button" 
                                      className="crypto-request-pay-btn"
                                      onClick={() => handlePayRequest(msgData)}
                                    >
                                      ⚡ Pay {msgData.amount} ETH Now
                                    </button>
                                  )
                                )}
                                <div className="crypto-requester-info" style={{ marginTop: '4px' }}>
                                  {isSent ? 'Requested by You' : `Requested by ${getContactDisplayName(activeConversation.peerAddress)}`}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Voice Note Audio */}
                          {msgData.type === 'audio' && (
                            <VoiceNotePlayer audioUrl={msgData.audioUrl} duration={msgData.duration} />
                          )}

                          {/* Media Image Attachment */}
                          {msgData.type === 'media' && msgData.media && (
                            <div 
                              className="whatsapp-bubble-image-wrap"
                              onClick={() => setLightboxImage(msgData.media)}
                            >
                              <img src={msgData.media} alt="Attached Media" />
                            </div>
                          )}

                          {/* Text Content with WhatsApp Markdown formatting */}
                          {renderedText && msgData.type !== 'crypto_transfer' && msgData.type !== 'crypto_request' && (
                            <div className="whatsapp-bubble-text">
                              {renderWhatsAppMarkdown(renderedText)}
                              {isEdited && <span className="whatsapp-edited-tag">(edited)</span>}
                            </div>
                          )}

                          {/* Bubble Footer: Time & Double Ticks */}
                          <div className="whatsapp-bubble-meta">
                            {isStarred && <span className="whatsapp-starred-icon">⭐</span>}
                            <span className="whatsapp-time">{msg.sentAt ? formatMessageTime(msg.sentAt) : ''}</span>
                            {isSent && <span className="whatsapp-checks">✓✓</span>}
                          </div>
                        </>
                      )}

                      {/* Emoji Reactions Popover */}
                      {activeReactionPicker === msg.id && (
                        <div className="whatsapp-reaction-picker">
                          {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '☕', '💎', '🚀', '👏', '💯', '✨', '😍', '👀'].map(emoji => (
                            <span 
                              key={emoji} 
                              className="reaction-option" 
                              onClick={() => handleAddReaction(msg.id, emoji)}
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

              {/* Input Bar Form */}
              <div className="whatsapp-composer-bar">
                {isRecording ? (
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
                        🗑️
                      </button>
                      <button 
                        type="button" 
                        className="whatsapp-send-btn" 
                        title="Send Voice Note"
                        onClick={sendVoiceNote}
                      >
                        ➤
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
                          title="Insert Emoji"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          😊
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
                          📎
                        </button>

                        <button 
                          type="button" 
                          className="whatsapp-composer-icon" 
                          title="Send ETH Tip or Request ETH"
                          onClick={() => {
                            setCryptoModalPreset({ mode: 'send', amount: '', note: '' });
                            setShowSendCryptoModal(true);
                          }}
                        >
                          💸
                        </button>
                      </>
                    )}

                    <input 
                      type="text" 
                      className="whatsapp-input-field"
                      placeholder={
                        editingMessage 
                          ? "> Edit message buffer..." 
                          : selectedImage 
                            ? "> Add photo caption..." 
                            : "> Type a message (*bold*, _italic_, ~strike~, `code`)..."
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
                        🎤
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
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
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
            onStartChatClick={() => searchInputRef.current?.focus()}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenQR={() => setShowQRModal(true)}
            onConnectWallet={connectWallet}
            onStartBlockBotChat={startBlockBotChat}
            onStartDemoMode={startDemoMode}
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
      {showContactDrawer && activeConversation && (
        <ContactInfoDrawer 
          peerAddress={activeConversation.peerAddress}
          peerName={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.username || ensName}
          peerAvatar={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.profilePictureCID}
          customNickname={customNicknames[activeConversation.peerAddress?.toLowerCase()] || ''}
          onSaveNickname={(nick) => handleSaveNickname(activeConversation.peerAddress, nick)}
          messages={messages}
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
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* Full-screen Lightbox Image */}
      {lightboxImage && (
        <div className="modal-overlay" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Enlarged media" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
