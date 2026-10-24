const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserRegistry", function () {
  let reg, a, b;
  beforeEach(async () => {
    [a, b] = await ethers.getSigners();
    reg = await (await ethers.getContractFactory("UserRegistry")).deploy();
  });

  it("registers a user and emits UserRegistered", async () => {
    await expect(reg.connect(a).registerUser("Goatfr", "cid1"))
      .to.emit(reg, "UserRegistered").withArgs(a.address, "Goatfr", "cid1");
    const p = await reg.getProfile(a.address);
    expect(p.username).to.equal("Goatfr");
    expect(p.isRegistered).to.equal(true);
  });

  it("accepts a long non-CID avatar string (URL)", async () => {
    await reg.connect(a).registerUser("goat", "https://www.dreamstime.com/photos-images/goat.html");
  });

  it("validates username format", async () => {
    await expect(reg.registerUser("ab", "")).to.be.revertedWithCustomError(reg, "InvalidUsername");
    await expect(reg.registerUser("a".repeat(21), "")).to.be.revertedWithCustomError(reg, "InvalidUsername");
    await expect(reg.registerUser("bad name", "")).to.be.revertedWithCustomError(reg, "InvalidUsername");
  });

  it("rejects duplicate usernames case-insensitively and double registration", async () => {
    await reg.connect(a).registerUser("Alice_1", "");
    await expect(reg.connect(b).registerUser("alice_1", "")).to.be.revertedWithCustomError(reg, "UsernameTaken");
    await expect(reg.connect(a).registerUser("other", "")).to.be.revertedWithCustomError(reg, "AlreadyRegistered");
  });

  it("resolves usernames and updates the avatar", async () => {
    await reg.connect(a).registerUser("Alice", "x");
    expect(await reg.usernameToAddress("ALICE")).to.equal(a.address);
    expect(await reg.usernameToAddress("nobody")).to.equal(ethers.ZeroAddress);
    await expect(reg.connect(b).updateProfilePicture("y")).to.be.revertedWithCustomError(reg, "NotRegistered");
    await expect(reg.connect(a).updateProfilePicture("y")).to.emit(reg, "ProfileUpdated");
    expect((await reg.getProfile(a.address)).profilePictureCID).to.equal("y");
  });
});
