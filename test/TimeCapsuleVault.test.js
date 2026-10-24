const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("TimeCapsuleVault", function () {
  let vault;
  let sender, recipient, other;

  beforeEach(async function () {
    [sender, recipient, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TimeCapsuleVault");
    vault = await Factory.deploy();
  });

  async function unlockIn(seconds) {
    return BigInt((await time.latest()) + seconds);
  }

  it("creates a capsule holding ETH and emits CapsuleCreated", async function () {
    const unlock = await unlockIn(3600);
    await expect(
      vault.connect(sender).createCapsule(recipient.address, unlock, "Gift", "hello", {
        value: ethers.parseEther("1"),
      })
    ).to.emit(vault, "CapsuleCreated");
    const info = await vault.getCapsule(1);
    expect(info.sender).to.equal(sender.address);
    expect(info.recipient).to.equal(recipient.address);
    expect(info.value).to.equal(ethers.parseEther("1"));
    expect(info.opened).to.equal(false);
    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(ethers.parseEther("1"));
  });

  it("rejects past unlock times and zero recipient", async function () {
    const past = BigInt((await time.latest()) - 10);
    await expect(
      vault.createCapsule(recipient.address, past, "t", "p")
    ).to.be.revertedWithCustomError(vault, "UnlockTimeInPast");
    const future = await unlockIn(100);
    await expect(
      vault.createCapsule(ethers.ZeroAddress, future, "t", "p")
    ).to.be.revertedWithCustomError(vault, "InvalidRecipient");
  });

  it("blocks opening before the unlock time", async function () {
    const unlock = await unlockIn(3600);
    await vault.createCapsule(recipient.address, unlock, "t", "secret");
    await expect(vault.connect(recipient).open(1)).to.be.revertedWithCustomError(vault, "StillLocked");
    await expect(vault.connect(recipient).getPayload(1)).to.be.revertedWithCustomError(vault, "StillLocked");
  });

  it("releases ETH and payload to the recipient after unlock", async function () {
    const unlock = await unlockIn(3600);
    await vault.createCapsule(recipient.address, unlock, "t", "secret", { value: ethers.parseEther("2") });
    await time.increaseTo(unlock);

    expect(await vault.connect(recipient).getPayload(1)).to.equal("secret");
    await expect(vault.connect(recipient).open(1)).to.changeEtherBalance(recipient, ethers.parseEther("2"));
    const info = await vault.getCapsule(1);
    expect(info.opened).to.equal(true);
  });

  it("only the recipient can open, and only once", async function () {
    const unlock = await unlockIn(100);
    await vault.createCapsule(recipient.address, unlock, "t", "p", { value: 1n });
    await time.increaseTo(unlock);
    await expect(vault.connect(other).open(1)).to.be.revertedWithCustomError(vault, "NotRecipient");
    await expect(vault.connect(other).getPayload(1)).to.be.revertedWithCustomError(vault, "NotParticipant");
    await vault.connect(recipient).open(1);
    await expect(vault.connect(recipient).open(1)).to.be.revertedWithCustomError(vault, "AlreadyOpened");
  });

  it("reverts on unknown capsule", async function () {
    await expect(vault.getCapsule(99)).to.be.revertedWithCustomError(vault, "CapsuleNotFound");
  });
});
