import React, { useState } from 'react';
import Header from './Header';
import SidebarPrimary from './SidebarPrimary';
import SidebarSecondary from './SidebarSecondary';
import { Menu, X } from 'lucide-react';
import { cn } from '../utils/cn';

const Layout = ({ children }) => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex-col font-sans text-slate-200 relative">
      <Header />
      
      <div className="flex flex-1 w-full h-[calc(100vh-4rem)] mt-16 overflow-hidden relative">
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
          <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
