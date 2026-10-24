// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArcadeDuelEscrow
 * @notice Trustless 1v1 Cypher RPS (Rock-Paper-Scissors) duel escrow with commit-reveal and timeout forfeiture.
 * @dev Protects against front-running via cryptographic commitment (keccak256(move:salt)) and prevents
 *      challenger abandonment through timeout forfeiture.
 */
contract ArcadeDuelEscrow is ReentrancyGuard {
    enum Move { NONE, ROCK, PAPER, SCISSORS }
    enum DuelState { NONE, WAITING_OPPONENT, WAITING_REVEAL, RESOLVED, CANCELLED, FORFEITED }
    enum Winner { NONE, DRAW, CHALLENGER, OPPONENT }

    struct Duel {
        uint256 duelId;
        address challenger;
        address opponent;
        bytes32 commitHash;
        uint256 wager;
        Move opponentMove;
        Move challengerMove;
        DuelState state;
        Winner winner;
        uint256 createdAt;
        uint256 revealDeadline;
    }

    uint256 public nextDuelId = 1;
    uint256 public constant REVEAL_TIMEOUT = 15 minutes;
    uint256 public constant CANCEL_TIMEOUT = 1 hours;

    mapping(uint256 => Duel) public duels;

    event DuelCreated(uint256 indexed duelId, address indexed challenger, bytes32 commitHash, uint256 wager);
    event DuelAccepted(uint256 indexed duelId, address indexed opponent, Move opponentMove, uint256 revealDeadline);
    event DuelResolved(
        uint256 indexed duelId,
        Winner winner,
        Move challengerMove,
        Move opponentMove,
        uint256 payout
    );
    event DuelCancelled(uint256 indexed duelId, address indexed challenger, uint256 refundAmount);
    event DuelForfeited(uint256 indexed duelId, address indexed winner, uint256 payout);

    error InvalidMove();
    error InvalidCommitment();
    error InvalidWager();
    error DuelNotOpen();
    error Unauthorized();
    error RevealTimeoutNotExpired();
    error CancelTimeoutNotExpired();
    error RevealDeadlinePassed();
    error TransferFailed();

    /**
     * @notice Initiates a duel by locking a wager and submitting a cryptographic commit hash.
     * @param commitHash The keccak256 hash of abi.encodePacked(uint8 move, ":", string salt)
     * @return duelId The unique ID of the created duel
     */
    function createDuel(bytes32 commitHash) external payable returns (uint256 duelId) {
        if (commitHash == bytes32(0)) revert InvalidCommitment();

        duelId = nextDuelId++;
        Duel storage d = duels[duelId];
        d.duelId = duelId;
        d.challenger = msg.sender;
        d.commitHash = commitHash;
        d.wager = msg.value;
        d.state = DuelState.WAITING_OPPONENT;
        d.createdAt = block.timestamp;

        emit DuelCreated(duelId, msg.sender, commitHash, msg.value);
    }

    /**
     * @notice Accepts a duel challenge by matching the wager and choosing a move.
     * @param duelId The ID of the duel to accept
     * @param opponentMove The chosen move (1 = ROCK, 2 = PAPER, 3 = SCISSORS)
     */
    function respondDuel(uint256 duelId, Move opponentMove) external payable nonReentrant {
        Duel storage d = duels[duelId];
        if (d.state != DuelState.WAITING_OPPONENT) revert DuelNotOpen();
        if (msg.sender == d.challenger) revert Unauthorized();
        if (msg.value != d.wager) revert InvalidWager();
        if (opponentMove < Move.ROCK || opponentMove > Move.SCISSORS) revert InvalidMove();

        d.opponent = msg.sender;
        d.opponentMove = opponentMove;
        d.state = DuelState.WAITING_REVEAL;
        d.revealDeadline = block.timestamp + REVEAL_TIMEOUT;

        emit DuelAccepted(duelId, msg.sender, opponentMove, d.revealDeadline);
    }

    /**
     * @notice Challenger reveals their secret move and salt to resolve the duel and claim payout.
     * @param duelId The ID of the duel to reveal
     * @param challengerMove The move originally chosen (1 = ROCK, 2 = PAPER, 3 = SCISSORS)
     * @param salt The secret salt used during commitment
     */
    function revealAndSettle(
        uint256 duelId,
        Move challengerMove,
        string calldata salt
    ) external nonReentrant {
        Duel storage d = duels[duelId];
        if (d.state != DuelState.WAITING_REVEAL) revert DuelNotOpen();
        if (msg.sender != d.challenger) revert Unauthorized();
        if (block.timestamp > d.revealDeadline) revert RevealDeadlinePassed();
        if (challengerMove < Move.ROCK || challengerMove > Move.SCISSORS) revert InvalidMove();

        // Verify cryptographic commitment matches: keccak256(uint8 move + ":" + salt)
        bytes32 computedHash = keccak256(abi.encodePacked(uint8(challengerMove), ":", salt));
        if (computedHash != d.commitHash) revert InvalidCommitment();

        d.challengerMove = challengerMove;
        d.state = DuelState.RESOLVED;

        Winner winner = _evaluateWinner(challengerMove, d.opponentMove);
        d.winner = winner;

        uint256 totalPot = d.wager * 2;

        if (winner == Winner.DRAW) {
            emit DuelResolved(duelId, Winner.DRAW, challengerMove, d.opponentMove, d.wager);
            if (d.wager > 0) {
                (bool s1, ) = d.challenger.call{value: d.wager}("");
                (bool s2, ) = d.opponent.call{value: d.wager}("");
                if (!s1 || !s2) revert TransferFailed();
            }
        } else if (winner == Winner.CHALLENGER) {
            emit DuelResolved(duelId, Winner.CHALLENGER, challengerMove, d.opponentMove, totalPot);
            if (totalPot > 0) {
                (bool s, ) = d.challenger.call{value: totalPot}("");
                if (!s) revert TransferFailed();
            }
        } else {
            emit DuelResolved(duelId, Winner.OPPONENT, challengerMove, d.opponentMove, totalPot);
            if (totalPot > 0) {
                (bool s, ) = d.opponent.call{value: totalPot}("");
                if (!s) revert TransferFailed();
            }
        }
    }

    /**
     * @notice Claims forfeiture if challenger fails to reveal their move before the deadline.
     * @param duelId The ID of the duel that timed out
     */
    function claimTimeout(uint256 duelId) external nonReentrant {
        Duel storage d = duels[duelId];
        if (d.state != DuelState.WAITING_REVEAL) revert DuelNotOpen();
        if (block.timestamp <= d.revealDeadline) revert RevealTimeoutNotExpired();

        d.state = DuelState.FORFEITED;
        d.winner = Winner.OPPONENT;

        uint256 totalPot = d.wager * 2;
        emit DuelForfeited(duelId, d.opponent, totalPot);

        if (totalPot > 0) {
            (bool s, ) = d.opponent.call{value: totalPot}("");
            if (!s) revert TransferFailed();
        }
    }

    /**
     * @notice Challenger can cancel an unaccepted duel after the cancel timeout to retrieve their wager.
     * @param duelId The ID of the unaccepted duel to cancel
     */
    function cancelDuel(uint256 duelId) external nonReentrant {
        Duel storage d = duels[duelId];
        if (d.state != DuelState.WAITING_OPPONENT) revert DuelNotOpen();
        if (msg.sender != d.challenger) revert Unauthorized();
        if (block.timestamp < d.createdAt + CANCEL_TIMEOUT) revert CancelTimeoutNotExpired();

        d.state = DuelState.CANCELLED;
        uint256 refund = d.wager;

        emit DuelCancelled(duelId, msg.sender, refund);

        if (refund > 0) {
            (bool s, ) = msg.sender.call{value: refund}("");
            if (!s) revert TransferFailed();
        }
    }

    /**
     * @dev Internal pure logic to determine RPS winner.
     */
    function _evaluateWinner(Move c, Move o) internal pure returns (Winner) {
        if (c == o) return Winner.DRAW;
        if (
            (c == Move.ROCK && o == Move.SCISSORS) ||
            (c == Move.PAPER && o == Move.ROCK) ||
            (c == Move.SCISSORS && o == Move.PAPER)
        ) {
            return Winner.CHALLENGER;
        }
        return Winner.OPPONENT;
    }

    /**
     * @notice Helper view function to check duel details.
     */
    function getDuel(uint256 duelId) external view returns (Duel memory) {
        return duels[duelId];
    }
}
