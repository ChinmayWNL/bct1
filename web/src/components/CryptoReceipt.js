'use client';
import { useState } from 'react';

export default function CryptoReceipt({ data = {}, isSent, networkName, chainId }) {
  const [copied, setCopied] = useState(false);

  const { amount, txHash, note, status = 'confirmed' } = data;

  const handleCopyHash = async (e) => {
    e.stopPropagation();
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard copy failed", err);
    }
  };

  const getExplorerUrl = (hash) => {
    if (!hash) return '#';
    const cid = Number(chainId || data.chainId);

    if (cid === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`;
    if (cid === 42161) return `https://arbiscan.io/tx/${hash}`;
    if (cid === 8453) return `https://basescan.org/tx/${hash}`;
    if (cid === 10) return `https://optimistic.etherscan.io/tx/${hash}`;
    if (cid === 137) return `https://polygonscan.com/tx/${hash}`;
    if (cid === 1) return `https://etherscan.io/tx/${hash}`;
    if (cid === 31337 || cid === 1337) return `#`;

    // Fallback to networkName string matching
    const net = (networkName || '').toLowerCase();
    if (net.includes('sepolia')) return `https://sepolia.etherscan.io/tx/${hash}`;
    if (net.includes('arbitrum')) return `https://arbiscan.io/tx/${hash}`;
    if (net.includes('base')) return `https://basescan.org/tx/${hash}`;
    if (net.includes('optimism') || net.includes('op')) return `https://optimistic.etherscan.io/tx/${hash}`;
    if (net.includes('polygon')) return `https://polygonscan.com/tx/${hash}`;
    return `https://etherscan.io/tx/${hash}`;
  };

  const shortHash = txHash ? `${txHash.substring(0, 8)}...${txHash.substring(txHash.length - 6)}` : 'On-Chain Tx';
  const isDemoOrLocal = txHash && (txHash.startsWith('0xdemo') || txHash.length !== 66 || chainId === 31337);

  return (
    <div className={`crypto-receipt-card ${isSent ? 'sent-receipt' : 'received-receipt'}`}>
      <div className="crypto-receipt-top">
        <div className="crypto-receipt-icon-badge">
          <span>Ξ</span>
        </div>
        <div className="crypto-receipt-status">
          <span className="crypto-receipt-type">
            {isSent ? 'ETH Sent' : 'ETH Received'}
          </span>
          <span className="crypto-receipt-confirmed">
            <span className={`confirmed-dot ${status === 'pending' ? 'pending-dot' : ''}`}></span>{' '}
            {status === 'pending' ? 'Pending Confirmation...' : 'On-Chain Verified'}
          </span>
        </div>
        <div className="crypto-receipt-amount" style={{ color: isSent ? '#f87171' : '#34d399' }}>
          {isSent ? `-${amount}` : `+${amount}`} ETH
        </div>
      </div>

      {note && (
        <div className="crypto-receipt-note">
          &ldquo;{note}&rdquo;
        </div>
      )}

      <div className="crypto-receipt-footer">
        <div className="tx-hash-badge" onClick={handleCopyHash} title="Click to copy Transaction Hash">
          <span className="tx-hash-label">TX:</span>
          <span className="tx-hash-val">{shortHash}</span>
          <span className="copy-icon-small">{copied ? '✓' : '📋'}</span>
        </div>
        {txHash && !isDemoOrLocal && (
          <a 
            href={getExplorerUrl(txHash)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="explorer-link"
            onClick={(e) => e.stopPropagation()}
          >
            Explorer ↗
          </a>
        )}
      </div>
    </div>
  );
}
