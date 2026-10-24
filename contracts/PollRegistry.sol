// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PollRegistry
 * @notice On-chain polls for BlockChat. One vote per address; voters may change their vote
 *         until the poll closes (by deadline or when the creator closes it early).
 *         Tallies are maintained on-chain so every participant sees the same authoritative result.
 */
contract PollRegistry {
    struct Poll {
        uint256 pollId;
        address creator;
        string question;
        string[] options;
        uint32[] counts;
        uint32 totalVotes;
        uint64 closesAt;
        bool closed;
        uint64 createdAt;
    }

    /// @dev Return shape for `getPoll` (mappings cannot be returned from storage structs).
    struct PollInfo {
        uint256 pollId;
        address creator;
        string question;
        string[] options;
        uint32[] counts;
        uint32 totalVotes;
        uint64 closesAt;
        bool closed;
        uint64 createdAt;
    }

    uint256 public nextPollId = 1;
    uint256 public constant MIN_OPTIONS = 2;
    uint256 public constant MAX_OPTIONS = 6;
    uint256 public constant MAX_QUESTION_BYTES = 140;
    uint256 public constant MAX_OPTION_BYTES = 60;

    mapping(uint256 => Poll) private polls;
    /// @dev Stores (optionIndex + 1); 0 means "has not voted".
    mapping(uint256 => mapping(address => uint8)) private votes;

    event PollCreated(uint256 indexed pollId, address indexed creator, uint8 optionCount, uint64 closesAt);
    event Voted(uint256 indexed pollId, address indexed voter, uint8 option, bool changed);
    event PollClosed(uint256 indexed pollId, address indexed creator);

    error InvalidOptionCount();
    error QuestionTooLarge();
    error OptionTooLarge();
    error EmptyText();
    error ClosesInPast();
    error PollNotFound();
    error PollIsClosed();
    error InvalidOption();
    error SameVote();
    error NotCreator();

    function createPoll(
        string calldata question,
        string[] calldata options,
        uint64 closesAt
    ) external returns (uint256 pollId) {
        if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) revert InvalidOptionCount();
        if (bytes(question).length == 0) revert EmptyText();
        if (bytes(question).length > MAX_QUESTION_BYTES) revert QuestionTooLarge();
        if (closesAt <= block.timestamp) revert ClosesInPast();

        pollId = nextPollId++;
        Poll storage p = polls[pollId];
        p.pollId = pollId;
        p.creator = msg.sender;
        p.question = question;
        p.closesAt = closesAt;
        p.createdAt = uint64(block.timestamp);

        for (uint256 i = 0; i < options.length; i++) {
            if (bytes(options[i]).length == 0) revert EmptyText();
            if (bytes(options[i]).length > MAX_OPTION_BYTES) revert OptionTooLarge();
            p.options.push(options[i]);
            p.counts.push(0);
        }

        emit PollCreated(pollId, msg.sender, uint8(options.length), closesAt);
    }

    /// @notice Cast or change your vote while the poll is open.
    function vote(uint256 pollId, uint8 option) external {
        Poll storage p = polls[pollId];
        if (p.creator == address(0)) revert PollNotFound();
        if (p.closed || block.timestamp > p.closesAt) revert PollIsClosed();
        if (option >= p.options.length) revert InvalidOption();

        uint8 previous = votes[pollId][msg.sender];
        if (previous == option + 1) revert SameVote();

        bool changed = previous != 0;
        if (changed) {
            p.counts[previous - 1] -= 1;
        } else {
            p.totalVotes += 1;
        }
        p.counts[option] += 1;
        votes[pollId][msg.sender] = option + 1;

        emit Voted(pollId, msg.sender, option, changed);
    }

    /// @notice Creator ends voting early.
    function closePoll(uint256 pollId) external {
        Poll storage p = polls[pollId];
        if (p.creator == address(0)) revert PollNotFound();
        if (msg.sender != p.creator) revert NotCreator();
        if (p.closed || block.timestamp > p.closesAt) revert PollIsClosed();

        p.closed = true;
        emit PollClosed(pollId, msg.sender);
    }

    function getPoll(uint256 pollId) external view returns (PollInfo memory) {
        Poll storage p = polls[pollId];
        if (p.creator == address(0)) revert PollNotFound();
        return PollInfo({
            pollId: p.pollId,
            creator: p.creator,
            question: p.question,
            options: p.options,
            counts: p.counts,
            totalVotes: p.totalVotes,
            closesAt: p.closesAt,
            closed: p.closed || block.timestamp > p.closesAt,
            createdAt: p.createdAt
        });
    }

    /// @return voted whether `account` has voted, and `option` the index they chose.
    function voteOf(uint256 pollId, address account) external view returns (bool voted, uint8 option) {
        uint8 v = votes[pollId][account];
        if (v == 0) return (false, 0);
        return (true, v - 1);
    }
}
