import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiMessageSquare, FiSettings, FiBarChart, FiFileText, FiGrid, FiPlus, FiChevronDown, FiChevronUp, FiSearch, FiDollarSign, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const SideBar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useAuth();

  console.log('SideBar - user:', user);
  console.log('SideBar - user.type_utilisateur:', user?.type_utilisateur);

  const getMenuItems = () => {
    if (!user || !user.type_utilisateur) {
      console.log('SideBar - returning empty array - no user or type_utilisateur');
      return [];
    }

    console.log('SideBar - user.type_utilisateur:', user.type_utilisateur);
    
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
            path: '/fournisseur/dashboard',
            section: 'main'
          },
          {
            name: 'Mes Prestations',
            icon: FiBriefcase,
            path: '/fournisseur/mes-prestations',
            section: 'services'
          },
          {
            name: 'Mes Collaborations',
            icon: FiUsers,
            path: '/fournisseur/mes-collaborations',
            section: 'services',
            badge: 'Nouveau'
          },
          {
            name: 'Créer Prestation',
            icon: FiPlus,
            path: '/fournisseur/creer-prestation',
            section: 'services'
          },
          {
            name: 'Demandes Disponibles',
            icon: FiSearch,
            path: '/fournisseur/demandes',
            section: 'services'
          },
          {
            name: 'Mes Transactions',
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

      case 'fournisseur':
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/client_dashboard',
            section: 'main'
          },
          {
            name: 'Mes Prestations',
            icon: FiBriefcase,
            path: '/fournisseur/mes-prestations',
            section: 'services'
          },
          {
            name: 'Mes Collaborations',
            icon: FiUsers,
            path: '/fournisseur/mes-collaborations',
            section: 'services',
            badge: 'Nouveau'
          },
          /* {
            name: 'Créer Prestation',
            icon: FiPlus,
            path: '/fournisseur/creer-prestation',
            section: 'services'
          }, 
          {
            name: 'Demandes',
            icon: FiFileText,
            path: '/fournisseur/demandes',
            section: 'services'
          },*/
          {
            name: 'Toutes les demandes',
            icon: FiSearch,
            path: '/fournisseur/toutes-les-demandes',
            section: 'services',
            badge: 'Nouveau'
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

      case 'client':
        return [
          {
            name: 'Tableau de bord',
            icon: FiHome,
            path: '/client_dashboard',
            section: 'main'
          },
          {
            name: 'Mes Demandes',
            icon: FiFileText,
            path: '/client/mes-demandes',
            section: 'services'
          },
          {
            name: 'Mes Collaborations',
            icon: FiUsers,
            path: '/client/mes-collaborations',
            section: 'services',
            badge: 'Nouveau'
          },
          /* {
            name: 'Créer Demande',
            icon: FiPlus,
            path: '/client/creer-demande',
            section: 'services'
          }, 
          {
            name: 'Prestations',
            icon: FiBriefcase,
            path: '/client/prestations',
            section: 'services'
          },*/
          {
            name: 'Toutes les prestations',
            icon: FiSearch,
            path: '/client/toutes-les-prestations',
            section: 'services',
            badge: 'Nouveau'
          },
          {
            name: 'Transactions',
            icon: FiBarChart,
            path: '/client/transactions',
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

  console.log('SideBar - menuItems:', menuItems);

  const isActive = (path) => location.pathname === path;

  // Grouper les éléments par section
  const groupedItems = menuItems.reduce((groups, item) => {
    if (!groups[item.section]) {
      groups[item.section] = [];
    }
    groups[item.section].push(item);
    return groups;
  }, {});

  console.log('SideBar - menuItems:', menuItems);
  console.log('SideBar - groupedItems:', groupedItems);

  const [expandedSections, setExpandedSections] = React.useState({
    main: true,
    management: true,
    services: true,
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
              const isExpanded = expandedSections[section];
              console.log('SideBar - rendering section:', section, 'items:', items);
              
              return (
                <div key={section} className="mb-4">
                  {/* Section header */}
                  <button
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
                        console.log('SideBar - rendering item:', item);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`
                              group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ml-4
                              ${isActive(item.path)
                                ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
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
