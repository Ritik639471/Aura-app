import React, { useState, useEffect } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://aura-app-keg8.onrender.com/api';
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

// Extract first URL from text
const extractUrl = (text) => {
  const match = text?.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
};

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    axios.get(`${API_URL}/linkpreview?url=${encodeURIComponent(url)}`)
      .then(r => setPreview(r.data))
      .catch(() => {});
  }, [url]);
  if (!preview || preview.error || !preview.title) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '8px', textDecoration: 'none' }}>
      <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        {preview.image && <img src={preview.image} alt="" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover' }} />}
        <div style={{ padding: '8px 10px' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{preview.domain}</p>
          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>{preview.title}</p>
          {preview.description && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{preview.description}</p>}
        </div>
      </div>
    </a>
  );
};

const MessageBubble = ({ msg, username, isHighlighted, onReact, onEdit, onDelete, onPin, isPowerUser, searchQuery }) => {
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.message);
  const isMe = msg.author === username;
  const isDeleted = !!msg.deletedAt;
  const linkUrl = !isDeleted && !msg.imageUrl ? extractUrl(msg.message) : null;

  const highlightText = (text) => {
    if (!searchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((p, i) =>
      p.toLowerCase() === searchQuery.toLowerCase()
        ? <mark key={i} style={{ background: 'rgba(99,102,241,0.5)', color: '#fff', borderRadius: '3px', padding: '0 2px' }}>{p}</mark>
        : p
    );
  };

  const renderReadReceipt = () => {
    if (!isMe) return null;
    const readCount = msg.readBy?.filter(u => u !== username).length || 0;
    return readCount > 0
      ? <CheckCheck size={13} style={{ color: 'var(--primary-accent)' }} />
      : <Check size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim()) { onEdit(msg._id, editText, msg.room); setEditing(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '4px' }}
      onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}
    >
      <div style={{ maxWidth: '70%', position: 'relative' }}>
        {/* Action bar */}
        {showActions && !isDeleted && (
          <div style={{ position: 'absolute', [isMe ? 'left' : 'right']: '-90px', top: '0', display: 'flex', gap: '4px', background: 'rgba(20,20,30,0.85)', backdropFilter: 'blur(8px)', padding: '4px 6px', borderRadius: '8px', zIndex: 5, whiteSpace: 'nowrap' }}>
            {isMe && <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px' }} title="Edit">✏️</button>}
            {(isMe || isPowerUser) && <button onClick={() => onDelete(msg._id, msg.room)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px' }} title="Delete">🗑️</button>}
            {isPowerUser && <button onClick={() => onPin(msg._id, msg.room)} style={{ background: 'none', border: 'none', color: msg.pinned ? '#FFD700' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px' }} title={msg.pinned ? 'Unpin' : 'Pin'}>📌</button>}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          background: isDeleted ? 'rgba(255,255,255,0.03)' : isHighlighted ? 'rgba(99,102,241,0.25)' : isMe ? 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))' : 'rgba(255,255,255,0.05)',
          border: isDeleted || !isMe ? 'var(--glass-border)' : 'none',
          padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          boxShadow: isMe && !isDeleted ? '0 4px 14px var(--primary-glow)' : 'none', transition: 'background 0.3s'
        }}>
          {!isMe && !isDeleted && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '600' }}>{msg.author}</div>}

          {isDeleted ? (
            <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🚫 This message was deleted</div>
          ) : editing ? (
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', gap: '6px' }}>
              <input value={editText} onChange={e => setEditText(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', padding: '4px 8px', fontSize: '0.9rem', flex: 1 }} autoFocus />
              <button type="submit" style={{ background: 'var(--primary-accent)', border: 'none', borderRadius: '6px', color: '#fff', padding: '4px 8px', cursor: 'pointer' }}>✓</button>
              <button type="button" onClick={() => setEditing(false)} style={{ background: 'rgba(239,68,68,0.3)', border: 'none', borderRadius: '6px', color: '#fff', padding: '4px 8px', cursor: 'pointer' }}>✕</button>
            </form>
          ) : (
            <>
              {msg.imageUrl && (
                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img src={msg.imageUrl} alt="attachment" style={{ maxWidth: '220px', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', display: 'block', marginBottom: msg.message ? '6px' : 0 }} />
                </a>
              )}
              {msg.message && <div style={{ lineHeight: '1.5', color: isMe ? '#fff' : 'var(--text-primary)', wordBreak: 'break-word' }}>{highlightText(msg.message)}</div>}
              {linkUrl && <LinkPreview url={linkUrl} />}
            </>
          )}

          {!isDeleted && (
            <div style={{ fontSize: '0.62rem', color: isMe ? 'rgba(255,255,255,0.6)' : 'var(--text-secondary)', marginTop: '4px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
              {msg.edited && <span style={{ fontStyle: 'italic', marginRight: '4px' }}>edited</span>}
              {msg.time} {renderReadReceipt()}
            </div>
          )}
        </div>

        {/* Reactions */}
        {!isDeleted && msg.reactions?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
            {msg.reactions.map((r, i) => (
              <button key={i} onClick={() => onReact(msg._id, r.emoji)} style={{ background: r.users.includes(username) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                {r.emoji} {r.users.length}
              </button>
            ))}
          </div>
        )}

        {/* Emoji reaction picker on hover */}
        {showActions && !isDeleted && msg._id && (
          <div style={{ position: 'absolute', [isMe ? 'right' : 'left']: 0, bottom: msg.reactions?.length > 0 ? '32px' : '-28px', background: 'rgba(20,20,30,0.9)', backdropFilter: 'blur(12px)', border: 'var(--glass-border)', borderRadius: '16px', padding: '5px 8px', display: 'flex', gap: '3px', zIndex: 10 }}>
            {REACTION_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => onReact(msg._id, emoji)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '3px', borderRadius: '6px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>{emoji}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
