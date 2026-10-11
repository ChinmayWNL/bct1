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
  if (!chainId) return DEFAULT_USER_REGISTRY_ADDRESS;
  const id = Number(chainId);
  return USER_REGISTRY_ADDRESSES[id] || DEFAULT_USER_REGISTRY_ADDRESS;
};
