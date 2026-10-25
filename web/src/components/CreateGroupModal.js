'use client';
import { useState } from 'react';
import { PixelAlien } from './PixelIcons';

export default function CreateGroupModal({ onClose, onCreate, walletAddress }) {
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    const addr = memberInput.trim();
    if (!addr) return;
    if (!addr.match(/^0x[0-9a-fA-F]{40}$/)) {
      setError('Please enter a valid 0x Ethereum address.');
      return;
    }
    if (members.includes(addr.toLowerCase())) {
      setError('Address already added.');
      return;
    }
    if (addr.toLowerCase() === walletAddress?.toLowerCase()) {
      setError('You are automatically included as the group creator.');
      return;
    }
    setMembers(prev => [...prev, addr.toLowerCase()]);
    setMemberInput('');
    setError('');
  };

  const removeMember = (addr) => {
    setMembers(prev => prev.filter(m => m !== addr));
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name.');
      return;
    }
    if (members.length === 0) {
      setError('Add at least one member besides yourself.');
      return;
    }
    setError('');
    setIsCreating(true);
    try {
      await onCreate({ groupName: groupName.trim(), members, groupAvatar: groupAvatar.trim() });
    } catch (e) {
      setError(e.message || 'Group creation failed.');
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card create-group-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--sidebar-bg, #161b22)',
          border: '1px solid var(--arcade-neon-magenta, #ff007f)',
          borderRadius: '18px',
          padding: '28px 28px 24px',
          maxWidth: '440px',
          width: '92vw',
          boxShadow: '0 0 48px rgba(255,0,127,0.18)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PixelAlien size={24} color="var(--arcade-neon-magenta, #ff007f)" />
            <h2 style={{
              margin: 0,
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '0.78rem',
              color: 'var(--arcade-neon-magenta, #ff007f)',
              letterSpacing: '0.04em'
            }}>New Group Chat</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#8b9bb4', cursor: 'pointer',
              fontSize: '1.2rem', lineHeight: 1, padding: '4px'
            }}
          >✕</button>
        </div>

        {/* Group Name */}
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.72rem', color: '#8b9bb4', fontFamily: 'monospace' }}>
          GROUP NAME
        </label>
        <input
          type="text"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="e.g. Crypto Squad 🚀"
          maxLength={64}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#0d1117', border: '1px solid #30363d',
            borderRadius: '10px', padding: '10px 14px',
            color: '#f0f6fc', fontSize: '0.9rem', marginBottom: '16px',
            outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--arcade-neon-blue, #00f0ff)'}
          onBlur={e => e.target.style.borderColor = '#30363d'}
        />

        {/* Group Avatar (Optional) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'radial-gradient(circle at 30% 30%, #301934 0%, #161b22 100%)',
            border: '1.5px solid var(--arcade-neon-magenta, #ff007f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 0 12px rgba(255, 0, 127, 0.3)'
          }}>
            {groupAvatar ? (
              <img 
                src={groupAvatar.startsWith('http') ? groupAvatar : `https://ipfs.io/ipfs/${groupAvatar}`} 
                alt="Group Avatar Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <PixelAlien size={24} color="var(--arcade-neon-magenta, #ff007f)" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.68rem', color: '#8b9bb4', fontFamily: 'monospace' }}>
              GROUP AVATAR (OPTIONAL URL / IPFS)
            </label>
            <input
              type="text"
              value={groupAvatar}
              onChange={e => setGroupAvatar(e.target.value)}
              placeholder="https://... or Qm... / bafy..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#0d1117', border: '1px solid #30363d',
                borderRadius: '8px', padding: '8px 12px',
                color: '#f0f6fc', fontSize: '0.78rem',
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--arcade-neon-magenta, #ff007f)'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
          </div>
        </div>

        {/* Add Members */}
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.72rem', color: '#8b9bb4', fontFamily: 'monospace' }}>
          ADD MEMBERS (0x ADDRESSES)
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={memberInput}
            onChange={e => setMemberInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="0x1234...abcd"
            style={{
              flex: 1,
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: '10px', padding: '9px 14px',
              color: '#f0f6fc', fontSize: '0.85rem',
              outline: 'none'
            }}
            onFocus={e => e.target.style.borderColor = 'var(--arcade-neon-blue, #00f0ff)'}
            onBlur={e => e.target.style.borderColor = '#30363d'}
          />
          <button
            type="button"
            onClick={addMember}
            style={{
              background: 'rgba(0,240,255,0.12)',
              border: '1px solid var(--arcade-neon-blue, #00f0ff)',
              borderRadius: '10px', padding: '9px 16px',
              color: 'var(--arcade-neon-blue, #00f0ff)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700,
              transition: 'all 0.15s'
            }}
          >+ Add</button>
        </div>

        {/* Member chips */}
        {members.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {members.map(addr => (
              <div
                key={addr}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(57,255,20,0.08)',
                  border: '1px solid rgba(57,255,20,0.3)',
                  borderRadius: '20px', padding: '4px 10px 4px 12px',
                  fontSize: '0.72rem', color: '#39ff14', fontFamily: 'monospace'
                }}
              >
                <span>{addr.slice(0, 6)}\u2026{addr.slice(-4)}</span>
                <button
                  type="button"
                  onClick={() => removeMember(addr)}
                  style={{
                    background: 'none', border: 'none', color: '#ff6b6b',
                    cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1,
                    padding: '0 1px'
                  }}
                >\u2715</button>
              </div>
            ))}
          </div>
        )}

        {/* Your address note */}
        <p style={{ fontSize: '0.7rem', color: '#8b9bb4', marginBottom: '8px', fontFamily: 'monospace' }}>
          You ({walletAddress ? `${walletAddress.slice(0,6)}\u2026${walletAddress.slice(-4)}` : '?'}) will be added automatically as admin.
        </p>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.3)',
            borderRadius: '8px', padding: '8px 12px', marginBottom: '14px',
            fontSize: '0.75rem', color: '#ff6b6b'
          }}>
            &#9888; {error}
          </div>
        )}

        {/* Create Button */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={isCreating}
          style={{
            width: '100%',
            background: isCreating
              ? 'rgba(255,0,127,0.08)'
              : 'linear-gradient(135deg, rgba(255,0,127,0.22), rgba(255,0,127,0.08))',
            border: '1.5px solid var(--arcade-neon-magenta, #ff007f)',
            borderRadius: '12px', padding: '12px',
            color: 'var(--arcade-neon-magenta, #ff007f)',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.72rem', cursor: isCreating ? 'not-allowed' : 'pointer',
            letterSpacing: '0.06em',
            transition: 'all 0.2s',
            opacity: isCreating ? 0.6 : 1
          }}
        >
          {isCreating ? '\u23f3 Creating Group\u2026' : '\ud83d\ude80 Create Group'}
        </button>

        {/* XMTP note */}
        <p style={{
          marginTop: '12px', textAlign: 'center',
          fontSize: '0.62rem', color: '#8b9bb4', fontFamily: 'monospace'
        }}>
          Powered by XMTP Protocol \u2014 all members must have XMTP activated
        </p>
      </div>
    </div>
  );
}
