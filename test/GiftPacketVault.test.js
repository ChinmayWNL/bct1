const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("GiftPacketVault", function () {
  let vault;
  let creator, alice, bob, carol, dave;
  const TOTAL = ethers.parseEther("1");

  beforeEach(async function () {
    [creator, alice, bob, carol, dave] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("GiftPacketVault");
    vault = await Factory.deploy();
  });

  async function expiryIn(seconds) {
    return BigInt((await time.latest()) + seconds);
  }

  async function create(slots = 3, value = TOTAL, secs = 3600) {
    await vault.connect(creator).createPacket(slots, await expiryIn(secs), "good luck", { value });
  }

  it("creates a funded packet and emits PacketCreated", async function () {
    const exp = await expiryIn(3600);
    await expect(vault.connect(creator).createPacket(3, exp, "hi", { value: TOTAL }))
      .to.emit(vault, "PacketCreated")
      .withArgs(1, creator.address, TOTAL, 3, exp);
    const p = await vault.getPacket(1);
    expect(p.total).to.equal(TOTAL);
    expect(p.slots).to.equal(3);
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(TOTAL);
  });

  it("validates slots, amount, expiry and message", async function () {
    const exp = await expiryIn(100);
    await expect(vault.createPacket(0, exp, "x", { value: TOTAL })).to.be.revertedWithCustomError(vault, "InvalidSlots");
    await expect(vault.createPacket(51, exp, "x", { value: TOTAL })).to.be.revertedWithCustomError(vault, "InvalidSlots");
    await expect(vault.createPacket(3, exp, "x", { value: 299n })).to.be.revertedWithCustomError(vault, "AmountTooSmall");
    const past = BigInt((await time.latest()) - 1);
    await expect(vault.createPacket(3, past, "x", { value: TOTAL })).to.be.revertedWithCustomError(vault, "ExpiryInPast");
    await expect(vault.createPacket(3, exp, "m".repeat(101), { value: TOTAL })).to.be.revertedWithCustomError(vault, "MessageTooLarge");
  });

  it("pays out the previewed prizes and distributes the whole pot", async function () {
    await create(3);
    const prizes = [await vault.prizeAt(1, 0), await vault.prizeAt(1, 1)];
    await expect(vault.connect(alice).claimPacket(1)).to.changeEtherBalance(alice, prizes[0]);
    await expect(vault.connect(bob).claimPacket(1)).to.changeEtherBalance(bob, prizes[1]);
    const lastPrize = await vault.prizeAt(1, 2);
    await expect(vault.connect(carol).claimPacket(1)).to.changeEtherBalance(carol, lastPrize);

    expect(prizes[0] + prizes[1] + lastPrize).to.equal(TOTAL);
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(0);
    const p = await vault.getPacket(1);
    expect(p.claimedCount).to.equal(3);
    expect(p.claimedAmount).to.equal(TOTAL);
  });

  it("every prize is at least 1 wei even for tiny packets", async function () {
    await vault.connect(creator).createPacket(5, await expiryIn(100), "tiny", { value: 500n });
    for (let i = 0; i < 5; i++) {
      expect(await vault.prizeAt(1, i)).to.be.gte(1n);
    }
  });

  it("rejects double claims, creator claims and claims on an empty packet", async function () {
    await create(2);
    await expect(vault.connect(creator).claimPacket(1)).to.be.revertedWithCustomError(vault, "CreatorCannotClaim");
    await vault.connect(alice).claimPacket(1);
    await expect(vault.connect(alice).claimPacket(1)).to.be.revertedWithCustomError(vault, "AlreadyClaimed");
    await vault.connect(bob).claimPacket(1);
    await expect(vault.connect(carol).claimPacket(1)).to.be.revertedWithCustomError(vault, "PacketEmpty");
    expect(await vault.hasClaimed(1, alice.address)).to.equal(true);
    expect(await vault.hasClaimed(1, carol.address)).to.equal(false);
  });

  it("blocks claims after expiry and lets the creator refund the remainder", async function () {
    await create(3, TOTAL, 100);
    const first = await vault.prizeAt(1, 0);
    await vault.connect(alice).claimPacket(1);

    await expect(vault.connect(creator).refundExpired(1)).to.be.revertedWithCustomError(vault, "NotExpiredYet");
    const p = await vault.getPacket(1);
    await time.increaseTo(p.expiresAt + 1n);

    await expect(vault.connect(bob).claimPacket(1)).to.be.revertedWithCustomError(vault, "PacketExpired");
    await expect(vault.connect(bob).refundExpired(1)).to.be.revertedWithCustomError(vault, "NotCreator");
    await expect(vault.connect(creator).refundExpired(1)).to.changeEtherBalance(creator, TOTAL - first);
    await expect(vault.connect(creator).refundExpired(1)).to.be.revertedWithCustomError(vault, "NothingToRefund");
  });

  it("has nothing to refund once fully claimed", async function () {
    await create(1, TOTAL, 100);
    await vault.connect(alice).claimPacket(1);
    const p = await vault.getPacket(1);
    await time.increaseTo(p.expiresAt + 1n);
    await expect(vault.connect(creator).refundExpired(1)).to.be.revertedWithCustomError(vault, "NothingToRefund");
  });

  it("reverts on unknown packet and out-of-range slot", async function () {
    await expect(vault.getPacket(9)).to.be.revertedWithCustomError(vault, "PacketNotFound");
    await expect(vault.connect(alice).claimPacket(9)).to.be.revertedWithCustomError(vault, "PacketNotFound");
    await create(2);
    await expect(vault.prizeAt(1, 2)).to.be.revertedWithCustomError(vault, "SlotOutOfRange");
  });
});
