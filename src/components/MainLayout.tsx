import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 overflow-hidden">
      {/* Sidebar - Visible on Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 relative h-screen overflow-hidden flex flex-col items-center">
        {/* Responsive Container - Center on desktop, full-width on mobile */}
        <div className="w-full h-full lg:max-w-[1600px] relative flex flex-col overflow-hidden no-scrollbar">
          <div className="flex-1 w-full relative flex flex-col overflow-hidden">
            {children}
          </div>
          
          {/* Bottom Nav - Visible on Mobile */}
          <BottomNav />
        </div>
      </main>
    </div>
  );
}
