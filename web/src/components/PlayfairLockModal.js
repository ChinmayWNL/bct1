'use client';
import { useState } from 'react';
import { keySquareRows, countKeyLetters, encryptPlayfair, decryptPlayfair, getPlayfairCipherText } from '@/utils/playfairCipher';

// Modes:
//  'setup'    – no key for this chat yet: choose a secret key (enables cipher + unlocks).
//               If the peer already sent encrypted messages (sampleEnvelope), the newest one is
//               decrypted live as you type so you can see when the key is right.
//  'unlock'   – key exists, chat is locked: type the key to read
//  'unlocked' – chat is readable: lock again, toggle outgoing encryption, or reset
export default function PlayfairLockModal({
  mode,
  peerName,
  sampleEnvelope,
  encryptOutgoing,
  unlockedKey,
  onSetupKey,
  onUnlock,
  onLock,
  onToggleEncryptOutgoing,
  onResetKey,
  onClose
}) {
  const [keyInput, setKeyInput] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const previewKey = mode === 'unlocked' ? unlockedKey : keyInput;
  const rows = keySquareRows(previewKey);
  // Joining a chat the peer already encrypted: no confirm field, the live preview is the check
  const needsConfirm = mode === 'setup' && !sampleEnvelope;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'setup') {
      if (countKeyLetters(keyInput) < 3) {
        setError('Key needs at least 3 letters (A-Z).');
        return;
      }
      if (needsConfirm && keyInput !== confirmInput) {
        setError('Keys do not match.');
        return;
      }
      setBusy(true);
      await onSetupKey(keyInput);
      setBusy(false);
      return;
    }
    if (mode === 'unlock') {
      if (!keyInput.trim()) return;
      setBusy(true);
      const ok = await onUnlock(keyInput);
      setBusy(false);
      if (!ok) {
        setError('Wrong key. Messages stay scrambled.');
        setKeyInput('');
      }
    }
  };

  const title = mode === 'setup' ? 'Set Chat Cipher Key' : mode === 'unlock' ? 'Unlock Chat' : 'Chat Cipher Unlocked';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card playfair-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="brand-title" style={{ fontSize: '1.05rem' }}>
            <span>{mode === 'unlocked' ? '🔓' : '🔐'}</span> {title}
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {mode === 'setup' && !sampleEnvelope && (
          <p className="playfair-help">
            Messages you send to <strong>{peerName}</strong> will be scrambled with a Playfair cipher.
            Share this key with them in person — anyone who opens this chat without it only sees gibberish.
          </p>
        )}
        {mode === 'setup' && sampleEnvelope && (
          <p className="playfair-help">
            <strong>{peerName}</strong> is sending Playfair-encrypted messages. Enter the key they shared with you —
            your replies will be encrypted with it too.
          </p>
        )}
        {mode === 'unlock' && (
          <p className="playfair-help">
            This chat is cipher-locked. Enter the shared secret key to read and send messages.
          </p>
        )}
        {mode === 'unlocked' && (
          <p className="playfair-help">
            Readable until you lock it, switch chats, reload, or stay idle for a few minutes.
          </p>
        )}

        {mode !== 'unlocked' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Secret key</label>
              <div className="playfair-key-row">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="form-control"
                  placeholder="e.g. monarchy"
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setError(''); }}
                  autoFocus
                  autoComplete="off"
                />
                <button type="button" className="playfair-eye-btn" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide key' : 'Show key'}>
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {needsConfirm && (
              <div className="form-group">
                <label>Confirm key</label>
                <input
                  type={showKey ? 'text' : 'password'}
                  className="form-control"
                  value={confirmInput}
                  onChange={(e) => { setConfirmInput(e.target.value); setError(''); }}
                  autoComplete="off"
                />
              </div>
            )}
            {mode === 'setup' && sampleEnvelope && (
              <div className="playfair-sample">
                <div>Latest message: <code>{getPlayfairCipherText(sampleEnvelope)}</code></div>
                {countKeyLetters(keyInput) > 0 && (
                  <div>With this key: <code>{decryptPlayfair(sampleEnvelope, keyInput)}</code></div>
                )}
              </div>
            )}
            {error && <div className="playfair-error">{error}</div>}
            <button type="submit" className="modal-btn-primary" disabled={busy}>
              {busy ? 'Checking...' : mode === 'setup' ? '🔐 Enable Cipher' : '🔓 Unlock'}
            </button>
          </form>
        )}

        {/* 5x5 key square preview (only while the key is known/being typed and visible) */}
        {(mode === 'unlocked' || (mode === 'setup' && showKey && keyInput)) && (
          <div className="playfair-square-wrap">
            <div className="playfair-square-label">Key square (I/J share a cell)</div>
            <div className="playfair-square">
              {rows.flat().map((ch, i) => (
                <span key={i} className="playfair-cell">{ch === 'I' ? 'I/J' : ch}</span>
              ))}
            </div>
            {mode === 'setup' && !sampleEnvelope && (
              <div className="playfair-sample">
                &ldquo;Hello there&rdquo; → <code>{getPlayfairCipherText(encryptPlayfair('Hello there', keyInput))}</code>
              </div>
            )}
          </div>
        )}

        {mode === 'unlocked' && (
          <div className="playfair-actions">
            <label className="playfair-toggle">
              <input
                type="checkbox"
                checked={encryptOutgoing}
                onChange={(e) => onToggleEncryptOutgoing(e.target.checked)}
              />
              <span>Encrypt messages I send in this chat</span>
            </label>
            <button type="button" className="modal-btn-primary" onClick={onLock}>
              🔒 Lock Chat Now
            </button>
            <button
              type="button"
              className="modal-btn-secondary playfair-reset-btn"
              onClick={() => {
                if (confirm('Forget the key for this chat? Encrypted messages stay scrambled until someone enters the key again.')) {
                  onResetKey();
                }
              }}
            >
              Forget Key / Change Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
