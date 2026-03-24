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
  const { state } = useLocation();
  const [activeTab, setActiveTab] = useState('joined');
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dmSearch, setDmSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (state?.openCreateModal) setIsCreateModalOpen(true);
  }, [state]);

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

  const publicRooms = rooms.filter(r => !r.isDirectMessage);
  const joinedRooms = publicRooms.filter(r => r.members?.some(m => (m._id || m) === userId));
  const discoverRooms = publicRooms.filter(r => !r.members?.some(m => (m._id || m) === userId));
  const myDMs = rooms.filter(r => r.isDirectMessage);

  const filteredJoined = joinedRooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDiscover = discoverRooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getDmPartner = (room) => {
    const partner = room.members?.find(m => (m._id || m) !== userId && m.username !== username);
    return partner?.username || 'Unknown';
  };

  return (
    <div className="w-full flex flex-col items-center py-8 px-4 md:px-8 max-w-5xl mx-auto">
      
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Plus className="text-indigo-500" /> Create New Channel
              </h2>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Channel Name</label>
                  <input 
                    autoFocus
                    className="input-base !bg-black/20" 
                    type="text" 
                    placeholder="e.g. general-chat" 
                    value={newRoomName} 
                    onChange={(e) => setNewRoomName(e.target.value)} 
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Create Channel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col gap-8">
        {/* Search Header */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div className="w-full md:max-w-xs relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              className="input-base !pl-12 !bg-white/5 border-none" 
              type="text" 
              placeholder={activeTab === 'dms' ? "Search direct messages..." : "Search channels..."}
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          
          <div className="flex p-1 bg-white/5 rounded-2xl w-full md:w-auto">
            {['joined', 'discover', 'dms'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={cn(
                  "flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                {tab === 'joined' ? 'My Channels' : tab === 'discover' ? 'Discover' : 'DMs'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm flex justify-between items-center border border-red-500/20"
            >
              <div className="flex items-center gap-2">⚠️ {error}</div>
              <X size={18} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => setError('')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse" />
            ))
          ) : activeTab === 'joined' ? (
            filteredJoined.length === 0 ? (
              <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                  <Hash size={32} />
                </div>
                <p className="text-slate-500 italic">No channels joined yet. Explore or create one!</p>
              </div>
            ) : (
              filteredJoined.map((room, idx) => (
                <RoomCard 
                  key={room._id} room={room} userId={userId} 
                  onClick={() => navigate('/chat', { state: { room: room.name } })}
                  onDelete={(e) => handleDeleteRoom(room._id, e)}
                  isMember={true}
                />
              ))
            )
          ) : activeTab === 'discover' ? (
            filteredDiscover.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500 italic">No more channels to discover.</div>
            ) : (
              filteredDiscover.map((room, idx) => (
                <RoomCard 
                  key={room._id} room={room} userId={userId} 
                  onClick={() => handleJoinAction(room._id)}
                  isMember={false}
                />
              ))
            )
          ) : (
            myDMs.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500 italic">No DMs yet. Start one in the header!</div>
            ) : (
              myDMs.map((room, idx) => {
                const partner = getDmPartner(room);
                return (
                  <RoomCard 
                    key={room._id} room={room} userId={userId} partnerName={partner}
                    onClick={() => navigate('/chat', { state: { room: room.name, isDM: true, dmPartner: partner } })}
                  />
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};

const RoomCard = ({ room, userId, onClick, onDelete, isMember, partnerName }) => {
  const isCreator = (room.creator?._id || room.creator) === userId;
  const initial = partnerName ? partnerName[0] : room.name[0];
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group"
    >
      <SpotlightCard 
        className="!p-5 !bg-white/5 hover:!bg-white/10 !rounded-3xl cursor-pointer border-white/5 shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between min-h-[140px]"
        onClick={onClick}
      >
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner",
              partnerName ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white" : "bg-white/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors"
            )}>
              {partnerName ? initial.toUpperCase() : <Hash size={24} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate pr-2">{partnerName || room.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
                {partnerName ? 'Direct Message' : `${room.members?.length || 0} members`}
              </p>
            </div>
          </div>
          {isCreator && onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(e); }}
              className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {(room.members || []).slice(0, 3).map((m, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[8px] font-bold overflow-hidden">
                {m.username?.[0]?.toUpperCase() || i}
              </div>
            ))}
            {(room.members?.length || 0) > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                +{(room.members?.length || 0) - 3}
              </div>
            )}
          </div>
          
          <div className={cn(
            "text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest transition-all",
            isMember ? "bg-emerald-400/10 text-emerald-400" : "bg-indigo-600 text-white group-hover:shadow-lg group-hover:shadow-indigo-500/30"
          )}>
            {isMember ? 'Open Chat' : 'Join Room'}
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

export default Rooms;
