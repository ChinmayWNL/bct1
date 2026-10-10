'use client';
import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { USER_REGISTRY_ABI, DEFAULT_USER_REGISTRY_ADDRESS } from './contracts';
import VoiceNotePlayer from '@/components/VoiceNotePlayer';
import HeroDashboard from '@/components/HeroDashboard';
import SendCryptoModal from '@/components/SendCryptoModal';
import QRCodeModal from '@/components/QRCodeModal';
import EmojiPicker from '@/components/EmojiPicker';
import ProfileModal from '@/components/ProfileModal';
import CryptoReceipt from '@/components/CryptoReceipt';
import CallModal from '@/components/CallModal';
import ContactInfoDrawer from '@/components/ContactInfoDrawer';

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
  const [activeCall, setActiveCall] = useState(null); // null | { type: 'voice' | 'video' }
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
  const [reactionsMap, setReactionsMap] = useState({});

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio Notification Chime (Honors Mute Setting)
  const playNotificationSound = () => {
    if (isChatMuted) return;
    try {
      if (typeof window === 'undefined') return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
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

  // Disappearing Timer Handler
  const handleSetDisappearingTimer = (seconds) => {
    setDisappearingTimer(seconds);
    try {
      localStorage.setItem('blockchat_disappearing_timer', String(seconds));
    } catch (e) {}
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

        // Fetch Network name
        try {
          const net = await ethProvider.getNetwork();
          const netNames = {
            1: 'Ethereum Mainnet',
            11155111: 'Sepolia Testnet',
            42161: 'Arbitrum One',
            8453: 'Base',
            137: 'Polygon',
            31337: 'Hardhat Local'
          };
          setNetworkName(netNames[Number(net.chainId)] || net.name || `Chain ${net.chainId}`);
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

  // Helper to apply incoming control events (delete / edit)
  const processIncomingMessage = (message) => {
    const data = parseMessageData(message);
    if (data.type === 'delete' && data.targetId) {
      setDeletedMessages(prev => ({ ...prev, [data.targetId]: true }));
      return false;
    }
    if (data.type === 'edit' && data.targetId) {
      setEditedMessages(prev => ({ ...prev, [data.targetId]: data.newText }));
      return false;
    }
    return true;
  };

  const selectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setReplyingTo(null);
    setSelectedImage(null);
    setEditingMessage(null);
    setInChatSearchQuery('');
    setShowInChatSearch(false);
    setShowContactDrawer(false);

    if (conversation.isDemoBot) {
      // Demo bot conversation loading
      const botMsgs = await conversation.messages();
      setMessages(botMsgs);
      return;
    }

    try {
      const rawMsgs = await conversation.messages();
      const displayMsgs = [];
      const newDeleted = {};
      const newEdited = {};

      for (const m of rawMsgs) {
        const d = parseMessageData(m);
        if (d.type === 'delete' && d.targetId) {
          newDeleted[d.targetId] = true;
        } else if (d.type === 'edit' && d.targetId) {
          newEdited[d.targetId] = d.newText;
        } else {
          displayMsgs.push(m);
        }
      }

      setDeletedMessages(prev => ({ ...prev, ...newDeleted }));
      setEditedMessages(prev => ({ ...prev, ...newEdited }));
      setMessages(displayMsgs);
      
      const stream = await conversation.stream();
      for await (const message of stream) {
        const isDisplayable = processIncomingMessage(message);
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

  // Bot Response Simulator for BlockBot Demo (With WhatsApp "Typing..." state)
  const triggerBotReply = (userMsgText, type = 'text') => {
    setPeerTyping(true);

    setTimeout(() => {
      setPeerTyping(false);
      let replyContent = "Encrypted message verified! 🚀 BlockChat is performing at peak efficiency.";
      if (type === 'crypto_transfer') {
        replyContent = "Thank you so much for the ETH tip! 💎 Transaction confirmed and logged to blockchain state.";
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

      setMessages(prev => [...prev, botMessage]);
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

      setInputValue('');
      setSelectedImage(null);
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to send message", err);
      alert("Failed to send message: " + err.message);
    }
  };

  // Crypto Transfer Success Handler
  const handleCryptoTransferSuccess = async ({ amount, txHash, note }) => {
    if (!activeConversation) return;

    try {
      const cryptoPayload = {
        type: 'crypto_transfer',
        amount: amount,
        txHash: txHash,
        note: note,
        from: walletAddress,
        to: activeConversation.peerAddress,
        timestamp: new Date().getTime()
      };
      const textPayload = `[JSON_MSG]${JSON.stringify(cryptoPayload)}`;

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

      // Refresh balance
      if (provider && walletAddress) {
        refreshBalance(provider, walletAddress);
      }
    } catch (err) {
      console.error("Failed to record crypto transfer message", err);
    }
  };

  const handleAddReaction = (messageId, emoji) => {
    setReactionsMap(prev => {
      const existing = prev[messageId] || [];
      const updated = existing.includes(emoji) 
        ? existing.filter(e => e !== emoji)
        : [...existing, emoji];
      return { ...prev, [messageId]: updated };
    });
    setActiveReactionPicker(null);
  };

  // Helpers
  const formatAddress = (address) => {
    if (!address) return '';
    if (address.startsWith('0x') && address.length === 42) {
      return `${address.substring(0,6)}...${address.substring(address.length - 4)}`;
    }
    if (address.length > 12) {
      return `${address.substring(0,6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };

  const parseMessageData = (msg) => {
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
  };

  const getMessageSnippet = (msg) => {
    if (deletedMessages[msg.id]) return '🚫 Deleted message';
    if (editedMessages[msg.id]) return editedMessages[msg.id];
    const data = parseMessageData(msg);
    if (data.type === 'crypto_transfer') return `💸 Sent ${data.amount} ETH`;
    if (data.type === 'media') return data.text ? `📷 ${data.text}` : '📷 Photo';
    if (data.type === 'audio') return `🎤 Voice Note (${data.duration || 0}s)`;
    return data.text || 'Message';
  };

  const formatMessageTime = (dateObj) => {
    if (!dateObj) return '';
    const date = new Date(dateObj);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRecordingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter Conversations based on Search, Pinned, and Tabs
  const filteredConversations = conversations
    .filter(convo => {
      const displayId = convo.peerAddress || convo.id || '';
      const peerProf = addressProfiles[displayId.toLowerCase()];
      const name = peerProf?.username || displayId;
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'pinned') {
        return !!pinnedConvos[convo.id];
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

  const pinnedCount = Object.values(pinnedConvos).filter(Boolean).length;

  // Filter messages for active in-thread search and disappearing messages
  const visibleMessages = messages.filter(msg => {
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

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand-title">
            <span>⚡</span> BlockChat
          </div>
          <div className="header-actions">
            {walletAddress ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="wallet-meta-pill" title={`${networkName} • ${userBalance} ETH`}>
                  <div className="network-indicator-pill">
                    <span className="network-dot"></span>
                    <span>{networkName ? networkName.split(' ')[0] : 'Web3'}</span>
                  </div>
                  <span className="eth-balance-badge">
                    {parseFloat(userBalance).toFixed(3)} Ξ
                  </span>
                </div>
                <button 
                  className="icon-btn" 
                  title="Share Wallet QR"
                  onClick={() => setShowQRModal(true)}
                >
                  🏁
                </button>
                <button 
                  className="icon-btn" 
                  title="Identity & Profile Settings"
                  onClick={() => setShowProfileModal(true)}
                >
                  ⚙️
                </button>
              </div>
            ) : (
              <button 
                className="btn-connect" 
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </div>
        </div>

        {/* User On-Chain Profile Badge */}
        {walletAddress && (
          <div className="user-profile-badge" onClick={() => setShowProfileModal(true)}>
            <div className="user-profile-info">
              <div className="badge-avatar">
                {userProfile.profilePictureCID ? (
                  <img 
                    src={userProfile.profilePictureCID.startsWith('http') ? userProfile.profilePictureCID : `https://ipfs.io/ipfs/${userProfile.profilePictureCID}`} 
                    alt="Avatar" 
                  />
                ) : (
                  (userProfile.username || walletAddress).substring(2, 4).toUpperCase()
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div className="user-profile-name">
                  {userProfile.username ? `@${userProfile.username}` : (ensName || "Set Username")}
                </div>
                <div className="user-profile-addr">
                  {formatAddress(walletAddress)}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>✏️</span>
          </div>
        )}

        {/* Sidebar Search Bar */}
        <div className="sidebar-search-box">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              ref={searchInputRef}
              type="text" 
              className="search-input" 
              placeholder="Search contacts, addresses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar Filter Tabs */}
        {walletAddress && (
          <div className="sidebar-tabs">
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All <span className="tab-count-badge">{conversations.length}</span>
            </button>
            <button 
              type="button" 
              className={`tab-btn ${activeTab === 'pinned' ? 'active' : ''}`}
              onClick={() => setActiveTab('pinned')}
            >
              Pinned 📌 {pinnedCount > 0 && <span className="tab-count-badge">{pinnedCount}</span>}
            </button>
          </div>
        )}

        {/* Start New Chat Input with ENS Support */}
        {walletAddress && (
          <div className="new-chat-bar">
            <input 
              type="text" 
              className="new-chat-input" 
              placeholder="Enter 0x... address or name.eth" 
              value={newContactAddress}
              onChange={(e) => setNewContactAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startNewConversation()}
            />
            <button className="btn-new-chat" onClick={() => startNewConversation()}>
              + Chat
            </button>
          </div>
        )}

        {/* Conversation List */}
        <div className="chat-list">
          {filteredConversations.map(convo => {
            const displayId = convo.peerAddress || convo.id || "Unknown";
            const peerProf = addressProfiles[displayId.toLowerCase()];
            const displayName = peerProf?.username ? `@${peerProf.username}` : formatAddress(displayId);
            const avatarChar = (peerProf?.username || displayId).substring(displayId.startsWith('0x') ? 2 : 0, displayId.startsWith('0x') ? 4 : 2).toUpperCase();
            const isPinned = !!pinnedConvos[convo.id];

            return (
              <div 
                key={convo.id} 
                className={`conversation-item ${activeConversation?.id === convo.id ? 'active' : ''}`}
                onClick={() => selectConversation(convo)}
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
                <div className="chat-info">
                  <div className="chat-info-header">
                    <h4>{displayName}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        type="button" 
                        className={`convo-pin-btn ${isPinned ? 'pinned' : ''}`}
                        title={isPinned ? "Unpin chat" : "Pin chat to top"}
                        onClick={(e) => togglePinConversation(e, convo.id)}
                      >
                        📌
                      </button>
                      <span className="chat-time">
                        {convo.createdAt ? formatMessageTime(convo.createdAt) : ''}
                      </span>
                    </div>
                  </div>
                  <p className="preview">
                    {convo.latestMessage ? getMessageSnippet(convo.latestMessage) : 'Start an encrypted chat'}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && walletAddress && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
              {activeTab === 'pinned' ? (
                <div>No pinned chats yet. Click the 📌 icon on any conversation!</div>
              ) : searchQuery ? (
                "No conversations matching search."
              ) : (
                <div>
                  <p style={{ marginBottom: '12px' }}>No conversations yet.</p>
                  <button className="quick-action-chip bot-chip" onClick={startBlockBotChat}>
                    🤖 Chat with BlockBot Demo
                  </button>
                </div>
              )}
            </div>
          )}

          {!walletAddress && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ marginBottom: '16px', fontSize: '0.95rem' }}>Connect your Web3 wallet to access your encrypted conversations.</p>
              <button className="btn-connect" onClick={connectWallet}>Connect Wallet</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area with WhatsApp Texture */}
      <div className="chat-area chat-area-wallpaper">
        {activeConversation ? (
          <>
            {/* Active Header */}
            <div className="active-chat-header">
              {(() => {
                const displayId = activeConversation.peerAddress || activeConversation.id || "Unknown";
                const peerProf = addressProfiles[displayId.toLowerCase()];
                const displayName = peerProf?.username ? `@${peerProf.username}` : formatAddress(displayId);
                const avatarChar = (peerProf?.username || displayId).substring(displayId.startsWith('0x') ? 2 : 0, displayId.startsWith('0x') ? 4 : 2).toUpperCase();

                return (
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Clickable Header for WhatsApp Contact Info */}
                    <div 
                      className="chat-header-user" 
                      onClick={() => setShowContactDrawer(true)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view Contact Info"
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
                      <div>
                        <h3 style={{ fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{displayName}</span>
                          {pinnedConvos[activeConversation.id] && <span style={{ fontSize: '0.8rem' }}>📌</span>}
                        </h3>
                        {peerTyping ? (
                          <p className="typing-status-text" style={{ fontSize: '0.75rem' }}>
                            <span>typing</span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                          </p>
                        ) : (
                          <p style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="status-indicator" style={{ width: '6px', height: '6px', margin: 0 }}></span> 
                            <span>Online • E2EE Encrypted</span>
                            {disappearingTimer > 0 && (
                              <span style={{ marginLeft: '6px', color: '#f59e0b' }}>
                                ⏱️ {disappearingTimer === 60 ? '1m' : disappearingTimer === 86400 ? '24h' : '7d'}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* WhatsApp Voice Call */}
                      <button 
                        type="button" 
                        className="header-call-btn" 
                        title="Voice Call"
                        onClick={() => setActiveCall({ type: 'voice' })}
                      >
                        📞
                      </button>

                      {/* WhatsApp Video Call */}
                      <button 
                        type="button" 
                        className="header-call-btn" 
                        title="Video Call"
                        onClick={() => setActiveCall({ type: 'video' })}
                      >
                        📹
                      </button>

                      {/* Send Crypto Tip Button */}
                      <button 
                        type="button" 
                        className="btn-crypto-tip"
                        title="Send ETH Tip / Payment"
                        onClick={() => setShowSendCryptoModal(true)}
                      >
                        💸
                      </button>

                      {/* In-Thread Search Toggle */}
                      <button 
                        type="button" 
                        className="icon-btn" 
                        title="Search messages"
                        onClick={() => setShowInChatSearch(!showInChatSearch)}
                      >
                        🔍
                      </button>

                      {/* Contact Info Drawer Trigger */}
                      <button 
                        type="button" 
                        className="icon-btn" 
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

            {/* In-Chat Search Bar */}
            {showInChatSearch && (
              <div className="in-chat-search-bar">
                <span>🔍</span>
                <input 
                  type="text" 
                  className="in-chat-search-input" 
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
            
            {/* Messages Stream */}
            <div className="messages">
              {visibleMessages.map((msg, idx) => {
                const isSent = msg.senderInboxId === xmtpClient?.inboxId || (!xmtpClient && msg.senderInboxId !== 'bot-inbox');
                const isDeleted = deletedMessages[msg.id];
                const msgData = parseMessageData(msg);
                const renderedText = editedMessages[msg.id] || msgData.text;
                const isEdited = !!editedMessages[msg.id];
                const reactions = reactionsMap[msg.id] || [];
                const isStarred = !!starredMessages[msg.id];

                return (
                  <div key={msg.id || idx} className={`message-row ${isSent ? 'sent' : 'received'}`}>
                    <div className="message-bubble-wrapper">
                      {/* Hover Actions (Reply, React, Star, Edit, Delete) */}
                      {!isDeleted && (
                        <div className="message-hover-actions">
                          <button 
                            className="action-btn-small" 
                            title="Reply"
                            onClick={() => setReplyingTo(msg)}
                          >
                            ↩
                          </button>
                          <button 
                            className="action-btn-small" 
                            title="React"
                            onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
                          >
                            😊
                          </button>
                          <button 
                            className={`action-btn-small ${isStarred ? 'active-star' : ''}`}
                            title={isStarred ? "Unstar Message" : "Star Message"}
                            onClick={() => toggleStarMessage(msg.id)}
                          >
                            ⭐
                          </button>
                          {isSent && msgData.type === 'text' && (
                            <button 
                              className="action-btn-small" 
                              title="Edit Message"
                              onClick={() => handleStartEdit(msg)}
                            >
                              ✏️
                            </button>
                          )}
                          {isSent && (
                            <button 
                              className="action-btn-small action-btn-delete" 
                              title="Delete Message"
                              onClick={() => handleDeleteMessage(msg)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}

                      {/* Floating Emoji Reaction Popover */}
                      {activeReactionPicker === msg.id && (
                        <div className="emoji-picker-popover">
                          {['👍', '❤️', '😂', '😮', '🔥', '💎', '🚀'].map(emoji => (
                            <span 
                              key={emoji} 
                              className="emoji-opt" 
                              onClick={() => handleAddReaction(msg.id, emoji)}
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bubble */}
                      {isDeleted ? (
                        <div className={`message-bubble deleted ${isSent ? 'sent' : 'received'}`}>
                          <span>🚫 This message was deleted</span>
                        </div>
                      ) : (
                        <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}>
                          {/* Quoted Reply Banner inside Message */}
                          {msgData.replyTo && (
                            <div className="quoted-reply-box">
                              <div className="quoted-reply-sender">{msgData.replyTo.sender}</div>
                              <div>{msgData.replyTo.text}</div>
                            </div>
                          )}

                          {/* Crypto Transfer Receipt Card */}
                          {msgData.type === 'crypto_transfer' && (
                            <CryptoReceipt 
                              data={msgData} 
                              isSent={isSent} 
                              networkName={networkName} 
                            />
                          )}

                          {/* Voice Note Audio inside Bubble */}
                          {msgData.type === 'audio' && (
                            <VoiceNotePlayer audioUrl={msgData.audioUrl} duration={msgData.duration} />
                          )}

                          {/* Image Attachment inside Bubble */}
                          {msgData.type === 'media' && msgData.media && (
                            <div 
                              className="message-image-wrapper"
                              onClick={() => setLightboxImage(msgData.media)}
                            >
                              <img src={msgData.media} alt="Attached Media" />
                            </div>
                          )}

                          {/* Text Content */}
                          {renderedText && msgData.type !== 'crypto_transfer' && (
                            <div>
                              {renderedText}
                              {isEdited && <span className="message-edited-tag">(edited)</span>}
                            </div>
                          )}

                          {/* Metadata, Star Badge & WhatsApp Blue Double-Ticks */}
                          <div className="message-meta">
                            {isStarred && <span className="starred-badge">⭐</span>}
                            <span>{msg.sentAt ? formatMessageTime(msg.sentAt) : ''}</span>
                            {isSent && <span className="check-icon read">✓✓</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reaction Badges */}
                    {!isDeleted && reactions.length > 0 && (
                      <div className="reaction-badges">
                        {reactions.map((r, rIdx) => (
                          <div key={rIdx} className="reaction-pill">
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

            {/* Chat Composer */}
            <div className="chat-composer-container">
              {/* Editing Banner */}
              {editingMessage && (
                <div className="edit-banner">
                  <div>
                    <span style={{ fontWeight: 600 }}>✏️ Editing Message: </span>
                    <span style={{ opacity: 0.85 }}>{editingMessage.originalText}</span>
                  </div>
                  <button className="banner-close-btn" onClick={handleCancelEdit}>✕</button>
                </div>
              )}

              {/* Quoted Reply Banner */}
              {!editingMessage && replyingTo && (
                <div className="reply-banner">
                  <div>
                    <span style={{ fontWeight: 600 }}>Replying to: </span>
                    <span>{getMessageSnippet(replyingTo)}</span>
                  </div>
                  <button className="banner-close-btn" onClick={() => setReplyingTo(null)}>✕</button>
                </div>
              )}

              {/* Image Preview Banner */}
              {!editingMessage && selectedImage && (
                <div className="media-preview-banner">
                  <div className="media-preview-thumb">
                    <img src={selectedImage.dataUrl} alt="Preview" />
                    <button className="remove-media-btn" onClick={() => setSelectedImage(null)}>✕</button>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ready to send image</span>
                </div>
              )}

              {/* Composer Floating Emoji Picker */}
              {showEmojiPicker && (
                <EmojiPicker 
                  onSelectEmoji={(emoji) => setInputValue(prev => prev + emoji)}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}

              {/* Input / Voice Note Recording Form */}
              <div className="chat-input">
                {isRecording ? (
                  <div className="recording-bar">
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
                        className="btn-send" 
                        title="Send Voice Note"
                        style={{ width: '38px', height: '38px' }}
                        onClick={sendVoiceNote}
                      >
                        ➤
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '10px' }}>
                    {!editingMessage && (
                      <>
                        {/* Attach Media */}
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          style={{ display: 'none' }} 
                          accept="image/*" 
                          onChange={handleImageSelect}
                        />
                        <button 
                          type="button" 
                          className="btn-attach" 
                          title="Attach Media"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📎
                        </button>

                        {/* Emoji Keyboard Popover Trigger */}
                        <button 
                          type="button" 
                          className="btn-attach" 
                          title="Insert Emoji"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          😊
                        </button>

                        {/* Send ETH Tip Button */}
                        <button 
                          type="button" 
                          className="btn-attach" 
                          title="Send ETH Tip / Transfer"
                          onClick={() => setShowSendCryptoModal(true)}
                        >
                          💸
                        </button>
                      </>
                    )}
                    <input 
                      type="text" 
                      placeholder={
                        editingMessage 
                          ? "Edit your message and press Enter..." 
                          : selectedImage 
                            ? "Add a caption..." 
                            : "Type an encrypted message..."
                      } 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    {!editingMessage && (
                      <button 
                        type="button" 
                        className="btn-mic" 
                        title="Record Voice Note"
                        onClick={startRecording}
                      >
                        🎤
                      </button>
                    )}
                    <button type="submit" className="btn-send" title={editingMessage ? "Save Edit" : "Send Message"}>
                      {editingMessage ? (
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span>
                      ) : (
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
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
          /* Hero Command Center Dashboard */
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
          />
        )}
      </div>

      {/* WhatsApp Voice / Video Calling Modal */}
      {activeCall && activeConversation && (
        <CallModal 
          callType={activeCall.type}
          peerAddress={activeConversation.peerAddress}
          peerName={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.username || ensName}
          peerAvatar={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.profilePictureCID}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* WhatsApp Contact Info Slide-Out Drawer */}
      {showContactDrawer && activeConversation && (
        <ContactInfoDrawer 
          peerAddress={activeConversation.peerAddress}
          peerName={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.username || ensName}
          peerAvatar={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.profilePictureCID}
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
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* In-Chat Send Crypto Modal */}
      {showSendCryptoModal && activeConversation && (
        <SendCryptoModal 
          recipientAddress={activeConversation.peerAddress}
          recipientName={addressProfiles[activeConversation.peerAddress?.toLowerCase()]?.username || ensName}
          userBalance={userBalance}
          signer={signer}
          onClose={() => setShowSendCryptoModal(false)}
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

      {/* Full-screen Lightbox Image */}
      {lightboxImage && (
        <div className="modal-overlay" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Enlarged media" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
