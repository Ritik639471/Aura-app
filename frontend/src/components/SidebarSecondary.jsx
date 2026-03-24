import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Hash, MessageCircle, ChevronDown, Plus, Monitor, LogOut } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import TiltedCard from './ReactBits/TiltedCard';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const SidebarSecondary = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (token) {
      fetchRooms();
      fetchProfile();
    }
  }, [token]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/${username}`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data);
    } catch (err) {}
  };

  const joinedRooms = rooms.filter(r => !r.isDirectMessage && r.members?.some(m => (m._id || m) === userId));
  const myDMs = rooms.filter(r => r.isDirectMessage);

  return (
    <aside className={cn("sidebar-secondary", isOpen && "open")}>
      {/* Search/Header Area */}
      <div className="p-5 border-b border-white/5">
        <button className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 flex items-center justify-between text-slate-400 group hover:border-white/10 transition-all">
          <span className="text-sm font-black uppercase tracking-widest italic text-indigo-400">Aura Chat</span>
          <ChevronDown size={18} className="group-hover:text-white transition-colors" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {/* Joined Channels */}
        <section>
          <div className="flex items-center justify-between px-2 mb-3 group">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Channels</h3>
            <button 
              onClick={() => navigate('/rooms', { state: { openCreateModal: true } })}
              className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {joinedRooms.map(room => (
              <button
                key={room._id}
                onClick={() => navigate(`/chat/${room.name}`, { state: { room: room.name } })}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl group transition-all duration-200",
                  location.pathname === `/chat/${room.name}`
                    ? "bg-indigo-500/20 text-white" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Hash size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                <span className="text-sm font-semibold truncate">{room.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Direct Messages */}
        <section>
          <div className="flex items-center justify-between px-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Direct Messages</h3>
          </div>
          <div className="space-y-0.5">
            {myDMs.map(dm => {
              const partner = dm.members?.find(m => (m._id || m) !== userId)?.username || 'Unknown';
              return (
                <button
                  key={dm._id}
                  onClick={() => navigate(`/chat/${dm.name}`, { state: { room: dm.name, isDM: true, dmPartner: partner } })}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl group transition-all duration-200",
                    location.pathname === `/chat/${dm.name}`
                      ? "bg-indigo-500/20 text-white" 
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                    {partner[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold truncate">{partner}</span>
                  <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Pinned User Profile Card (Absolute Bottom) */}
      <div className="p-2 border-t border-white/5 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all cursor-pointer">
          <div className="w-10 h-10 shrink-0">
            {profile?.avatar ? (
              <TiltedCard
                imageSrc={profile.avatar}
                altText="Profile"
                containerClassName="w-full h-full rounded-xl overflow-hidden"
                showTooltip={false}
                rotateX={10}
                rotateY={10}
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
                {username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate">@{username}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
            </p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarSecondary;
