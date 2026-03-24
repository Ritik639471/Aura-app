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
        {/* Mobile Nav Toggle */}
        <div className="md:hidden absolute top-4 left-4 z-[60]">
          <button 
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="p-3 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-white shadow-2xl"
          >
            {isLeftSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;
