import deployments from './deployments.json';

/**
 * Resolve a deployed address for a contract on a chain from deployments.json
 * (written by `npx hardhat run scripts/deploy.js --network <net>`). Returns null if not deployed.
 */
export const getDeployedAddress = (name, chainId) => {
  const id = String(Number(chainId) || 31337);
  return deployments?.[id]?.[name] || null;
};

// Contract ABI and configuration for UserRegistry
export const USER_REGISTRY_ABI = [
  "function registerUser(string _username, string _profilePictureCID) external",
  "function updateProfilePicture(string _newCID) external",
  "function getProfile(address _wallet) external view returns (tuple(string username, string profilePictureCID, bool isRegistered))",
  "function profiles(address) external view returns (string username, string profilePictureCID, bool isRegistered)",
  "function usernameToAddress(string) external view returns (address)",
  "event UserRegistered(address indexed wallet, string username, string profilePictureCID)",
  "event ProfileUpdated(address indexed wallet, string profilePictureCID)"
];

// Default contract address (can be set to deployed address or local testnet)
export const DEFAULT_USER_REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Registry addresses per standard EIP-155 chain ID
export const USER_REGISTRY_ADDRESSES = {
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Hardhat Local
  1337: "0x5FbDB2315678afecb367f032d93F642f64180aa3",  // Ganache
  11155111: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Sepolia Testnet
  42161: "0x5FbDB2315678afecb367f032d93F642f64180aa3",    // Arbitrum One
  8453: "0x5FbDB2315678afecb367f032d93F642f64180aa3",     // Base
  137: "0x5FbDB2315678afecb367f032d93F642f64180aa3"       // Polygon
};

/**
 * Returns the UserRegistry contract address for the current chain
 * @param {number|string} chainId
 * @returns {string}
 */
export const getUserRegistryAddress = (chainId) => {
  const deployed = getDeployedAddress('UserRegistry', chainId);
  if (deployed) return deployed;
  if (!chainId) return DEFAULT_USER_REGISTRY_ADDRESS;
  const id = Number(chainId);
  return USER_REGISTRY_ADDRESSES[id] || DEFAULT_USER_REGISTRY_ADDRESS;
};

// Contract ABI and configuration for ArcadeDuelEscrow
export const ARCADE_DUEL_ESCROW_ABI = [
  "function createDuel(bytes32 commitHash) external payable returns (uint256 duelId)",
  "function respondDuel(uint256 duelId, uint8 opponentMove) external payable",
  "function revealAndSettle(uint256 duelId, uint8 challengerMove, string calldata salt) external",
  "function claimTimeout(uint256 duelId) external",
  "function cancelDuel(uint256 duelId) external",
  "function getDuel(uint256 duelId) external view returns (tuple(uint256 duelId, address challenger, address opponent, bytes32 commitHash, uint256 wager, uint8 opponentMove, uint8 challengerMove, uint8 state, uint8 winner, uint256 createdAt, uint256 revealDeadline))",
  "event DuelCreated(uint256 indexed duelId, address indexed challenger, bytes32 commitHash, uint256 wager)",
  "event DuelAccepted(uint256 indexed duelId, address indexed opponent, uint8 opponentMove, uint256 revealDeadline)",
  "event DuelResolved(uint256 indexed duelId, uint8 winner, uint8 challengerMove, uint8 opponentMove, uint256 payout)",
  "event DuelCancelled(uint256 indexed duelId, address indexed challenger, uint256 refundAmount)",
  "event DuelForfeited(uint256 indexed duelId, address indexed winner, uint256 payout)"
];

// Default contract address for ArcadeDuelEscrow
export const DEFAULT_DUEL_ESCROW_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const DUEL_ESCROW_ADDRESSES = {
  31337: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Hardhat Local
  1337: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",  // Ganache
  11155111: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Sepolia Testnet
  42161: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",    // Arbitrum One
  8453: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",     // Base
  137: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"       // Polygon
};

/**
 * Returns the ArcadeDuelEscrow contract address for the current chain
 * @param {number|string} chainId
 * @returns {string}
 */
export const getDuelEscrowAddress = (chainId) => {
  const deployed = getDeployedAddress('ArcadeDuelEscrow', chainId);
  if (deployed) return deployed;
  if (!chainId) return DEFAULT_DUEL_ESCROW_ADDRESS;
  const id = Number(chainId);
  return DUEL_ESCROW_ADDRESSES[id] || DEFAULT_DUEL_ESCROW_ADDRESS;
};

// Contract ABI and configuration for TimeCapsuleVault
export const TIME_CAPSULE_VAULT_ABI = [
  "function createCapsule(address recipient, uint64 unlockTime, string title, string payload) external payable returns (uint256 capsuleId)",
  "function open(uint256 capsuleId) external returns (string payload)",
  "function getPayload(uint256 capsuleId) external view returns (string)",
  "function getCapsule(uint256 capsuleId) external view returns (tuple(uint256 capsuleId, address sender, address recipient, uint64 unlockTime, uint64 createdAt, uint256 value, bool opened, string title))",
  "event CapsuleCreated(uint256 indexed capsuleId, address indexed sender, address indexed recipient, uint64 unlockTime, uint256 value)",
  "event CapsuleOpened(uint256 indexed capsuleId, address indexed recipient, string payload, uint256 value)"
];

/** Returns the TimeCapsuleVault address for the chain, or null if not deployed. */
export const getTimeCapsuleVaultAddress = (chainId) => getDeployedAddress('TimeCapsuleVault', chainId);

// Contract ABI and configuration for InvoiceManager (payment requests + split bills)
export const INVOICE_MANAGER_ABI = [
  "function createInvoice(address payer, uint256 amount, uint32 maxPayers, string note) external returns (uint256 invoiceId)",
  "function payInvoice(uint256 invoiceId) external payable",
  "function cancelInvoice(uint256 invoiceId) external",
  "function getInvoice(uint256 invoiceId) external view returns (tuple(uint256 invoiceId, address creator, address payer, uint256 amount, uint32 maxPayers, uint32 paidCount, bool cancelled, uint64 createdAt, string note))",
  "function hasPaid(uint256 invoiceId, address account) external view returns (bool)",
  "event InvoiceCreated(uint256 indexed invoiceId, address indexed creator, address indexed payer, uint256 amount, uint32 maxPayers)",
  "event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount, uint32 paidCount)",
  "event InvoiceCancelled(uint256 indexed invoiceId, address indexed creator)"
];

/** Returns the InvoiceManager address for the chain, or null if not deployed. */
export const getInvoiceManagerAddress = (chainId) => getDeployedAddress('InvoiceManager', chainId);


// Contract ABI and configuration for GiftPacketVault (ETH gift packets)
export const GIFT_PACKET_VAULT_ABI = [
  "function createPacket(uint32 slots, uint64 expiresAt, string message) external payable returns (uint256 packetId)",
  "function claimPacket(uint256 packetId) external returns (uint256 prize)",
  "function refundExpired(uint256 packetId) external",
  "function getPacket(uint256 packetId) external view returns (tuple(uint256 packetId, address creator, uint256 total, uint256 claimedAmount, uint32 slots, uint32 claimedCount, uint64 expiresAt, bool refunded, string message))",
  "function hasClaimed(uint256 packetId, address account) external view returns (bool)",
  "function prizeAt(uint256 packetId, uint32 index) external view returns (uint256)",
  "event PacketCreated(uint256 indexed packetId, address indexed creator, uint256 total, uint32 slots, uint64 expiresAt)",
  "event PacketClaimed(uint256 indexed packetId, address indexed claimer, uint256 prize, uint32 claimedCount)",
  "event PacketRefunded(uint256 indexed packetId, address indexed creator, uint256 amount)"
];

/** Returns the GiftPacketVault address for the chain, or null if not deployed. */
export const getGiftPacketVaultAddress = (chainId) => getDeployedAddress('GiftPacketVault', chainId);

// Contract ABI and configuration for PollRegistry (on-chain polls)
export const POLL_REGISTRY_ABI = [
  "function createPoll(string question, string[] options, uint64 closesAt) external returns (uint256 pollId)",
  "function vote(uint256 pollId, uint8 option) external",
  "function closePoll(uint256 pollId) external",
  "function getPoll(uint256 pollId) external view returns (tuple(uint256 pollId, address creator, string question, string[] options, uint32[] counts, uint32 totalVotes, uint64 closesAt, bool closed, uint64 createdAt))",
  "function voteOf(uint256 pollId, address account) external view returns (bool voted, uint8 option)",
  "event PollCreated(uint256 indexed pollId, address indexed creator, uint8 optionCount, uint64 closesAt)",
  "event Voted(uint256 indexed pollId, address indexed voter, uint8 option, bool changed)",
  "event PollClosed(uint256 indexed pollId, address indexed creator)"
];

/** Returns the PollRegistry address for the chain, or null if not deployed. */
export const getPollRegistryAddress = (chainId) => getDeployedAddress('PollRegistry', chainId);
