import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiBriefcase, FiFileText, FiShield, FiChevronDown } from 'react-icons/fi';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
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

  const getUserRoleIcon = () => {
    switch (user?.type_utilisateur) {
      case 'administrateur':
        return <FiShield className="w-4 h-4" />;
      case 'fournisseur':
        return <FiBriefcase className="w-4 h-4" />;
      case 'client':
        return <FiFileText className="w-4 h-4" />;
      default:
        return <FiUser className="w-4 h-4" />;
    }
  };

  const getUserRoleColor = () => {
    switch (user?.type_utilisateur) {
      case 'administrateur':
        return 'bg-purple-100 text-purple-800';
      case 'fournisseur':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ServiceConnect</span>
            </Link>
          </div>
          
          {/* Navigation Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              Accueil
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              Services
            </Link>
            {isAuthenticated && (
              <Link to={getDashboardLink()} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Tableau de bord
              </Link>
            )}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationBell variant="header" />
                
                {/* Menu Profil */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name || user?.username}
                      </p>
                      <div className="flex items-center space-x-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserRoleColor()}`}>
                          {getUserRoleIcon()}
                          <span className="ml-1">{user?.type_utilisateur}</span>
                        </span>
                      </div>
                    </div>
                    <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiSettings className="w-4 h-4 mr-2" />
                        Tableau de bord
                      </Link>
                      <Link
                        to={getProfileLink()}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiUser className="w-4 h-4 mr-2" />
                        Mon Profil
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all transform hover:scale-105 font-medium"
                >
                  Inscription
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link 
                to="/services" 
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </Link>
              {isAuthenticated && (
                <Link 
                  to={getDashboardLink()} 
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tableau de bord
                </Link>
              )}
              
              {!isAuthenticated && (
                <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-purple-700 transition-all font-medium text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
