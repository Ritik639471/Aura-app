import React from 'react';
import { X, Hash, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { API_URL } from '../config';

const GroupInfoModal = ({ room, roomMembers, roomUsers, username, userId, token, isDM, dmPartner, onClose, onMakeAdmin }) => {
  const isCreator = roomMembers.find(m => (m._id === userId) && m._isCreator);

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="glass-panel p-5 sm:p-7 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
              <Hash size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">{isDM ? dmPartner : `#${room}`}</h2>
              <p className="text-xs text-slate-400">{isDM ? 'Direct Message' : `${roomMembers.length} members · ${roomUsers.length} online`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
        </div>

        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Members ({roomMembers.length})</h3>
        <div className="flex flex-col gap-2">
          {roomMembers.map((m, i) => {
            const name = m.username || m;
            const mid = m._id || m;
            const isOnline = roomUsers.includes(name);
            const isAdmin = m._isAdmin;
            const isCreatorMember = m._isCreator;
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden">
                  {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-sm text-white truncate">{name} {name === username && '(You)'}</p>
                    {isCreatorMember && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">Creator</span>}
                    {isAdmin && !isCreatorMember && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold">Admin</span>}
                  </div>
                  <p className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>{isOnline ? '● Online' : '○ Offline'}</p>
                </div>
                {/* Make/Remove Admin button — visible to creator only, not for themselves */}
                {m._canManage && name !== username && (
                  <button onClick={() => onMakeAdmin(mid, isAdmin)} className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 ${isAdmin ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'}`}>
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
