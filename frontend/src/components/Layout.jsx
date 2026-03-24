import React, { useState } from 'react';
import SidebarPrimary from './SidebarPrimary';
import SidebarSecondary from './SidebarSecondary';
import { Menu, X } from 'lucide-react';
import { cn } from '../utils/cn';

const Layout = ({ children }) => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  return (
    <div className="app-shell font-sans text-slate-200 relative">
      <SidebarPrimary />
      
      {/* Mobile Overlay */}
      {isLeftSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[35] md:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      <SidebarSecondary isOpen={isLeftSidebarOpen} />

      <main className="main-content flex flex-col min-w-0 bg-slate-950/20 relative">
        {/* Mobile Header (Sticky) */}
        <div className="md:hidden h-16 border-b border-white/5 flex items-center px-4 bg-slate-900/40 backdrop-blur-md z-[60] shrink-0 gap-3">
          <button 
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="p-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all shadow-xl"
            aria-label="Toggle Sidebar"
          >
            {isLeftSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-black tracking-tighter text-indigo-400 text-lg">AURA</span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
