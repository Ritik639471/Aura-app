import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, User, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

import TiltedCard from '../components/ReactBits/TiltedCard';
import BlurText from '../components/ReactBits/BlurText';
import ShinyText from '../components/ReactBits/ShinyText';
import { cn } from '../utils/cn';

const API_URL = 'https://aura-app-keg8.onrender.com/api';

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [profile, setProfile] = useState({ bio: '', status: '', avatar: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get(`${API_URL}/profile/${username}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setProfile(r.data))
      .catch(() => {});
  }, [username, token, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('bio', profile.bio || '');
      fd.append('status', profile.status || '');
      if (file) fd.append('avatar', file);
      const res = await axios.put(`${API_URL}/profile`, fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setProfile(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { 
      console.error(e); 
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = preview || profile.avatar;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-slate-950/20 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12 w-full max-w-lg flex flex-col gap-8 relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-600/20 blur-3xl rounded-full" />

        <div className="flex items-center gap-4 relative z-10 border-b border-white/10 pb-6">
          <button 
            onClick={() => navigate('/rooms')} 
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <User className="text-indigo-400" size={24} />
              My Profile
            </h1>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-40 h-40 group relative">
            {avatarSrc ? (
              <TiltedCard
                imageSrc={avatarSrc}
                altText="Profile Picture"
                captionText="Click to change"
                containerClassName="w-full h-full cursor-pointer"
                imageClassName="rounded-3xl"
                showTooltip={true}
                onClick={() => fileRef.current?.click()}
              />
            ) : (
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                onClick={() => fileRef.current?.click()}
                className="w-full h-full rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-6xl font-black text-white shadow-2xl shadow-indigo-500/20 cursor-pointer border-4 border-white/10"
              >
                {username?.[0]?.toUpperCase()}
              </motion.div>
            )}
            
            <button 
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-3 -right-3 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-2 border-slate-900 group-hover:scale-110 transition-transform z-20"
            >
              <Camera size={20} />
            </button>
          </div>
          
          <input 
            ref={fileRef} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={e => { 
              const f = e.target.files?.[0]; 
              if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } 
            }} 
          />
          
          <div className="text-center">
            <BlurText 
              text={`@${username}`} 
              className="text-2xl font-bold tracking-tight text-white" 
              delay={100} 
            />
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-1 opacity-70">Authenticated Member</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-6 relative z-10">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Current Status</label>
            <input 
              className="input-base !bg-black/20 !border-white/5 focus:!border-indigo-500/50" 
              value={profile.status || ''} 
              onChange={e => setProfile(p => ({ ...p, status: e.target.value }))} 
              placeholder="👋 What's on your mind?" 
              maxLength={80} 
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Biography</label>
              <span className="text-[10px] font-bold text-slate-600">{(profile.bio || '').length}/160</span>
            </div>
            <textarea 
              className="input-base !bg-black/20 !border-white/5 focus:!border-indigo-500/50 min-h-[100px] py-3 leading-relaxed resize-none" 
              value={profile.bio || ''} 
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} 
              placeholder="Tell the community about yourself..." 
              maxLength={160} 
              rows={3} 
            />
          </motion.div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave} 
          disabled={saving} 
          className={cn(
            "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm tracking-wide transition-all shadow-xl shadow-indigo-500/10",
            saved ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700"
          )}
        >
          {saving ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              <span>Saving Changes...</span>
            </>
          ) : saved ? (
            <>
              <CheckCircle2 size={20} />
              <span>Profile Saved!</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Update Profile</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Profile;
