import React from 'react';
import { LogOut, Hash, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatSidebar = ({ isOpen, onClose, username, room, isDM, dmPartner, roomUsers, roomMembers, onGroupInfo }) => {
  const navigate = useNavigate();
  const visibleUsers = roomUsers.slice(0, 4);
  const extraCount = roomUsers.length - 4;

  return (
    <div className={`chat-sidebar glass-panel ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hash color="white" size={17} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>Aura</h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>@{username}</p>
          </div>
        </div>
        <button className="mobile-nav-toggle" onClick={onClose}><X size={20} /></button>
      </div>

      {/* Room Info Card */}
      <div style={{ padding: '14px 20px', borderBottom: 'var(--glass-border)' }}>
        <button onClick={onGroupInfo} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '12px', padding: '12px 14px', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>#{isDM ? dmPartner : room}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {roomMembers.length} members · <span style={{ color: 'var(--success)' }}>{roomUsers.length} online</span>
            </p>
          </div>
          <Info size={14} color="var(--primary-accent)" />
        </button>
      </div>

      {/* Online Users */}
      <div style={{ flex: 1, padding: '14px 20px', overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          Online Now · {roomUsers.length}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {visibleUsers.map((user, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '9px', background: user === username ? 'rgba(99,102,241,0.1)' : 'transparent', border: user === username ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary-accent),var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0 }}>{user[0]?.toUpperCase()}</div>
              <span style={{ fontSize: '0.83rem', fontWeight: '500', color: user === username ? 'var(--primary-accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user}{user === username ? ' (You)' : ''}</span>
            </div>
          ))}
          {extraCount > 0 && (
            <button onClick={onGroupInfo} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', textAlign: 'left', cursor: 'pointer', padding: '4px 10px' }}>
              +{extraCount} more online →
            </button>
          )}
          {roomUsers.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No users online</p>}
        </div>
      </div>

      {/* Leave button */}
      <div style={{ padding: '14px 20px', borderTop: 'var(--glass-border)' }}>
        <button onClick={() => navigate('/rooms')} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', width: '100%', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
          <LogOut size={15} /> Leave Room
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
