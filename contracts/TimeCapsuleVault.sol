// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TimeCapsuleVault
 * @notice On-chain timelocked message + ETH capsules. The contract enforces the unlock time,
 *         so nobody (including the UI) can open a capsule early.
 * @dev Payload access through the contract is gated by time and by participant identity.
 *      Note: EVM storage is public at the node level; for strong secrecy, store ciphertext
 *      (or an IPFS CID) as the payload.
 */
contract TimeCapsuleVault is ReentrancyGuard {
    struct Capsule {
        uint256 capsuleId;
        address sender;
        address recipient;
        uint64 unlockTime;
        uint64 createdAt;
        uint256 value;
        bool opened;
        string title;
        string payload;
    }

    /// @dev Metadata returned to callers (payload excluded until unlocked).
    struct CapsuleInfo {
        uint256 capsuleId;
        address sender;
        address recipient;
        uint64 unlockTime;
        uint64 createdAt;
        uint256 value;
        bool opened;
        string title;
    }

    uint256 public nextCapsuleId = 1;
    uint256 public constant MAX_PAYLOAD_BYTES = 2048;
    uint256 public constant MAX_TITLE_BYTES = 80;

    mapping(uint256 => Capsule) private capsules;

    event CapsuleCreated(
        uint256 indexed capsuleId,
        address indexed sender,
        address indexed recipient,
        uint64 unlockTime,
        uint256 value
    );
    event CapsuleOpened(uint256 indexed capsuleId, address indexed recipient, string payload, uint256 value);

    error InvalidRecipient();
    error UnlockTimeInPast();
    error PayloadTooLarge();
    error TitleTooLarge();
    error CapsuleNotFound();
    error StillLocked(uint256 unlockTime);
    error NotParticipant();
    error NotRecipient();
    error AlreadyOpened();
    error TransferFailed();

    function createCapsule(
        address recipient,
        uint64 unlockTime,
        string calldata title,
        string calldata payload
    ) external payable returns (uint256 capsuleId) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (unlockTime <= block.timestamp) revert UnlockTimeInPast();
        if (bytes(payload).length > MAX_PAYLOAD_BYTES) revert PayloadTooLarge();
        if (bytes(title).length > MAX_TITLE_BYTES) revert TitleTooLarge();

        capsuleId = nextCapsuleId++;
        capsules[capsuleId] = Capsule({
            capsuleId: capsuleId,
            sender: msg.sender,
            recipient: recipient,
            unlockTime: unlockTime,
            createdAt: uint64(block.timestamp),
            value: msg.value,
            opened: false,
            title: title,
            payload: payload
        });

        emit CapsuleCreated(capsuleId, msg.sender, recipient, unlockTime, msg.value);
    }

    /// @notice Opens the capsule after unlock, releasing any ETH to the recipient.
    function open(uint256 capsuleId) external nonReentrant returns (string memory payload) {
        Capsule storage c = capsules[capsuleId];
        if (c.sender == address(0)) revert CapsuleNotFound();
        if (msg.sender != c.recipient) revert NotRecipient();
        if (c.opened) revert AlreadyOpened();
        if (block.timestamp < c.unlockTime) revert StillLocked(c.unlockTime);

        c.opened = true;
        uint256 amount = c.value;
        payload = c.payload;

        if (amount > 0) {
            (bool ok, ) = payable(c.recipient).call{value: amount}("");
            if (!ok) revert TransferFailed();
        }

        emit CapsuleOpened(capsuleId, c.recipient, payload, amount);
    }

    /// @notice Read the payload; only participants, and only after unlock.
    function getPayload(uint256 capsuleId) external view returns (string memory) {
        Capsule storage c = capsules[capsuleId];
        if (c.sender == address(0)) revert CapsuleNotFound();
        if (msg.sender != c.recipient && msg.sender != c.sender) revert NotParticipant();
        if (block.timestamp < c.unlockTime) revert StillLocked(c.unlockTime);
        return c.payload;
    }

    function getCapsule(uint256 capsuleId) external view returns (CapsuleInfo memory) {
        Capsule storage c = capsules[capsuleId];
        if (c.sender == address(0)) revert CapsuleNotFound();
        return CapsuleInfo({
            capsuleId: c.capsuleId,
            sender: c.sender,
            recipient: c.recipient,
            unlockTime: c.unlockTime,
            createdAt: c.createdAt,
            value: c.value,
            opened: c.opened,
            title: c.title
        });
    }
}
