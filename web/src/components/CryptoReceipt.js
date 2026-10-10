'use client';
import { useState } from 'react';

export default function CryptoReceipt({ data, isSent, networkName }) {
  const [copied, setCopied] = useState(false);

  const { amount, txHash, note, from, to } = data;

  const handleCopyHash = (e) => {
    e.stopPropagation();
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerUrl = (hash) => {
    if (!hash) return '#';
    const net = (networkName || '').toLowerCase();
    if (net.includes('sepolia')) {
      return `https://sepolia.etherscan.io/tx/${hash}`;
    }
    if (net.includes('arbitrum')) {
      return `https://arbiscan.io/tx/${hash}`;
    }
    if (net.includes('optimism') || net.includes('op')) {
      return `https://optimistic.etherscan.io/tx/${hash}`;
    }
    if (net.includes('polygon')) {
      return `https://polygonscan.com/tx/${hash}`;
    }
    return `https://etherscan.io/tx/${hash}`;
  };

  const shortHash = txHash ? `${txHash.substring(0, 8)}...${txHash.substring(txHash.length - 6)}` : 'On-Chain Tx';

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
            <span className="confirmed-dot"></span> On-Chain Verified
          </span>
        </div>
        <div className="crypto-receipt-amount">
          +{amount} ETH
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
        {txHash && (
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
