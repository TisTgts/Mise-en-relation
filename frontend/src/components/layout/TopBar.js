import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiLogOut, FiMenu, FiSun, FiMoon, FiUser, FiSettings, FiChevronDown, FiActivity } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../NotificationBell';

const TopBar = ({ toggleSidebar, sidebarOpen }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const profileMenuRef = useRef(null);

  useEffect(() => {
    // Vérifier le thème préféré de l'utilisateur
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Fermer les menus quand on clique en dehors
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.type_utilisateur) {
      case 'administrateur':
        return '/admin/dashboard';
      case 'fournisseur':
        return '/fournisseur/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/';
    }
  };

  const getProfileLink = () => {
    if (!user) return '/login';
    switch (user.type_utilisateur) {
      case 'fournisseur':
        return '/fournisseur/profil';
      case 'client':
        return '/client/profil';
      case 'administrateur':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Menu toggle and Logo */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden transition-colors"
            >
              <FiMenu className="h-6 w-6" />
            </button>
           {/*  <div className="flex items-center ml-4 lg:ml-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SC</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">ServiceConnect</h1>
                  <p className="text-xs text-gray-500">Tableau de bord</p>
                </div>
              </div>
            </div> */}
          </div>

          {/* Right side - Theme, Search, Notifications, Profile */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title={isDarkMode ? "Passer en mode jour" : "Passer en mode nuit"}
            >
              {isDarkMode ? (
                <FiSun className="h-5 w-5 text-yellow-500" />
              ) : (
                <FiMoon className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Search Bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Rechercher des services, prestataires..."
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
              <FiSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <NotificationBell variant="dashboard" />

            {/* User Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                {/* <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name || user?.username}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserRoleColor()}`}>
                      {getUserRoleIcon()}
                      <span className="ml-1">{user?.type_utilisateur}</span>
                    </span>
                  </div>
                </div> */}
                <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.first_name || user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FiActivity className="w-4 h-4 mr-2" />
                      Tableau de bord
                    </Link>
                    <Link
                      to={getProfileLink()}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FiUser className="w-4 h-4 mr-2" />
                      Mon Profil
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <FiSettings className="w-4 h-4 mr-2" />
                      Paramètres
                    </Link>
                  </div>
                  <div className="border-t border-gray-200 py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
