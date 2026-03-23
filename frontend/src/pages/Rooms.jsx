import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Plus, Trash2, LogOut, Search, MessageCircle, X, User } from 'lucide-react';
import axios from 'axios';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const Rooms = () => {
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'dms'
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchRooms();
  }, [navigate, token]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    if (!newRoomName.trim()) return;
    try {
      await axios.post(`${API_URL}/rooms`, { name: newRoomName }, { headers: { Authorization: `Bearer ${token}` } });
      setNewRoomName('');
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/rooms/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleJoinAction = async (roomId, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/rooms/${roomId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    }
  };

  const handleEnterRoom = (roomName, isMember) => {
    if (!isMember) { setError('You must join the room first!'); return; }
    navigate('/chat', { state: { room: roomName } });
  };

  const handleStartDM = async (targetUsername) => {
    if (!targetUsername.trim()) return;
    setError('');
    try {
      const res = await axios.post(`${API_URL}/rooms/dm/${targetUsername}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/chat', { state: { room: res.data.name, isDM: true, dmPartner: targetUsername } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start DM');
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const publicRooms = rooms.filter(r => !r.isDirectMessage && r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const myDMs = rooms.filter(r => r.isDirectMessage);

  const getDmPartner = (room) => {
    const partner = room.members?.find(m => m._id !== userId && m.username !== username);
    return partner?.username || 'Unknown';
  };

  return (
    <div className="login-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '620px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--glass-border)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Aura</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {username}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/profile')} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-accent)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
              <User size={16} /> Profile
            </button>
            <button onClick={handleLogout} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: 'none' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['channels', 'dms'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem',
              background: activeTab === tab ? 'var(--primary-accent)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)', transition: '0.2s'
            }}>
              {tab === 'channels' ? <><Hash size={16} style={{ display: 'inline', marginRight: '6px' }} />Channels</> : <><MessageCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />Direct Messages</>}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
            {error}<X size={16} style={{ cursor: 'pointer' }} onClick={() => setError('')} />
          </div>
        )}

        {activeTab === 'channels' && (
          <>
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', gap: '12px' }}>
              <input className="input-base" type="text" placeholder="New channel name..." value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
              <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}><Plus size={18} /> Create</button>
            </form>

            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input className="input-base" type="text" placeholder="Search channels..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: '48px', background: 'rgba(0,0,0,0.2)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '8px' }}>
              {publicRooms.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No channels found.</p>
              ) : (
                publicRooms.map(room => {
                  const isMember = room.members?.some(m => m._id === userId || m === userId);
                  return (
                    <div key={room._id} onClick={() => handleEnterRoom(room.name, isMember)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--surface-border)', cursor: 'pointer', transition: '0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Hash color="var(--primary-accent)" size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{room.name}</h3>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{room.members?.length || 0} member(s)</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!isMember ? (
                          <button onClick={e => handleJoinAction(room._id, e)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Join</button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '500' }}>✓ Member</span>
                        )}
                        {room.creator?._id === userId && (
                          <button onClick={e => handleDeleteRoom(room._id, e)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'dms' && (
          <>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input className="input-base" type="text" placeholder="Enter username to message..." value={dmSearch} onChange={e => setDmSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleStartDM(dmSearch); }} />
              <button onClick={() => handleStartDM(dmSearch)} className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}>Open DM</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
              {myDMs.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No DMs yet. Type a username above!</p>
              ) : (
                myDMs.map(room => {
                  const partner = getDmPartner(room);
                  return (
                    <div key={room._id} onClick={() => navigate('/chat', { state: { room: room.name, isDM: true, dmPartner: partner } })} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--surface-border)', cursor: 'pointer', transition: '0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.1rem' }}>
                        {partner[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ fontWeight: '600' }}>{partner}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct Message</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Rooms;
