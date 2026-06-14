import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiMessageSquare, FiSettings, FiBarChart, FiFileText, FiGrid, FiChevronDown, FiChevronUp, FiSearch, FiDollarSign, FiUser, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import AppBrand from '../AppBrand';

/** Indique si le lien du menu correspond à l’URL courante (y compris alias et sous-routes). */
const itemIsActive = (pathname, item) => {
  if (typeof item.isActive === 'function') {
    return item.isActive(pathname);
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

const SideBar = ({ isOpen, toggleSidebar, collapsed = false, toggleCollapsed }) => {
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
            name: 'Prestations & Besoins',
            icon: FiBriefcase,
            path: '/admin/prestations',
            isActive: (p) => p === '/admin/prestations' || p === '/admin/besoins' || p === '/admin/demandes',
            section: 'services'
          },
          {
            name: 'Collaborations',
            icon: FiUsers,
            path: '/admin/collaborations',
            isActive: (p) => p === '/admin/collaborations' || p.startsWith('/admin/collaborations/'),
            section: 'services'
          },
          {
            name: 'Transactions',
            icon: FiBarChart,
            path: '/admin/transactions',
            section: 'services'
          },
          {
            name: 'Correspondances',
            icon: FiSearch,
            path: '/admin/correspondances',
            isActive: (p) => p === '/admin/correspondances' || p.startsWith('/admin/correspondances/'),
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
            section: 'services'
          },
          {
            name: 'Mes transactions',
            icon: FiDollarSign,
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
            icon: FiUser,
            path: '/fournisseur/profil',
            isActive: (p) => p === '/fournisseur/profil',
            section: 'settings'
          },
          {
            name: 'Paramètres',
            icon: FiSettings,
            path: '/fournisseur/parametres',
            isActive: (p) => p === '/fournisseur/parametres',
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
              p === '/client/creer-besoin' ||
              p === '/client/creer-demande' ||
              /^\/client\/besoins\/[^/]+(\/edit)?$/.test(p) ||
              /^\/client\/demandes\/[^/]+(\/edit)?$/.test(p),
            section: 'services'
          },
          {
            name: 'Mes matchings',
            icon: FiSearch,
            path: '/client/matchings',
            isActive: (p) =>
              p === '/client/matchings' ||
              p.startsWith('/client/matchings/') ||
              /^\/client\/besoins\/[^/]+\/matching$/.test(p) ||
              /^\/client\/demandes\/[^/]+\/matching$/.test(p),
            section: 'services'
          },
          {
            name: 'Mes collaborations',
            icon: FiUsers,
            path: '/client/mes-collaborations',
            section: 'services'
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
            icon: FiUser,
            path: '/client/profil',
            isActive: (p) => p === '/client/profil',
            section: 'settings'
          },
          {
            name: 'Paramètres',
            icon: FiSettings,
            path: '/client/parametres',
            isActive: (p) => p === '/client/parametres',
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

  const getDashboardLink = () => {
    if (!user?.type_utilisateur) return '/';
    switch (user.type_utilisateur) {
      case 'administrateur':
        return '/admin/dashboard';
      case 'fournisseur':
        return '/fournisseur/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/dashboard';
    }
  };

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
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-col bg-white shadow-lg
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:min-h-screen lg:translate-x-0 lg:shadow-none
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="flex h-full flex-col">
          <div
            className={`flex h-[4.25rem] shrink-0 items-center gap-2 border-b border-gray-200 px-4 ${
              collapsed ? 'lg:justify-center lg:px-2' : 'justify-between'
            }`}
          >
            <div className={collapsed ? 'min-w-0 lg:hidden' : 'min-w-0'}>
              <AppBrand to={getDashboardLink()} size="sm" />
            </div>
            {toggleCollapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden lg:inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
                aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
              >
                {collapsed ? (
                  <FiChevronsRight className="h-5 w-5" />
                ) : (
                  <FiChevronsLeft className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-6 space-y-4 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-4 lg:px-2' : 'px-4'}`}>
            {Object.entries(groupedItems).map(([section, items]) => {
              const isExpanded = expandedSections[section] !== false;

              return (
                <div key={section} className="mb-4">
                  {/* Section header — masqué sur desktop en mode replié */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-150 ${
                      collapsed ? 'lg:hidden' : ''
                    }`}
                  >
                    <span className="capitalize">{section}</span>
                    {isExpanded ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
                  </button>

                  {/* Section items — toujours visibles sur desktop en mode replié */}
                  {(isExpanded || collapsed) && (
                    <div className="mt-1 space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const active = itemIsActive(location.pathname, item);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            title={collapsed ? item.name : undefined}
                            className={`
                              group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                              ${collapsed ? 'ml-4 lg:ml-0 lg:justify-center' : 'ml-4'}
                              ${active
                                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                          >
                            <Icon className={`h-5 w-5 ${collapsed ? 'mr-3 lg:mr-0' : 'mr-3'}`} />
                            <span className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                            {item.badge && (
                              <span className={`ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full ${collapsed ? 'lg:hidden' : ''}`}>
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
          <div className={`border-t border-gray-200 p-4 ${collapsed ? 'lg:px-2' : ''}`}>
            <div className={`flex items-center ${collapsed ? 'lg:justify-center' : ''}`}>
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className={`ml-3 ${collapsed ? 'lg:hidden' : ''}`}>
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
      </aside>
    </>
  );
};

export default SideBar;
