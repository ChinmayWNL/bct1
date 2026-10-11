'use client';
import { useState } from 'react';
import { ethers } from 'ethers';

export default function SendCryptoModal({ recipientAddress, recipientName, userBalance, signer, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const presets = ['0.001', '0.005', '0.01', '0.05'];

  const handleSend = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedAmt = amount.trim();
    if (!trimmedAmt || !/^\d+(\.\d{1,18})?$/.test(trimmedAmt)) {
      setErrorMsg('Please enter a valid ETH amount (up to 18 decimals).');
      return;
    }

    let weiAmount;
    try {
      weiAmount = ethers.parseEther(trimmedAmt);
      if (weiAmount <= 0n) {
        setErrorMsg('Please enter an amount greater than 0.');
        return;
      }
    } catch (err) {
      setErrorMsg('Invalid amount precision.');
      return;
    }

    if (userBalance) {
      try {
        const userWei = ethers.parseEther(userBalance.toString());
        if (weiAmount >= userWei) {
          setErrorMsg(`Insufficient balance for value + gas fee buffer. Balance: ${parseFloat(userBalance).toFixed(4)} ETH`);
          return;
        }
      } catch (err) {}
    }

    // Validate recipient
    const isBot = recipientAddress?.toLowerCase() === '0x000000000000000000000000000000000000dead';
    if (!isBot && !ethers.isAddress(recipientAddress)) {
      setErrorMsg('Recipient address is not a valid Ethereum address.');
      return;
    }

    // Check if tipping the built-in BlockBot or demo mode
    if (isBot || !signer) {
      setIsSending(true);
      setTimeout(() => {
        setIsSending(false);
        const demoHash = '0xdemo' + Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        onSuccess({
          amount: trimmedAmt,
          txHash: demoHash,
          note: note.trim(),
          status: 'confirmed'
        });
        onClose();
      }, 700);
      return;
    }

    try {
      setIsSending(true);
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: weiAmount
      });

      // Optimistically inform parent with broadcast hash
      onSuccess({
        amount: trimmedAmt,
        txHash: tx.hash,
        note: note.trim(),
        status: 'pending'
      });
      onClose();

      // Monitor confirmation asynchronously
      tx.wait(1).then((receipt) => {
        if (receipt && receipt.status === 1) {
          onSuccess({
            amount: trimmedAmt,
            txHash: tx.hash,
            note: note.trim(),
            status: 'confirmed'
          });
        }
      }).catch(console.warn);
    } catch (err) {
      console.error("Crypto transfer failed", err);
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        setErrorMsg('Transaction was rejected in MetaMask.');
      } else {
        setErrorMsg(err.reason || err.shortMessage || err.message || 'Transaction failed.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card crypto-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.2rem' }}>
            <span>💸</span> Send ETH Tip
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSend}>
          {/* Recipient Card */}
          <div className="crypto-recipient-card">
            <div className="crypto-rec-label">Sending to</div>
            <div className="crypto-rec-val">
              <span className="crypto-rec-name">{recipientName ? `@${recipientName}` : 'Peer Wallet'}</span>
              <span className="crypto-rec-addr">{recipientAddress}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ margin: 0 }}>Amount (ETH)</label>
              {userBalance && (
                <span className="balance-hint">
                  Balance: {parseFloat(userBalance).toFixed(4)} ETH
                </span>
              )}
            </div>
            <div className="crypto-input-wrapper">
              <span className="crypto-symbol">Ξ</span>
              <input 
                type="number" 
                step="0.0001" 
                min="0.0001"
                className="crypto-amount-input" 
                placeholder="0.01" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Presets */}
          <div className="preset-chips">
            {presets.map(p => (
              <button 
                key={p} 
                type="button" 
                className={`preset-chip ${amount === p ? 'active' : ''}`}
                onClick={() => setAmount(p)}
              >
                {p} ETH
              </button>
            ))}
          </div>

          {/* Note Input */}
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Note / Memo (Optional)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Thanks for the quick feedback! ☕" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
            />
          </div>

          {errorMsg && (
            <div className="crypto-error-banner">
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn-cancel-modal"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="modal-btn-primary" 
              style={{ flex: 1 }}
              disabled={isSending}
            >
              {isSending ? "Confirming in Wallet..." : `Confirm & Send ${amount ? `${amount} ETH` : 'ETH'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
