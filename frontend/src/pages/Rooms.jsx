import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Plus, Trash2, LogOut, Search, MessageCircle, X, User } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import SpotlightCard from '../components/ReactBits/SpotlightCard';
import ShinyText from '../components/ReactBits/ShinyText';
import BlurText from '../components/ReactBits/BlurText';
import VariableProximity from '../components/ReactBits/VariableProximity';
import { cn } from '../utils/cn';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const Rooms = () => {
  const [activeTab, setActiveTab] = useState('channels');
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-6 md:p-10 w-full max-w-3xl flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShinyText text="Aura" className="text-4xl font-bold tracking-tight" speed={3} />
            </div>
            <BlurText 
              text={`Welcome back, ${username}`} 
              className="text-slate-400 mt-1" 
              delay={50}
              animateBy="words"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate('/profile')} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-xl px-4 py-2.5 font-medium hover:bg-indigo-500/20 transition-all"
            >
              <User size={18} /> Profile
            </button>
            <button 
              onClick={handleLogout} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl px-4 py-2.5 font-medium hover:bg-red-500/20 transition-all"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-2xl">
          {['channels', 'dms'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300",
                activeTab === tab 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {tab === 'channels' ? <Hash size={18} /> : <MessageCircle size={18} />}
              {tab === 'channels' ? 'Channels' : 'Direct Messages'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm flex justify-between items-center"
            >
              {error}
              <X size={18} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setError('')} />
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'channels' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-5"
          >
            <form onSubmit={handleCreateRoom} className="flex gap-3">
              <input 
                className="input-base !bg-black/20" 
                type="text" 
                placeholder="New channel name..." 
                value={newRoomName} 
                onChange={(e) => setNewRoomName(e.target.value)} 
              />
              <button type="submit" className="btn-primary !px-6 whitespace-nowrap">
                <Plus size={20} /> Create
              </button>
            </form>

            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                className="input-base !pl-12 !bg-black/20" 
                type="text" 
                placeholder="Search channels..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>

            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ))
              ) : publicRooms.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic">No channels found.</div>
              ) : (
                publicRooms.map((room, index) => {
                  const isMember = room.members?.some(m => m._id === userId || m === userId);
                  return (
                    <motion.div
                      key={room._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SpotlightCard 
                        className="!p-4 !bg-white/5 hover:!bg-white/10 cursor-pointer border-white/5 transition-all"
                        onClick={() => handleEnterRoom(room.name, isMember)}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                              <Hash className="text-indigo-400" size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{room.name}</h3>
                              <p className="text-xs text-slate-400 font-medium">
                                <span className="text-indigo-400 inline-block mr-1">●</span>
                                {room.members?.length || 0} members
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                            {!isMember ? (
                              <button 
                                onClick={e => handleJoinAction(room._id, e)} 
                                className="bg-white/10 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                              >
                                Join
                              </button>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Member
                              </span>
                            )}
                            {room.creator?._id === userId && (
                              <button 
                                onClick={e => handleDeleteRoom(room._id, e)} 
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 size={20} />
                              </button>
                            )}
                          </div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'dms' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="flex gap-3">
              <input 
                className="input-base !bg-black/20" 
                type="text" 
                placeholder="Enter username to message..." 
                value={dmSearch} 
                onChange={e => setDmSearch(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') handleStartDM(dmSearch); }} 
              />
              <button onClick={() => handleStartDM(dmSearch)} className="btn-primary !px-6 whitespace-nowrap">
                Open DM
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ))
              ) : myDMs.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic">No DMs yet. Type a username above!</div>
              ) : (
                myDMs.map((room, index) => {
                  const partner = getDmPartner(room);
                  return (
                    <motion.div
                      key={room._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <SpotlightCard 
                        className="!p-4 !bg-white/5 hover:!bg-white/10 cursor-pointer border-white/5 transition-all"
                        onClick={() => navigate('/chat', { state: { room: room.name, isDM: true, dmPartner: partner } })}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-indigo-500/20">
                            {partner[0]?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg tracking-tight">{partner}</h3>
                            <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1.5 uppercase">
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              Direct Message
                            </p>
                          </div>
                        </div>
                      </SpotlightCard>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Rooms;
