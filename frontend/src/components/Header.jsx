import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, User, LogOut, Settings, Bell, Hash } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ShinyText from './ReactBits/ShinyText';
import { cn } from '../utils/cn';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (token && username) {
      axios.get(`${API_URL}/profile/${username}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setProfile(r.data))
        .catch(() => {});
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [username, token]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (location.pathname === '/login') return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/50 backdrop-blur-xl border-b border-white/10 z-[100] px-4 md:px-8 flex items-center justify-between">
      {/* Logo */}
      <div 
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => navigate('/rooms')}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
          <Hash size={18} className="text-white" />
        </div>
        <ShinyText text="Aura" className="text-xl font-bold tracking-tighter" speed={3} />
      </div>

      {/* Center Search (Global or Contextual) */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
        <input 
          id="global-search"
          type="text" 
          placeholder="Search Aura... (Ctrl+K)" 
          className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:bg-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 group-focus-within:opacity-100 transition-opacity">
          <kbd className="text-[10px] font-sans font-bold bg-white/10 px-1.5 py-0.5 rounded">Ctrl</kbd>
          <kbd className="text-[10px] font-sans font-bold bg-white/10 px-1.5 py-0.5 rounded">K</kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button 
          title="Create New Group"
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          onClick={() => navigate('/rooms', { state: { openCreateModal: true } })}
        >
          <Plus size={20} />
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pr-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-inner">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                username?.[0]?.toUpperCase()
              )}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-300">@{username}</span>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center font-bold text-indigo-400">
                      {username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{username}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Active Now</p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { navigate('/profile'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                      <User size={16} /> My Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all opacity-50 cursor-not-allowed">
                      <Settings size={16} /> App Settings
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-1">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
