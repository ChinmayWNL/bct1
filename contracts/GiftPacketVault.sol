// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GiftPacketVault
 * @notice ETH "red packets" for chats. A creator funds a packet split into `slots` prizes;
 *         each distinct address claims one slot until the packet is empty. Unclaimed ETH can be
 *         refunded to the creator once the packet expires.
 * @dev Prize sizes are a deterministic function of (packetId, slotIndex), so the split is fixed at
 *      creation and cannot be influenced by miners or claim timing. Anyone can preview a prize with
 *      `prizeAt`. The final slot receives any rounding dust so the whole pot is always distributed.
 */
contract GiftPacketVault is ReentrancyGuard {
    struct Packet {
        uint256 packetId;
        address creator;
        uint256 total;
        uint256 claimedAmount;
        uint32 slots;
        uint32 claimedCount;
        uint64 expiresAt;
        bool refunded;
        string message;
    }

    uint256 public nextPacketId = 1;
    uint32 public constant MAX_SLOTS = 50;
    uint256 public constant MAX_MESSAGE_BYTES = 100;
    /// @dev Guarantees every slot's prize is at least 1 wei (weights are in [1, 100]).
    uint256 public constant MIN_WEI_PER_SLOT = 100;

    mapping(uint256 => Packet) private packets;
    mapping(uint256 => mapping(address => bool)) private claimed;

    event PacketCreated(
        uint256 indexed packetId,
        address indexed creator,
        uint256 total,
        uint32 slots,
        uint64 expiresAt
    );
    event PacketClaimed(uint256 indexed packetId, address indexed claimer, uint256 prize, uint32 claimedCount);
    event PacketRefunded(uint256 indexed packetId, address indexed creator, uint256 amount);

    error InvalidSlots();
    error AmountTooSmall();
    error ExpiryInPast();
    error MessageTooLarge();
    error PacketNotFound();
    error PacketExpired();
    error PacketEmpty();
    error CreatorCannotClaim();
    error AlreadyClaimed();
    error NotCreator();
    error NotExpiredYet(uint64 expiresAt);
    error NothingToRefund();
    error TransferFailed();
    error SlotOutOfRange();

    function createPacket(
        uint32 slots,
        uint64 expiresAt,
        string calldata message
    ) external payable returns (uint256 packetId) {
        if (slots == 0 || slots > MAX_SLOTS) revert InvalidSlots();
        if (msg.value < uint256(slots) * MIN_WEI_PER_SLOT) revert AmountTooSmall();
        if (expiresAt <= block.timestamp) revert ExpiryInPast();
        if (bytes(message).length > MAX_MESSAGE_BYTES) revert MessageTooLarge();

        packetId = nextPacketId++;
        packets[packetId] = Packet({
            packetId: packetId,
            creator: msg.sender,
            total: msg.value,
            claimedAmount: 0,
            slots: slots,
            claimedCount: 0,
            expiresAt: expiresAt,
            refunded: false,
            message: message
        });

        emit PacketCreated(packetId, msg.sender, msg.value, slots, expiresAt);
    }

    /// @notice Claim the next available slot. One claim per address.
    function claimPacket(uint256 packetId) external nonReentrant returns (uint256 prize) {
        Packet storage p = packets[packetId];
        if (p.creator == address(0)) revert PacketNotFound();
        if (p.refunded || block.timestamp > p.expiresAt) revert PacketExpired();
        if (p.claimedCount >= p.slots) revert PacketEmpty();
        if (msg.sender == p.creator) revert CreatorCannotClaim();
        if (claimed[packetId][msg.sender]) revert AlreadyClaimed();

        prize = _prize(p, p.claimedCount);

        claimed[packetId][msg.sender] = true;
        p.claimedCount += 1;
        p.claimedAmount += prize;

        (bool ok, ) = payable(msg.sender).call{value: prize}("");
        if (!ok) revert TransferFailed();

        emit PacketClaimed(packetId, msg.sender, prize, p.claimedCount);
    }

    /// @notice After expiry, the creator reclaims whatever was not claimed.
    function refundExpired(uint256 packetId) external nonReentrant {
        Packet storage p = packets[packetId];
        if (p.creator == address(0)) revert PacketNotFound();
        if (msg.sender != p.creator) revert NotCreator();
        if (block.timestamp <= p.expiresAt) revert NotExpiredYet(p.expiresAt);
        if (p.refunded) revert NothingToRefund();

        uint256 remaining = p.total - p.claimedAmount;
        if (remaining == 0) revert NothingToRefund();

        p.refunded = true;
        (bool ok, ) = payable(p.creator).call{value: remaining}("");
        if (!ok) revert TransferFailed();

        emit PacketRefunded(packetId, p.creator, remaining);
    }

    function getPacket(uint256 packetId) external view returns (Packet memory) {
        Packet storage p = packets[packetId];
        if (p.creator == address(0)) revert PacketNotFound();
        return p;
    }

    function hasClaimed(uint256 packetId, address account) external view returns (bool) {
        return claimed[packetId][account];
    }

    /// @notice Prize for the `index`-th claim (0-based) of a packet.
    function prizeAt(uint256 packetId, uint32 index) external view returns (uint256) {
        Packet storage p = packets[packetId];
        if (p.creator == address(0)) revert PacketNotFound();
        if (index >= p.slots) revert SlotOutOfRange();
        return _prize(p, index);
    }

    function _weight(uint256 packetId, uint32 i) private pure returns (uint256) {
        return (uint256(keccak256(abi.encodePacked(packetId, i))) % 100) + 1;
    }

    function _prize(Packet storage p, uint32 index) private view returns (uint256) {
        // The last slot sweeps rounding dust so the full pot is paid out.
        if (index == p.slots - 1) return p.total - p.claimedAmount;

        uint256 sum;
        for (uint32 i = 0; i < p.slots; i++) {
            sum += _weight(p.packetId, i);
        }
        return (p.total * _weight(p.packetId, index)) / sum;
    }
}
