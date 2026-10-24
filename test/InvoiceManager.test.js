const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InvoiceManager", function () {
  let mgr;
  let creator, alice, bob, carol;
  const AMOUNT = ethers.parseEther("1");

  beforeEach(async function () {
    [creator, alice, bob, carol] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("InvoiceManager");
    mgr = await Factory.deploy();
  });

  it("creates a single invoice and emits InvoiceCreated", async function () {
    await expect(mgr.connect(creator).createInvoice(alice.address, AMOUNT, 1, "coffee"))
      .to.emit(mgr, "InvoiceCreated")
      .withArgs(1, creator.address, alice.address, AMOUNT, 1);
    const inv = await mgr.getInvoice(1);
    expect(inv.creator).to.equal(creator.address);
    expect(inv.amount).to.equal(AMOUNT);
    expect(inv.paidCount).to.equal(0);
    expect(inv.cancelled).to.equal(false);
  });

  it("validates amount, maxPayers, payer lock and note size", async function () {
    await expect(mgr.createInvoice(alice.address, 0, 1, "x")).to.be.revertedWithCustomError(mgr, "InvalidAmount");
    await expect(mgr.createInvoice(alice.address, AMOUNT, 0, "x")).to.be.revertedWithCustomError(mgr, "InvalidMaxPayers");
    await expect(mgr.createInvoice(alice.address, AMOUNT, 101, "x")).to.be.revertedWithCustomError(mgr, "InvalidMaxPayers");
    // a payer-locked invoice can only have one payer
    await expect(mgr.createInvoice(alice.address, AMOUNT, 3, "x")).to.be.revertedWithCustomError(mgr, "InvalidMaxPayers");
    await expect(mgr.createInvoice(ethers.ZeroAddress, AMOUNT, 1, "n".repeat(201))).to.be.revertedWithCustomError(mgr, "NoteTooLarge");
  });

  it("forwards the payment to the creator and marks the payer as paid", async function () {
    await mgr.connect(creator).createInvoice(alice.address, AMOUNT, 1, "coffee");
    await expect(mgr.connect(alice).payInvoice(1, { value: AMOUNT })).to.changeEtherBalances(
      [alice, creator],
      [-AMOUNT, AMOUNT]
    );
    expect(await mgr.hasPaid(1, alice.address)).to.equal(true);
    expect((await mgr.getInvoice(1)).paidCount).to.equal(1);
    expect(await ethers.provider.getBalance(await mgr.getAddress())).to.equal(0);
  });

  it("rejects wrong amount, wrong payer, creator and double payment", async function () {
    await mgr.connect(creator).createInvoice(alice.address, AMOUNT, 1, "locked");
    await expect(mgr.connect(alice).payInvoice(1, { value: AMOUNT - 1n })).to.be.revertedWithCustomError(mgr, "WrongAmount");
    await expect(mgr.connect(bob).payInvoice(1, { value: AMOUNT })).to.be.revertedWithCustomError(mgr, "NotAllowedPayer");
    await expect(mgr.connect(creator).payInvoice(1, { value: AMOUNT })).to.be.revertedWithCustomError(mgr, "CreatorCannotPay");
    await mgr.connect(alice).payInvoice(1, { value: AMOUNT });
    await expect(mgr.connect(alice).payInvoice(1, { value: AMOUNT })).to.be.revertedWithCustomError(mgr, "FullyPaid");
  });

  it("supports split bills: each address pays once until fully paid", async function () {
    await mgr.connect(creator).createInvoice(ethers.ZeroAddress, AMOUNT, 2, "dinner split");
    await mgr.connect(alice).payInvoice(1, { value: AMOUNT });
    await expect(mgr.connect(alice).payInvoice(1, { value: AMOUNT })).to.be.revertedWithCustomError(mgr, "AlreadyPaid");
    await expect(mgr.connect(bob).payInvoice(1, { value: AMOUNT }))
      .to.emit(mgr, "InvoicePaid")
      .withArgs(1, bob.address, AMOUNT, 2);
    await expect(mgr.connect(carol).payInvoice(1, { value: AMOUNT })).to.be.revertedWithCustomError(mgr, "FullyPaid");
    expect((await mgr.getInvoice(1)).paidCount).to.equal(2);
  });

  it("lets only the creator cancel, and blocks payment afterwards", async function () {
    await mgr.connect(creator).createInvoice(ethers.ZeroAddress, AMOUNT, 3, "oops");
    await expect(mgr.connect(alice).cancelInvoice(1)).to.be.revertedWithCustomError(mgr, "NotCreator");
    await expect(mgr.connect(creator).cancelInvoice(1)).to.emit(mgr, "InvoiceCancelled").withArgs(1, creator.address);
    await expect(mgr.connect(alice).payInvoice(1, { value: AMOUNT })).to.be.revertedWithCustomError(mgr, "InvoiceIsCancelled");
    await expect(mgr.connect(creator).cancelInvoice(1)).to.be.revertedWithCustomError(mgr, "InvoiceIsCancelled");
  });

  it("cannot cancel a fully paid invoice", async function () {
    await mgr.connect(creator).createInvoice(alice.address, AMOUNT, 1, "done");
    await mgr.connect(alice).payInvoice(1, { value: AMOUNT });
    await expect(mgr.connect(creator).cancelInvoice(1)).to.be.revertedWithCustomError(mgr, "FullyPaid");
  });

  it("reverts on unknown invoice", async function () {
    await expect(mgr.getInvoice(42)).to.be.revertedWithCustomError(mgr, "InvoiceNotFound");
    await expect(mgr.connect(alice).payInvoice(42, { value: 1n })).to.be.revertedWithCustomError(mgr, "InvoiceNotFound");
  });
});
