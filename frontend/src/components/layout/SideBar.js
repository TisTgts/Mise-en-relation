import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiMessageSquare, FiSettings, FiBarChart, FiFileText, FiGrid, FiPlus, FiChevronDown, FiChevronUp, FiSearch, FiDollarSign, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

/** Indique si le lien du menu correspond à l’URL courante (y compris alias et sous-routes). */
const itemIsActive = (pathname, item) => {
  if (typeof item.isActive === 'function') {
    return item.isActive(pathname);
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

const SideBar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getMenuItems = () => {
    if (!user || !user.type_utilisateur) {
      return [];
    }

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
            name: 'Besoins',
            icon: FiFileText,
            path: '/admin/besoins',
            isActive: (p) => p === '/admin/besoins' || p === '/admin/demandes',
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

      case 'fournisseur':
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/fournisseur/dashboard',
            section: 'main'
          },
          {
            name: 'Mes prestations',
            icon: FiBriefcase,
            path: '/fournisseur/mes-prestations',
            section: 'services'
          },
          {
            name: 'Mes collaborations',
            icon: FiUsers,
            path: '/fournisseur/mes-collaborations',
            section: 'services',
            badge: 'Nouveau'
          },
          {
            name: 'Créer une prestation',
            icon: FiPlus,
            path: '/fournisseur/creer-prestation',
            section: 'services'
          },
          {
            name: 'Mes transactions',
            icon: FiDollarSign,
            path: '/fournisseur/transactions',
            section: 'finance'
          },
          {
            name: 'Messages',
            icon: FiMessageSquare,
            path: '/fournisseur/messages',
            section: 'communication'
          },
          {
            name: 'Profil',
            icon: FiUser,
            path: '/fournisseur/profil',
            section: 'settings'
          }
        ];

      case 'client':
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/client/dashboard',
            isActive: (p) =>
              p === '/client/dashboard' ||
              p === '/client_dashboard' ||
              p === '/dashboard/client',
            section: 'main'
          },
          {
            name: 'Mes besoins',
            icon: FiFileText,
            path: '/client/mes-besoins',
            isActive: (p) =>
              p.startsWith('/client/mes-besoins') ||
              p.startsWith('/client/mes-demandes') ||
              /^\/client\/besoins\/[^/]+/.test(p) ||
              /^\/client\/demandes\/[^/]+/.test(p),
            section: 'services'
          },
          {
            name: 'Mes collaborations',
            icon: FiUsers,
            path: '/client/mes-collaborations',
            section: 'services',
            badge: 'Nouveau'
          },
          {
            name: 'Transactions',
            icon: FiBarChart,
            path: '/client/transactions',
            isActive: (p) => p === '/client/transactions' || p.startsWith('/client/transactions/'),
            section: 'services'
          },
          {
            name: 'Messages',
            icon: FiMessageSquare,
            path: '/client/messages',
            section: 'communication'
          },
          {
            name: 'Profil',
            icon: FiSettings,
            path: '/client/profil',
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

  // Grouper les éléments par section
  const groupedItems = menuItems.reduce((groups, item) => {
    if (!groups[item.section]) {
      groups[item.section] = [];
    }
    groups[item.section].push(item);
    return groups;
  }, {});

  const [expandedSections, setExpandedSections] = React.useState({
    main: true,
    management: true,
    services: true,
    finance: true,
    communication: true,
    settings: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">Mise en Relation</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
            {Object.entries(groupedItems).map(([section, items]) => {
              const isExpanded = expandedSections[section] !== false;
              
              return (
                <div key={section} className="mb-4">
                  {/* Section header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150"
                  >
                    <span className="capitalize">{section}</span>
                    {isExpanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {/* Section items */}
                  {isExpanded && (
                    <div className="mt-1 space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = itemIsActive(location.pathname, item);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`
                              group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ml-4
                              ${active
                                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.type_utilisateur}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideBar;
