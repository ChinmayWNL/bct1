const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ArcadeDuelEscrow", function () {
  let escrow;
  let owner, challenger, opponent, other;

  const Move = { NONE: 0, ROCK: 1, PAPER: 2, SCISSORS: 3 };
  const Winner = { NONE: 0, DRAW: 1, CHALLENGER: 2, OPPONENT: 3 };

  function computeCommit(move, salt) {
    return ethers.solidityPackedKeccak256(
      ["uint8", "string", "string"],
      [move, ":", salt]
    );
  }

  beforeEach(async function () {
    [owner, challenger, opponent, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ArcadeDuelEscrow");
    escrow = await Factory.deploy();
  });

  describe("Duel Creation & Acceptance", function () {
    it("should allow a challenger to create a wagered duel with commit hash", async function () {
      const salt = "secret_salt_123";
      const commitHash = computeCommit(Move.ROCK, salt);
      const wager = ethers.parseEther("0.1");

      const tx = await escrow.connect(challenger).createDuel(commitHash, { value: wager });
      await expect(tx)
        .to.emit(escrow, "DuelCreated")
        .withArgs(1, challenger.address, commitHash, wager);

      const duel = await escrow.getDuel(1);
      expect(duel.challenger).to.equal(challenger.address);
      expect(duel.wager).to.equal(wager);
      expect(duel.commitHash).to.equal(commitHash);
      expect(duel.state).to.equal(1); // WAITING_OPPONENT
    });

    it("should reject opponent if wager does not match", async function () {
      const commitHash = computeCommit(Move.ROCK, "salt1");
      await escrow.connect(challenger).createDuel(commitHash, { value: ethers.parseEther("0.1") });

      await expect(
        escrow.connect(opponent).respondDuel(1, Move.SCISSORS, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWithCustomError(escrow, "InvalidWager");
    });

    it("should accept matching wager and advance to WAITING_REVEAL", async function () {
      const commitHash = computeCommit(Move.ROCK, "salt1");
      const wager = ethers.parseEther("0.05");
      await escrow.connect(challenger).createDuel(commitHash, { value: wager });

      const tx = await escrow.connect(opponent).respondDuel(1, Move.SCISSORS, { value: wager });
      await expect(tx).to.emit(escrow, "DuelAccepted");

      const duel = await escrow.getDuel(1);
      expect(duel.opponent).to.equal(opponent.address);
      expect(duel.opponentMove).to.equal(Move.SCISSORS);
      expect(duel.state).to.equal(2); // WAITING_REVEAL
    });
  });

  describe("Reveal & Settlement", function () {
    it("should award pot to challenger when Rock beats Scissors", async function () {
      const salt = "salty_dog";
      const commitHash = computeCommit(Move.ROCK, salt);
      const wager = ethers.parseEther("0.1");

      await escrow.connect(challenger).createDuel(commitHash, { value: wager });
      await escrow.connect(opponent).respondDuel(1, Move.SCISSORS, { value: wager });

      const balanceBefore = await ethers.provider.getBalance(challenger.address);
      const tx = await escrow.connect(challenger).revealAndSettle(1, Move.ROCK, salt);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(challenger.address);
      expect(balanceAfter).to.equal(balanceBefore + (wager * 2n) - gasSpent);

      const duel = await escrow.getDuel(1);
      expect(duel.winner).to.equal(Winner.CHALLENGER);
      expect(duel.state).to.equal(3); // RESOLVED
    });

    it("should award pot to opponent when Paper beats Rock", async function () {
      const salt = "salty_dog";
      const commitHash = computeCommit(Move.ROCK, salt);
      const wager = ethers.parseEther("0.1");

      await escrow.connect(challenger).createDuel(commitHash, { value: wager });
      await escrow.connect(opponent).respondDuel(1, Move.PAPER, { value: wager });

      const opponentBalanceBefore = await ethers.provider.getBalance(opponent.address);
      await escrow.connect(challenger).revealAndSettle(1, Move.ROCK, salt);
      const opponentBalanceAfter = await ethers.provider.getBalance(opponent.address);

      expect(opponentBalanceAfter).to.equal(opponentBalanceBefore + (wager * 2n));

      const duel = await escrow.getDuel(1);
      expect(duel.winner).to.equal(Winner.OPPONENT);
    });

    it("should refund both players on Draw (Rock vs Rock)", async function () {
      const salt = "salty_dog";
      const commitHash = computeCommit(Move.ROCK, salt);
      const wager = ethers.parseEther("0.1");

      await escrow.connect(challenger).createDuel(commitHash, { value: wager });
      await escrow.connect(opponent).respondDuel(1, Move.ROCK, { value: wager });

      const oppBefore = await ethers.provider.getBalance(opponent.address);
      await escrow.connect(challenger).revealAndSettle(1, Move.ROCK, salt);
      const oppAfter = await ethers.provider.getBalance(opponent.address);

      expect(oppAfter).to.equal(oppBefore + wager);
      const duel = await escrow.getDuel(1);
      expect(duel.winner).to.equal(Winner.DRAW);
    });

    it("should reject tampered moves with InvalidCommitment", async function () {
      const salt = "legit_salt";
      const commitHash = computeCommit(Move.ROCK, salt);
      const wager = ethers.parseEther("0.05");

      await escrow.connect(challenger).createDuel(commitHash, { value: wager });
      await escrow.connect(opponent).respondDuel(1, Move.SCISSORS, { value: wager });

      // Challenger tries to lie and reveal Paper instead of Rock
      await expect(
        escrow.connect(challenger).revealAndSettle(1, Move.PAPER, salt)
      ).to.be.revertedWithCustomError(escrow, "InvalidCommitment");

      // Challenger gives wrong salt
      await expect(
        escrow.connect(challenger).revealAndSettle(1, Move.ROCK, "wrong_salt")
      ).to.be.revertedWithCustomError(escrow, "InvalidCommitment");
    });
  });

  describe("Timeout Forfeiture & Cancellation", function () {
    it("should award pot to opponent if challenger fails to reveal within 15 minutes", async function () {
      const salt = "salty";
      const commitHash = computeCommit(Move.ROCK, salt);
      const wager = ethers.parseEther("0.2");

      await escrow.connect(challenger).createDuel(commitHash, { value: wager });
      await escrow.connect(opponent).respondDuel(1, Move.SCISSORS, { value: wager });

      // Before deadline, claiming timeout must revert
      await expect(escrow.connect(opponent).claimTimeout(1)).to.be.revertedWithCustomError(
        escrow,
        "RevealTimeoutNotExpired"
      );

      // Advance time by 16 minutes
      await time.increase(16 * 60);

      const oppBefore = await ethers.provider.getBalance(opponent.address);
      const tx = await escrow.connect(opponent).claimTimeout(1);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      const oppAfter = await ethers.provider.getBalance(opponent.address);
      expect(oppAfter).to.equal(oppBefore + (wager * 2n) - gasSpent);

      const duel = await escrow.getDuel(1);
      expect(duel.state).to.equal(5); // FORFEITED
      expect(duel.winner).to.equal(Winner.OPPONENT);
    });

    it("should allow challenger to cancel unaccepted duel after 1 hour", async function () {
      const commitHash = computeCommit(Move.ROCK, "salt");
      const wager = ethers.parseEther("0.1");

      await escrow.connect(challenger).createDuel(commitHash, { value: wager });

      // Cannot cancel immediately
      await expect(escrow.connect(challenger).cancelDuel(1)).to.be.revertedWithCustomError(
        escrow,
        "CancelTimeoutNotExpired"
      );

      // Advance time by 61 minutes
      await time.increase(61 * 60);

      const before = await ethers.provider.getBalance(challenger.address);
      const tx = await escrow.connect(challenger).cancelDuel(1);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(challenger.address);

      expect(after).to.equal(before + wager - gasSpent);
      const duel = await escrow.getDuel(1);
      expect(duel.state).to.equal(4); // CANCELLED
    });
  });
});
