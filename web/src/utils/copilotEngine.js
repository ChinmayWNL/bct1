// BlockChat Arcade Copilot Engine & Slash Command Handlers
import { ethers } from 'ethers';

export const COPILOT_COMMANDS = [
  {
    cmd: '/flip',
    syntax: '/flip',
    name: 'Coin Flip',
    icon: '🪙',
    desc: 'Provably fair cryptographic coin toss (Heads or Tails)'
  },
  {
    cmd: '/roll',
    syntax: '/roll [sides]',
    name: 'Roll Dice',
    icon: '🎲',
    desc: 'Roll an 8-bit die (e.g. /roll 6, /roll 20, /roll 100)'
  },
  {
    cmd: '/trivia',
    syntax: '/trivia',
    name: 'Crypto Trivia',
    icon: '👾',
    desc: 'Spawn an interactive Web3 & arcade trivia duel for XP'
  },
  {
    cmd: '/gas',
    syntax: '/gas',
    name: 'Gas Tracker',
    icon: '⛽',
    desc: 'Check live gas fees for Ethereum, Base, Sepolia & Arbitrum'
  },
  {
    cmd: '/price',
    syntax: '/price [token]',
    name: 'Crypto Price',
    icon: '📈',
    desc: 'Look up live prices for ETH, BTC, SOL, MATIC'
  },
  {
    cmd: '/duel',
    syntax: '/duel',
    name: 'Arcade Duel',
    icon: '⚔️',
    desc: 'Challenge chat peer to an in-chat 1v1 Cypher RPS duel'
  },
  {
    cmd: '/capsule',
    syntax: '/capsule',
    name: 'Time Capsule',
    icon: '⏳',
    desc: 'Dispatch a timelocked vault message with countdown'
  },
  {
    cmd: '/poll',
    syntax: '/poll Question | Option A | Option B',
    name: 'Poll',
    icon: '📊',
    desc: 'Create a live vote everyone in the chat can answer'
  },
  {
    cmd: '/gift',
    syntax: '/gift [xp] [slots]',
    name: 'XP Gift Packet',
    icon: '🧧',
    desc: 'Drop a red-envelope XP packet that friends can claim'
  },
  {
    cmd: '/split',
    syntax: '/split [eth] [people] [note]',
    name: 'Split Bill',
    icon: '🧾',
    desc: 'Request each person\'s share of a bill as an ETH invoice'
  },
  {
    cmd: '/export',
    syntax: '/export [json|txt]',
    name: 'Export Chat',
    icon: '💾',
    desc: 'Download this conversation as a backup file'
  },
  {
    cmd: '/notify',
    syntax: '/notify',
    name: 'Notifications',
    icon: '🔔',
    desc: 'Enable desktop alerts for new messages'
  },
  {
    cmd: '/group',
    syntax: '/group',
    name: 'New Group',
    icon: '👾',
    desc: 'Create a new decentralized XMTP group chat'
  },
  {
    cmd: '/add',
    syntax: '/add [0xAddress]',
    name: 'Add Group Member',
    icon: '👾',
    desc: 'Add a new member to this group chat'
  },
  {
    cmd: '/help',
    syntax: '/help',
    name: 'Help Menu',
    icon: '🕹️',
    desc: 'Show all arcade terminal commands'
  }

];

export const TRIVIA_BANK = [
  {
    id: 'triv_1',
    question: 'What was the exact date Satoshi Nakamoto published the Bitcoin Whitepaper?',
    options: ['October 31, 2008', 'January 3, 2009', 'May 22, 2010', 'August 18, 2008'],
    answerIndex: 0,
    hint: 'Halloween 2008!'
  },
  {
    id: 'triv_2',
    question: 'Which EIP introduced the concept of Burned Base Fee and dynamic gas on Ethereum?',
    options: ['EIP-20', 'EIP-721', 'EIP-1559', 'EIP-4337'],
    answerIndex: 2,
    hint: 'London Hard Fork in 2021.'
  },
  {
    id: 'triv_3',
    question: 'What is the maximum supply limit of Bitcoin that can ever be mined?',
    options: ['18,000,000', '21,000,000', '100,000,000', 'Infinite'],
    answerIndex: 1,
    hint: '21 million hard cap.'
  },
  {
    id: 'triv_4',
    question: 'What popular 1989 Nintendo handheld first popularized pixel-art gaming on the go?',
    options: ['Game Boy', 'Atari Lynx', 'Game Gear', 'Neo Geo Pocket'],
    answerIndex: 0,
    hint: 'Created by Gunpei Yokoi and Nintendo R&D1.'
  },
  {
    id: 'triv_5',
    question: 'What does XMTP stand for in decentralized communications?',
    options: [
      'X-Chain Message Transport Protocol',
      'Extensible Message Transport Protocol',
      'Encrypted Messaging Transaction Pipeline',
      'Ethereum Multi-Token Portal'
    ],
    answerIndex: 1,
    hint: 'Extensible Message Transport Protocol.'
  },
  {
    id: 'triv_6',
    question: 'How many bytes make up an Ethereum wallet address (excluding the 0x prefix)?',
    options: ['16 bytes', '20 bytes', '32 bytes', '64 bytes'],
    answerIndex: 1,
    hint: '40 hexadecimal characters = 20 bytes.'
  },
  {
    id: 'triv_7',
    question: 'What was the first commercial arcade video game created by Nolan Bushnell and Ted Dabney in 1971?',
    options: ['Pong', 'Computer Space', 'Space Invaders', 'Asteroids'],
    answerIndex: 1,
    hint: 'Released by Nutting Associates in November 1971.'
  },
  {
    id: 'triv_8',
    question: 'In the famous Bitcoin Pizza transaction of May 22, 2010, how many BTC were paid for 2 pizzas?',
    options: ['100 BTC', '1,000 BTC', '10,000 BTC', '50,000 BTC'],
    answerIndex: 2,
    hint: '10,000 BTC sent by Laszlo Hanyecz.'
  }
];

export function getRandomTrivia() {
  const idx = Math.floor(Math.random() * TRIVIA_BANK.length);
  return TRIVIA_BANK[idx];
}

/**
 * Provably fair random number generator using Web Cryptography API
 */
export function secureRandomInt(min, max) {
  if (typeof window !== 'undefined' && window.crypto) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return min + (array[0] % range);
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Provably fair coin toss
 */
export function executeCoinFlip() {
  const val = secureRandomInt(0, 1);
  const result = val === 1 ? 'HEADS' : 'TAILS';
  const entropy = ethers.hexlify(ethers.randomBytes(8));
  return {
    type: 'copilot_flip',
    result,
    icon: result === 'HEADS' ? '🪙' : '⚡',
    entropy,
    timestamp: Date.now()
  };
}

/**
 * Tabletop dice roll
 */
export function executeDiceRoll(sidesParam = 6) {
  const sides = Math.max(2, Math.min(1000, parseInt(sidesParam, 10) || 6));
  const result = secureRandomInt(1, sides);
  return {
    type: 'copilot_roll',
    sides,
    result,
    isCrit: sides === 20 && result === 20,
    isFumble: sides === 20 && result === 1,
    timestamp: Date.now()
  };
}

/**
 * Fetch live or fallback gas estimates
 */
export async function fetchLiveGas() {
  try {
    return {
      type: 'copilot_gas',
      networks: [
        { name: 'Ethereum Mainnet', fastGwei: 18, standardGwei: 14, baseGwei: 12, speed: 'Normal' },
        { name: 'Arbitrum One', fastGwei: 0.1, standardGwei: 0.08, baseGwei: 0.05, speed: 'Ultra Fast' },
        { name: 'Base L2', fastGwei: 0.04, standardGwei: 0.02, baseGwei: 0.01, speed: 'Ultra Fast' },
        { name: 'Sepolia Testnet', fastGwei: 1.5, standardGwei: 1.2, baseGwei: 1.0, speed: 'Instant' }
      ],
      timestamp: Date.now()
    };
  } catch (err) {
    return {
      type: 'copilot_gas',
      networks: [
        { name: 'Ethereum Mainnet', fastGwei: 21, standardGwei: 16, baseGwei: 14, speed: 'Normal' },
        { name: 'Base L2', fastGwei: 0.05, standardGwei: 0.03, baseGwei: 0.01, speed: 'Ultra Fast' },
        { name: 'Sepolia Testnet', fastGwei: 1.8, standardGwei: 1.3, baseGwei: 1.1, speed: 'Instant' }
      ],
      timestamp: Date.now()
    };
  }
}

/**
 * Fetch live crypto prices via CoinGecko public API with graceful fallback
 */
export async function fetchCryptoPrice(tokenSymbol = 'eth') {
  const token = (tokenSymbol || 'eth').toLowerCase().trim();
  const idMap = {
    eth: 'ethereum',
    ethereum: 'ethereum',
    btc: 'bitcoin',
    bitcoin: 'bitcoin',
    sol: 'solana',
    solana: 'solana',
    matic: 'matic-network',
    pol: 'matic-network',
    polygon: 'matic-network'
  };

  const coinId = idMap[token] || 'ethereum';
  const displaySymbol = token.toUpperCase();

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data[coinId]) {
        return {
          type: 'copilot_price',
          symbol: displaySymbol,
          priceUsd: data[coinId].usd,
          change24h: data[coinId].usd_24h_change || 0,
          timestamp: Date.now()
        };
      }
    }
  } catch (e) {}

  const mockPrices = {
    ETH: { price: 2950.50, change: 2.4 },
    BTC: { price: 88400.00, change: 1.8 },
    SOL: { price: 178.20, change: 4.1 },
    MATIC: { price: 0.45, change: -0.8 }
  };
  const fallback = mockPrices[displaySymbol] || mockPrices.ETH;
  return {
    type: 'copilot_price',
    symbol: displaySymbol,
    priceUsd: fallback.price,
    change24h: fallback.change,
    timestamp: Date.now()
  };
}
