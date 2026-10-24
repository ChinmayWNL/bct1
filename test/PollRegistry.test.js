const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("PollRegistry", function () {
  let reg;
  let creator, alice, bob, carol;

  beforeEach(async function () {
    [creator, alice, bob, carol] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PollRegistry");
    reg = await Factory.deploy();
  });

  async function closesIn(seconds) {
    return BigInt((await time.latest()) + seconds);
  }

  async function create(options = ["Rock", "Paper", "Scissors"], secs = 3600) {
    await reg.connect(creator).createPoll("Best move?", options, await closesIn(secs));
  }

  it("creates a poll and emits PollCreated", async function () {
    const closes = await closesIn(3600);
    await expect(reg.connect(creator).createPoll("Best move?", ["A", "B"], closes))
      .to.emit(reg, "PollCreated")
      .withArgs(1, creator.address, 2, closes);
    const p = await reg.getPoll(1);
    expect(p.question).to.equal("Best move?");
    expect(p.options).to.deep.equal(["A", "B"]);
    expect(p.counts.map(Number)).to.deep.equal([0, 0]);
    expect(p.closed).to.equal(false);
  });

  it("validates option count, text sizes and deadline", async function () {
    const closes = await closesIn(100);
    await expect(reg.createPoll("q", ["only"], closes)).to.be.revertedWithCustomError(reg, "InvalidOptionCount");
    await expect(reg.createPoll("q", ["1", "2", "3", "4", "5", "6", "7"], closes)).to.be.revertedWithCustomError(reg, "InvalidOptionCount");
    await expect(reg.createPoll("", ["a", "b"], closes)).to.be.revertedWithCustomError(reg, "EmptyText");
    await expect(reg.createPoll("q", ["a", ""], closes)).to.be.revertedWithCustomError(reg, "EmptyText");
    await expect(reg.createPoll("q".repeat(141), ["a", "b"], closes)).to.be.revertedWithCustomError(reg, "QuestionTooLarge");
    await expect(reg.createPoll("q", ["a", "o".repeat(61)], closes)).to.be.revertedWithCustomError(reg, "OptionTooLarge");
    const past = BigInt((await time.latest()) - 1);
    await expect(reg.createPoll("q", ["a", "b"], past)).to.be.revertedWithCustomError(reg, "ClosesInPast");
  });

  it("tallies votes from distinct addresses", async function () {
    await create();
    await expect(reg.connect(alice).vote(1, 0)).to.emit(reg, "Voted").withArgs(1, alice.address, 0, false);
    await reg.connect(bob).vote(1, 2);
    await reg.connect(carol).vote(1, 0);
    const p = await reg.getPoll(1);
    expect(p.counts.map(Number)).to.deep.equal([2, 0, 1]);
    expect(p.totalVotes).to.equal(3);
    const [voted, option] = await reg.voteOf(1, bob.address);
    expect(voted).to.equal(true);
    expect(option).to.equal(2);
  });

  it("lets a voter change their vote without inflating the total", async function () {
    await create();
    await reg.connect(alice).vote(1, 0);
    await expect(reg.connect(alice).vote(1, 1)).to.emit(reg, "Voted").withArgs(1, alice.address, 1, true);
    const p = await reg.getPoll(1);
    expect(p.counts.map(Number)).to.deep.equal([0, 1, 0]);
    expect(p.totalVotes).to.equal(1);
    await expect(reg.connect(alice).vote(1, 1)).to.be.revertedWithCustomError(reg, "SameVote");
  });

  it("rejects invalid options and unknown polls; unvoted address reads as not voted", async function () {
    await create();
    await expect(reg.connect(alice).vote(1, 3)).to.be.revertedWithCustomError(reg, "InvalidOption");
    await expect(reg.connect(alice).vote(9, 0)).to.be.revertedWithCustomError(reg, "PollNotFound");
    await expect(reg.getPoll(9)).to.be.revertedWithCustomError(reg, "PollNotFound");
    const [voted] = await reg.voteOf(1, alice.address);
    expect(voted).to.equal(false);
  });

  it("blocks voting after the deadline", async function () {
    await create(["A", "B"], 100);
    await reg.connect(alice).vote(1, 0);
    const p = await reg.getPoll(1);
    await time.increaseTo(p.closesAt + 1n);
    await expect(reg.connect(bob).vote(1, 1)).to.be.revertedWithCustomError(reg, "PollIsClosed");
    expect((await reg.getPoll(1)).closed).to.equal(true);
    // results stay readable
    expect((await reg.getPoll(1)).totalVotes).to.equal(1);
  });

  it("lets only the creator close early, and blocks votes afterwards", async function () {
    await create();
    await expect(reg.connect(alice).closePoll(1)).to.be.revertedWithCustomError(reg, "NotCreator");
    await expect(reg.connect(creator).closePoll(1)).to.emit(reg, "PollClosed").withArgs(1, creator.address);
    await expect(reg.connect(alice).vote(1, 0)).to.be.revertedWithCustomError(reg, "PollIsClosed");
    await expect(reg.connect(creator).closePoll(1)).to.be.revertedWithCustomError(reg, "PollIsClosed");
  });
});
