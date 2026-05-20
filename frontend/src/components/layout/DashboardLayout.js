import React, { useState, useEffect } from 'react';
import TopBar from './TopBar';
import SideBar from './SideBar';
import { APP_NAME } from '../../config/branding';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    document.title = `${APP_NAME} — Tableau de bord`;
  }, []);

  // Fermer le sidebar sur mobile quand on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - toujours visible sur desktop */}
      <SideBar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Conteneur principal avec TopBar et contenu */}
      <div className="flex-1 flex flex-col h-screen">
        {/* TopBar - fixe en haut */}
        <TopBar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        
        {/* Contenu principal - scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
