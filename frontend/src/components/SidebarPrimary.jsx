import React from 'react';
import { Home, MessageCircle, Search, Settings, Plus, Compass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';

const SidebarPrimary = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'rooms', icon: Home, path: '/rooms', label: 'Home' },
    { id: 'dms', icon: MessageCircle, path: '/chat', label: 'Direct Messages', state: { isDM: true } },
    { id: 'explore', icon: Compass, path: '/rooms', label: 'Explore', state: { activeTab: 'discover' } },
  ];

  return (
    <aside className="sidebar-primary">
      {/* Brand Icon */}
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/40 cursor-pointer hover:scale-105 transition-all">
        <span className="text-white font-black text-xl italic">A</span>
      </div>

      <div className="w-8 h-[2px] bg-white/10 rounded-full mb-6" />

      <nav className="flex flex-col gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path && (!item.state || location.state?.activeTab === item.state.activeTab);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path, { state: item.state })}
              className={cn(
                "w-12 h-12 rounded-3xl flex items-center justify-center transition-all duration-300 relative group",
                isActive 
                  ? "bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20" 
                  : "bg-white/5 text-slate-400 hover:bg-indigo-600 hover:rounded-xl hover:text-white"
              )}
            >
              <item.icon size={24} />
              
              {/* Tooltip (Desktop) */}
              <div className="absolute left-16 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none z-50">
                {item.label}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute -left-4 w-1.5 h-8 bg-white rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button 
          onClick={() => navigate('/rooms', { state: { openCreateModal: true } })}
          className="w-12 h-12 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:rounded-xl transition-all"
        >
          <Plus size={24} />
        </button>
        <button className="w-12 h-12 rounded-3xl bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 transition-all">
          <Settings size={20} />
        </button>
      </div>
    </aside>
  );
};

export default SidebarPrimary;
