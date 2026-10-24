// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserRegistry
 * @notice On-chain username + avatar registry. One permanent username per wallet,
 *         unique (case-insensitive) across the registry. Avatar can be updated.
 */
contract UserRegistry {
    struct Profile {
        string username;
        string profilePictureCID;
        bool isRegistered;
    }

    uint256 public constant MIN_USERNAME = 3;
    uint256 public constant MAX_USERNAME = 20;
    uint256 public constant MAX_CID = 256;

    mapping(address => Profile) public profiles;
    // keyed by lowercase username
    mapping(bytes32 => address) private _usernameOwner;

    event UserRegistered(address indexed wallet, string username, string profilePictureCID);
    event ProfileUpdated(address indexed wallet, string profilePictureCID);

    error AlreadyRegistered();
    error NotRegistered();
    error InvalidUsername();
    error UsernameTaken();
    error CIDTooLong();

    function registerUser(string calldata _username, string calldata _profilePictureCID) external {
        if (profiles[msg.sender].isRegistered) revert AlreadyRegistered();
        if (bytes(_profilePictureCID).length > MAX_CID) revert CIDTooLong();

        bytes32 key = _normalizedKey(_username);
        if (_usernameOwner[key] != address(0)) revert UsernameTaken();

        _usernameOwner[key] = msg.sender;
        profiles[msg.sender] = Profile(_username, _profilePictureCID, true);
        emit UserRegistered(msg.sender, _username, _profilePictureCID);
    }

    function updateProfilePicture(string calldata _newCID) external {
        if (!profiles[msg.sender].isRegistered) revert NotRegistered();
        if (bytes(_newCID).length > MAX_CID) revert CIDTooLong();
        profiles[msg.sender].profilePictureCID = _newCID;
        emit ProfileUpdated(msg.sender, _newCID);
    }

    function getProfile(address _wallet) external view returns (Profile memory) {
        return profiles[_wallet];
    }

    function usernameToAddress(string calldata _username) external view returns (address) {
        bytes memory b = bytes(_username);
        if (b.length < MIN_USERNAME || b.length > MAX_USERNAME) return address(0);
        return _usernameOwner[keccak256(_lower(b))];
    }

    /// @notice Fallback to safely absorb wallet introspection probes (e.g. MetaMask token checks) without reverting.
    fallback() external {
    }

    /// @dev Validates [a-zA-Z0-9_]{3,20} and returns the hash of the lowercase form.
    function _normalizedKey(string calldata _username) internal pure returns (bytes32) {
        bytes memory b = bytes(_username);
        if (b.length < MIN_USERNAME || b.length > MAX_USERNAME) revert InvalidUsername();
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            bool ok = (c >= 0x30 && c <= 0x39) || // 0-9
                (c >= 0x41 && c <= 0x5A) || // A-Z
                (c >= 0x61 && c <= 0x7A) || // a-z
                c == 0x5F; // _
            if (!ok) revert InvalidUsername();
        }
        return keccak256(_lower(b));
    }

    function _lower(bytes memory b) internal pure returns (bytes memory out) {
        out = new bytes(b.length);
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            out[i] = (c >= 0x41 && c <= 0x5A) ? bytes1(uint8(c) + 32) : c;
        }
    }
}
