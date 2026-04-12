import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiMessageSquare, FiSettings, FiBarChart, FiFileText, FiGrid, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const SideBar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getMenuItems = () => {
    if (!user) return [];

    switch (user.type_utilisateur) {
      case 'administrateur':
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/admin/dashboard',
            section: 'main'
          },
          {
            name: 'Utilisateurs',
            icon: FiUsers,
            path: '/admin/users',
            section: 'management'
          },
          {
            name: 'Catégories',
            icon: FiGrid,
            path: '/admin/categories',
            section: 'management'
          },
          {
            name: 'Prestations',
            icon: FiBriefcase,
            path: '/admin/prestations',
            section: 'services'
          },
          {
            name: 'Demandes',
            icon: FiFileText,
            path: '/admin/demandes',
            section: 'services'
          },
          {
            name: 'Transactions',
            icon: FiBarChart,
            path: '/admin/transactions',
            section: 'services'
          },
          {
            name: 'Messages',
            icon: FiMessageSquare,
            path: '/admin/messages',
            section: 'communication'
          },
          {
            name: 'Paramètres',
            icon: FiSettings,
            path: '/admin/settings',
            section: 'settings'
          }
        ];

      case 'prestataire':
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/prestataire/dashboard',
            section: 'main'
          },
          {
            name: 'Mes Prestations',
            icon: FiBriefcase,
            path: '/prestataire/mes-prestations',
            section: 'services'
          },
          {
            name: 'Créer Prestation',
            icon: FiPlus,
            path: '/prestataire/creer-prestation',
            section: 'services'
          },
          {
            name: 'Demandes',
            icon: FiFileText,
            path: '/prestataire/demandes',
            section: 'services'
          },
          {
            name: 'Transactions',
            icon: FiBarChart,
            path: '/prestataire/transactions',
            section: 'services'
          },
          {
            name: 'Messages',
            icon: FiMessageSquare,
            path: '/prestataire/messages',
            section: 'communication'
          },
          {
            name: 'Profil',
            icon: FiSettings,
            path: '/prestataire/profil',
            section: 'settings'
          }
        ];

      case 'fournisseur':
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/fournisseur/dashboard',
            section: 'main'
          },
          {
            name: 'Mes Demandes',
            icon: FiFileText,
            path: '/fournisseur/mes-demandes',
            section: 'services'
          },
          {
            name: 'Créer Demande',
            icon: FiPlus,
            path: '/fournisseur/creer-demande',
            section: 'services'
          },
          {
            name: 'Prestations',
            icon: FiBriefcase,
            path: '/fournisseur/prestations',
            section: 'services'
          },
          {
            name: 'Transactions',
            icon: FiBarChart,
            path: '/fournisseur/transactions',
            section: 'services'
          },
          {
            name: 'Messages',
            icon: FiMessageSquare,
            path: '/fournisseur/messages',
            section: 'communication'
          },
          {
            name: 'Profil',
            icon: FiSettings,
            path: '/fournisseur/profil',
            section: 'settings'
          }
        ];

      default:
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/dashboard',
            section: 'main'
          }
        ];
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">ServiceConnect</h1>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white font-medium">
                  {currentUser?.first_name?.[0] || currentUser?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.first_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser?.user_type === 'service_provider' ? 'Fournisseur de services' : 
                   currentUser?.user_type === 'client_provider' ? 'Fournisseur client' : 
                   'Administrateur'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {/* Main navigation */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Menu principal
              </h3>
              <div className="space-y-1">
                {menuItems
                  .filter(item => item.section === 'main' || item.section === 'services')
                  .map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive(item.path)
                          ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon 
                        className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${isActive(item.path) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                        `} 
                      />
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>

            {/* Communication */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Communication
              </h3>
              <div className="space-y-1">
                {menuItems
                  .filter(item => item.section === 'communication')
                  .map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive(item.path)
                          ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon 
                        className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${isActive(item.path) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                        `} 
                      />
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Paramètres
              </h3>
              <div className="space-y-1">
                {menuItems
                  .filter(item => item.section === 'settings')
                  .map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive(item.path)
                          ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon 
                        className={`
                          mr-3 h-5 w-5 flex-shrink-0
                          ${isActive(item.path) ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'}
                        `} 
                      />
                      {item.name}
                    </Link>
                  ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default SideBar;
