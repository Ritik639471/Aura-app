import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Plus, Trash2, LogOut, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRooms();
  }, [navigate, token]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    if (!newRoomName.trim()) return;

    try {
      await axios.post(`${API_URL}/rooms`, { name: newRoomName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewRoomName('');
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    }
  };

  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const handleJoinRoom = (roomName) => {
    navigate('/chat', { state: { room: roomName } });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="login-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--glass-border)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Chat Rooms</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {username}</p>
          </div>
          <button onClick={handleLogout} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: 'none' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateRoom} style={{ display: 'flex', gap: '12px' }}>
          <input 
            className="input-base" 
            type="text" 
            placeholder="New room name..." 
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}>
            <Plus size={18} /> Create
          </button>
        </form>

        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            className="input-base" 
            type="text" 
            placeholder="Search rooms..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '48px', background: 'rgba(0,0,0,0.2)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
          {filteredRooms.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No rooms found.</p>
          ) : (
            filteredRooms.map(room => (
              <div 
                key={room._id} 
                onClick={() => handleJoinRoom(room.name)}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                  border: '1px solid var(--surface-border)', cursor: 'pointer', transition: 'var(--transition-fast)' 
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Hash color="var(--primary-accent)" size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{room.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Created by {room.creator?.username || 'Unknown'}</p>
                  </div>
                </div>
                
                {room.creator?._id === userId && (
                  <button 
                    onClick={(e) => handleDeleteRoom(room._id, e)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Rooms;
