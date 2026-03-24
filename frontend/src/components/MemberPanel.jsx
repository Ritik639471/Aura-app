import React from 'react';
import { User, Shield, Info } from 'lucide-react';
import { cn } from '../utils/cn';

const MemberPanel = ({ members, onlineUsers, isOpen, onClose }) => {
  if (!isOpen) return null;

  const online = members.filter(m => onlineUsers.includes(m.username || m.author));
  const offline = members.filter(m => !onlineUsers.includes(m.username || m.author));

  return (
    <aside className="member-panel open">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          Members <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-400">{members.length}</span>
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        {/* Online Section */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 px-2">Online — {online.length}</h4>
          <div className="space-y-1">
            {online.map((member, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 group transition-colors cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 text-xs font-bold text-white group-hover:scale-105 transition-transform">
                    {(member.username || member.author)?.[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-slate-200">
                    {member.username || member.author}
                  </p>
                  {member._isAdmin && <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Admin</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offline Section */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2 px-2">Offline — {offline.length}</h4>
          <div className="space-y-1 opacity-60">
            {offline.map((member, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 group transition-colors cursor-pointer grayscale-[0.5]">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 text-xs font-bold text-slate-400">
                  {(member.username || member.author)?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-slate-400">
                    {member.username || member.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default MemberPanel;
