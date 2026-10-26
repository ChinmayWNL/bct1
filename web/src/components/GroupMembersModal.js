'use client';
import { useState } from 'react';
import { PixelAlien, PixelClose, PixelWarning, PixelSparkles, PixelPencil, PixelEye, PixelCheck, renderPixelText } from './PixelIcons';

export default function GroupMembersModal({
  groupName,
  groupAvatar,
  members = [],
  walletAddress,
  addressProfiles = {},
  onAddMember,
  onRemoveMember,
  onUpdateGroupAvatar,
  onClose
}) {
  const [newMemberInput, setNewMemberInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removingAddr, setRemovingAddr] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(null);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarInput, setAvatarInput] = useState(groupAvatar || '');

  const handleCopy = async (addr) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddr(addr);
      setTimeout(() => setCopiedAddr(null), 1800);
    } catch (e) {}
  };

  const handleAdd = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess('');
    const addr = newMemberInput.trim();
    if (!addr) {
      setError('Please enter an Ethereum address.');
      return;
    }
    if (!addr.match(/^0x[0-9a-fA-F]{40}$/)) {
      setError('Invalid format. Must be a 40-character 0x Ethereum address.');
      return;
    }

    setIsAdding(true);
    try {
      await onAddMember(addr);
      setSuccess(`Added ${addr.slice(0, 6)}…${addr.slice(-4)} to group!`);
      setNewMemberInput('');
    } catch (err) {
      setError(err?.message || 'Failed to add member.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (addr) => {
    if (!onRemoveMember) return;
    setError('');
    setSuccess('');
    setRemovingAddr(addr);
    try {
      await onRemoveMember(addr);
      setSuccess(`Removed ${addr.slice(0, 6)}…${addr.slice(-4)} from group.`);
    } catch (err) {
      setError(err?.message || 'Failed to remove member.');
    } finally {
      setRemovingAddr(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card group-members-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--sidebar-bg, #161b22)',
          border: '1.5px solid var(--arcade-neon-magenta, #ff007f)',
          borderRadius: '18px',
          padding: '24px 26px',
          maxWidth: '460px',
          width: '92vw',
          boxShadow: '0 0 48px rgba(255,0,127,0.22)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'radial-gradient(circle at 30% 30%, #301934 0%, #161b22 100%)',
                border: '1.5px solid var(--arcade-neon-magenta, #ff007f)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
                boxShadow: '0 0 12px rgba(255, 0, 127, 0.3)',
                cursor: onUpdateGroupAvatar ? 'pointer' : 'default'
              }}
              onClick={() => onUpdateGroupAvatar && setIsEditingAvatar(prev => !prev)}
              title={onUpdateGroupAvatar ? "Click to change group avatar" : "Group avatar"}
            >
              {groupAvatar ? (
                <img 
                  src={groupAvatar.startsWith('http') ? groupAvatar : `https://ipfs.io/ipfs/${groupAvatar}`} 
                  alt="Group Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <PixelAlien size={24} color="var(--arcade-neon-magenta, #ff007f)" />
              )}
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.76rem',
                color: 'var(--arcade-neon-magenta, #ff007f)',
                letterSpacing: '0.04em'
              }}>
                {groupName || 'Group Chat'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.65rem', color: '#8b9bb4', fontFamily: 'monospace' }}>
                  {members.length} {members.length === 1 ? 'MEMBER' : 'MEMBERS'} ON-CHAIN
                </span>
                {onUpdateGroupAvatar && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAvatar(prev => !prev)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--arcade-neon-cyan, #00f0ff)',
                      fontSize: '0.65rem', cursor: 'pointer', fontFamily: 'monospace', padding: 0,
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {isEditingAvatar ? <><PixelClose size={10} /> Cancel</> : <><PixelPencil size={10} /> Edit PFP</>}
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#8b9bb4', cursor: 'pointer',
              fontSize: '1.2rem', lineHeight: 1, padding: '4px', display: 'flex', alignItems: 'center'
            }}
          ><PixelClose size={16} /></button>
        </div>

        {/* Change Group Avatar Form */}
        {isEditingAvatar && onUpdateGroupAvatar && (
          <div style={{
            background: 'rgba(255,0,127,0.06)', border: '1px solid rgba(255,0,127,0.3)',
            borderRadius: '10px', padding: '10px 12px', marginBottom: '16px'
          }}>
            <label style={{ display: 'block', fontSize: '0.65rem', color: '#ff007f', fontFamily: 'monospace', marginBottom: '6px' }}>
              GROUP AVATAR (URL OR IPFS CID)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={avatarInput}
                onChange={e => setAvatarInput(e.target.value)}
                placeholder="https://... or Qm..."
                style={{
                  flex: 1, background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.78rem'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateGroupAvatar(avatarInput.trim());
                  setIsEditingAvatar(false);
                  setSuccess('Group avatar updated!');
                }}
                style={{
                  background: 'var(--arcade-neon-magenta, #ff007f)', border: 'none',
                  borderRadius: '6px', color: '#fff', fontSize: '0.72rem', padding: '6px 12px',
                  fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div style={{
            background: 'rgba(255,0,85,0.12)', border: '1px solid #ff0055',
            color: '#ff5577', borderRadius: '8px', padding: '8px 12px',
            fontSize: '0.72rem', marginBottom: '14px', fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <PixelWarning size={14} color="#ff5577" /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(57,255,20,0.12)', border: '1px solid #39ff14',
            color: '#39ff14', borderRadius: '8px', padding: '8px 12px',
            fontSize: '0.72rem', marginBottom: '14px', fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <PixelSparkles size={14} color="#39ff14" /> <span>{success}</span>
          </div>
        )}

        {/* Add New Member Input */}
        <form onSubmit={handleAdd} style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.68rem', color: '#8b9bb4', fontFamily: 'monospace' }}>
            ADD MEMBER (0X ETHEREUM ADDRESS)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newMemberInput}
              onChange={e => setNewMemberInput(e.target.value)}
              placeholder="0x..."
              maxLength={42}
              disabled={isAdding}
              style={{
                flex: 1,
                background: '#0d1117', border: '1px solid #30363d',
                borderRadius: '10px', padding: '9px 12px',
                color: '#f0f6fc', fontSize: '0.82rem', fontFamily: 'monospace',
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--arcade-neon-magenta, #ff007f)'}
              onBlur={e => e.target.style.borderColor = '#30363d'}
            />
            <button
              type="submit"
              disabled={isAdding || !newMemberInput.trim()}
              style={{
                background: isAdding
                  ? 'rgba(255,0,127,0.1)'
                  : 'linear-gradient(135deg, rgba(255,0,127,0.3), rgba(255,0,127,0.1))',
                border: '1.5px solid var(--arcade-neon-magenta, #ff007f)',
                borderRadius: '10px', padding: '0 16px',
                color: 'var(--arcade-neon-magenta, #ff007f)',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '0.62rem',
                cursor: isAdding || !newMemberInput.trim() ? 'not-allowed' : 'pointer',
                opacity: isAdding || !newMemberInput.trim() ? 0.6 : 1,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {isAdding ? 'Adding…' : '+ Add'}
            </button>
          </div>
        </form>

        {/* Members List */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.68rem', color: '#8b9bb4', fontFamily: 'monospace' }}>
            MEMBERS ROSTER ({members.length})
          </label>
          <div style={{
            maxHeight: '190px',
            overflowY: 'auto',
            background: '#0d1117',
            border: '1px solid #21262d',
            borderRadius: '10px',
            padding: '4px'
          }}>
            {members.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.72rem', color: '#6e7681' }}>
                Loading members from XMTP MLS network…
              </div>
            ) : (
              members.map((m, idx) => {
                const addr = m.accountIdentifiers?.[0]?.identifier || m.inboxId || '';
                const isMe = addr.toLowerCase() === walletAddress?.toLowerCase();
                const isBeingRemoved = removingAddr === addr;
                const memberProf = addr ? addressProfiles[addr.toLowerCase()] : null;
                const memberName = memberProf?.username ? `@${memberProf.username}` : (addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : `Member #${idx + 1}`);
                const memberAvatar = memberProf?.profilePictureCID;

                return (
                  <div
                    key={addr || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      background: isMe ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                      borderBottom: idx < members.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#21262d', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0
                      }}>
                        {memberAvatar ? (
                          <img 
                            src={memberAvatar.startsWith('http') ? memberAvatar : `https://ipfs.io/ipfs/${memberAvatar}`} 
                            alt={memberName} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}><PixelAlien size={14} color="#00f0ff" /></span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: isMe ? '#00f0ff' : '#c9d1d9',
                          fontWeight: isMe ? '600' : 'normal',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {renderPixelText(memberName, 13)}
                        </span>
                        {memberProf?.username && addr && (
                          <span style={{ fontSize: '0.62rem', color: '#6e7681', fontFamily: 'monospace' }}>
                            {addr.slice(0, 6)}…{addr.slice(-4)}
                          </span>
                        )}
                      </div>
                      {isMe && (
                        <span style={{
                          fontSize: '0.55rem',
                          background: 'rgba(0,240,255,0.18)',
                          color: '#00f0ff',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          YOU
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(addr)}
                        title="Copy Address"
                        style={{
                          background: 'none', border: 'none',
                          color: copiedAddr === addr ? '#39ff14' : '#8b9bb4',
                          cursor: 'pointer', fontSize: '0.72rem', padding: '2px 4px',
                          display: 'inline-flex', alignItems: 'center'
                        }}
                      >
                        {copiedAddr === addr ? <PixelCheck size={12} color="#39ff14" /> : <PixelEye size={12} />}
                      </button>

                      {onRemoveMember && !isMe && (
                        <button
                          type="button"
                          onClick={() => handleRemove(addr)}
                          disabled={isBeingRemoved}
                          title="Remove from group"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff5577',
                            cursor: isBeingRemoved ? 'wait' : 'pointer',
                            fontSize: '0.78rem',
                            padding: '2px 4px',
                            opacity: isBeingRemoved ? 0.4 : 0.8,
                            display: 'inline-flex', alignItems: 'center'
                          }}
                        >
                          <PixelClose size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <p style={{
          marginTop: '16px', marginBottom: 0, textAlign: 'center',
          fontSize: '0.62rem', color: '#8b9bb4', fontFamily: 'monospace'
        }}>
          Changes sync securely to XMTP MLS group epochs
        </p>
      </div>
    </div>
  );
}
