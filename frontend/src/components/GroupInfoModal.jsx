import React from 'react';
import { X, Hash, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const GroupInfoModal = ({ room, roomMembers, roomUsers, username, userId, token, isDM, dmPartner, onClose, onMakeAdmin }) => {
  const isCreator = roomMembers.find(m => (m._id === userId) && m._isCreator);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
      <div className="glass-panel" style={{ padding: '28px', maxWidth: '420px', width: '100%', maxHeight: '82vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hash size={22} color="white" />
            </div>
            <div>
              <h2 style={{ fontWeight: '700', fontSize: '1.2rem' }}>{isDM ? dmPartner : `#${room}`}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isDM ? 'Direct Message' : `${roomMembers.length} members · ${roomUsers.length} online`}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>

        <h3 style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Members ({roomMembers.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {roomMembers.map((m, i) => {
            const name = m.username || m;
            const mid = m._id || m;
            const isOnline = roomUsers.includes(name);
            const isAdmin = m._isAdmin;
            const isCreatorMember = m._isCreator;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary-accent),var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
                  {m.avatar ? <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{name} {name === username && '(You)'}</p>
                    {isCreatorMember && <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.2)', color: 'var(--primary-accent)', borderRadius: '6px', padding: '2px 6px' }}>Creator</span>}
                    {isAdmin && !isCreatorMember && <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-accent)', borderRadius: '6px', padding: '2px 6px' }}>Admin</span>}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: isOnline ? 'var(--success)' : 'var(--text-secondary)' }}>{isOnline ? '● Online' : '○ Offline'}</p>
                </div>
                {/* Make/Remove Admin button — visible to creator only, not for themselves */}
                {m._canManage && name !== username && (
                  <button onClick={() => onMakeAdmin(mid, isAdmin)} style={{ background: isAdmin ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${isAdmin ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`, color: isAdmin ? 'var(--danger)' : 'var(--primary-accent)', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {isAdmin ? '- Admin' : '+ Admin'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
