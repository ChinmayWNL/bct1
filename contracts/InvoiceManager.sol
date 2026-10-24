// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InvoiceManager
 * @notice On-chain payment requests and split bills for BlockChat.
 *         A creator opens an invoice for a fixed per-payer `amount`.
 *         - Single invoice: `maxPayers = 1`, optionally locked to one `payer` address.
 *         - Split bill:     `maxPayers = N`, `payer = address(0)`; each distinct address pays once.
 *         Payments are forwarded to the creator immediately; the contract never holds funds.
 */
contract InvoiceManager is ReentrancyGuard {
    struct Invoice {
        uint256 invoiceId;
        address creator;
        address payer; // address(0) = any address may pay
        uint256 amount; // wei owed by each payer
        uint32 maxPayers;
        uint32 paidCount;
        bool cancelled;
        uint64 createdAt;
        string note;
    }

    uint256 public nextInvoiceId = 1;
    uint32 public constant MAX_PAYERS_LIMIT = 100;
    uint256 public constant MAX_NOTE_BYTES = 200;

    mapping(uint256 => Invoice) private invoices;
    mapping(uint256 => mapping(address => bool)) private paid;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed creator,
        address indexed payer,
        uint256 amount,
        uint32 maxPayers
    );
    event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount, uint32 paidCount);
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed creator);

    error InvalidAmount();
    error InvalidMaxPayers();
    error NoteTooLarge();
    error InvoiceNotFound();
    error InvoiceIsCancelled();
    error NotCreator();
    error NotAllowedPayer();
    error CreatorCannotPay();
    error AlreadyPaid();
    error FullyPaid();
    error WrongAmount(uint256 expected);
    error TransferFailed();

    function createInvoice(
        address payer,
        uint256 amount,
        uint32 maxPayers,
        string calldata note
    ) external returns (uint256 invoiceId) {
        if (amount == 0) revert InvalidAmount();
        if (maxPayers == 0 || maxPayers > MAX_PAYERS_LIMIT) revert InvalidMaxPayers();
        if (payer != address(0) && maxPayers != 1) revert InvalidMaxPayers();
        if (bytes(note).length > MAX_NOTE_BYTES) revert NoteTooLarge();

        invoiceId = nextInvoiceId++;
        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            creator: msg.sender,
            payer: payer,
            amount: amount,
            maxPayers: maxPayers,
            paidCount: 0,
            cancelled: false,
            createdAt: uint64(block.timestamp),
            note: note
        });

        emit InvoiceCreated(invoiceId, msg.sender, payer, amount, maxPayers);
    }

    /// @notice Pay your share. `msg.value` must equal the invoice amount exactly.
    function payInvoice(uint256 invoiceId) external payable nonReentrant {
        Invoice storage inv = invoices[invoiceId];
        if (inv.creator == address(0)) revert InvoiceNotFound();
        if (inv.cancelled) revert InvoiceIsCancelled();
        if (inv.paidCount >= inv.maxPayers) revert FullyPaid();
        if (msg.sender == inv.creator) revert CreatorCannotPay();
        if (inv.payer != address(0) && inv.payer != msg.sender) revert NotAllowedPayer();
        if (paid[invoiceId][msg.sender]) revert AlreadyPaid();
        if (msg.value != inv.amount) revert WrongAmount(inv.amount);

        paid[invoiceId][msg.sender] = true;
        inv.paidCount += 1;

        (bool ok, ) = payable(inv.creator).call{value: msg.value}("");
        if (!ok) revert TransferFailed();

        emit InvoicePaid(invoiceId, msg.sender, msg.value, inv.paidCount);
    }

    /// @notice Creator stops accepting further payments (already-paid shares are unaffected).
    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        if (inv.creator == address(0)) revert InvoiceNotFound();
        if (msg.sender != inv.creator) revert NotCreator();
        if (inv.cancelled) revert InvoiceIsCancelled();
        if (inv.paidCount >= inv.maxPayers) revert FullyPaid();

        inv.cancelled = true;
        emit InvoiceCancelled(invoiceId, msg.sender);
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        Invoice storage inv = invoices[invoiceId];
        if (inv.creator == address(0)) revert InvoiceNotFound();
        return inv;
    }

    function hasPaid(uint256 invoiceId, address account) external view returns (bool) {
        return paid[invoiceId][account];
    }
}
