import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../config/branding';
import AppBrand from './AppBrand';
import NotificationBell from './NotificationBell';
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiLayout,
  FiBriefcase,
  FiFileText,
  FiShield,
  FiChevronDown,
  FiUsers,
  FiLogIn,
  FiCompass,
} from 'react-icons/fi';

const ROLE_LABELS = {
  client: 'Client',
  fournisseur: 'Fournisseur',
  administrateur: 'Administrateur',
  super_admin: 'Super administrateur',
};

const NAV_LINKS = [
  { to: '/', label: 'Accueil', exact: true, icon: FiLayout },
  { to: '/services', label: 'Nos services', exact: false, icon: FiCompass },
];

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isRegisterMenuOpen, setIsRegisterMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const registerMenuRef = useRef(null);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsRegisterMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (registerMenuRef.current && !registerMenuRef.current.contains(event.target)) {
        setIsRegisterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.type_utilisateur) {
      case 'super_admin':
        return '/super-admin/dashboard';
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
      case 'super_admin':
        return '/super-admin/dashboard';
      case 'administrateur':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  };

  const getUserRoleIcon = () => {
    switch (user?.type_utilisateur) {
      case 'super_admin':
      case 'administrateur':
        return <FiShield className="h-3.5 w-3.5" aria-hidden />;
      case 'fournisseur':
        return <FiBriefcase className="h-3.5 w-3.5" aria-hidden />;
      case 'client':
        return <FiFileText className="h-3.5 w-3.5" aria-hidden />;
      default:
        return <FiUser className="h-3.5 w-3.5" aria-hidden />;
    }
  };

  const getUserRoleColor = () => {
    switch (user?.type_utilisateur) {
      case 'super_admin':
        return 'bg-fuchsia-100 text-fuchsia-800';
      case 'administrateur':
        return 'bg-violet-100 text-violet-800';
      case 'fournisseur':
        return 'bg-emerald-100 text-emerald-800';
      case 'client':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const isNavActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const navLinkClass = (to, exact) => {
    const active = isNavActive(to, exact);
    return [
      'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      active
        ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100'
        : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-700',
    ].join(' ');
  };

  const displayName = user?.first_name || user?.username || 'Utilisateur';
  const roleLabel = ROLE_LABELS[user?.type_utilisateur] || user?.type_utilisateur;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 lg:h-[4.25rem]">
          <AppBrand to="/" showSubtitle={false} className="min-w-0 shrink" />

          <nav
            className="hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Navigation principale"
          >
            {NAV_LINKS.map(({ to, label, exact, icon: Icon }) => (
              <Link key={to} to={to} className={navLinkClass(to, exact)}>
                <Icon className="h-4 w-4 opacity-70" aria-hidden />
                {label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link to={getDashboardLink()} className={navLinkClass(getDashboardLink(), false)}>
                <FiLayout className="h-4 w-4 opacity-70" aria-hidden />
                Mon espace
              </Link>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {isAuthenticated ? (
              <>
                <NotificationBell variant="header" />
                <div className="relative hidden md:block" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex max-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-1.5 pr-2.5 transition hover:border-indigo-200 hover:bg-indigo-50/50"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="menu"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-semibold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                      <span
                        className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getUserRoleColor()}`}
                      >
                        {getUserRoleIcon()}
                        {roleLabel}
                      </span>
                    </div>
                    <FiChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                      role="menu"
                    >
                      <Link
                        to={getDashboardLink()}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiLayout className="h-4 w-4 text-slate-400" />
                        Tableau de bord
                      </Link>
                      <Link
                        to={getProfileLink()}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiUser className="h-4 w-4 text-slate-400" />
                        Mon profil
                      </Link>
                      <hr className="my-1 border-slate-100" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        role="menuitem"
                      >
                        <FiLogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FiLogIn className="h-4 w-4" aria-hidden />
                  Connexion
                </Link>
                <div className="relative" ref={registerMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsRegisterMenuOpen(!isRegisterMenuOpen)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    aria-expanded={isRegisterMenuOpen}
                    aria-haspopup="menu"
                  >
                    S&apos;inscrire
                    <FiChevronDown
                      className={`h-4 w-4 transition-transform ${isRegisterMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  {isRegisterMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                      role="menu"
                    >
                      <Link
                        to="/register?type=client"
                        className="flex items-start gap-3 px-4 py-3 hover:bg-indigo-50"
                        role="menuitem"
                        onClick={() => setIsRegisterMenuOpen(false)}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                          <FiUsers className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">J&apos;ai un besoin</span>
                          <span className="mt-0.5 block text-xs text-slate-500">Compte client</span>
                        </span>
                      </Link>
                      <Link
                        to="/register?type=fournisseur"
                        className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50"
                        role="menuitem"
                        onClick={() => setIsRegisterMenuOpen(false)}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <FiBriefcase className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">Je propose un service</span>
                          <span className="mt-0.5 block text-xs text-slate-500">Compte fournisseur</span>
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 py-4 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
              {NAV_LINKS.map(({ to, label, exact, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={navLinkClass(to, exact)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  to={getDashboardLink()}
                  className={navLinkClass(getDashboardLink(), false)}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FiLayout className="h-4 w-4" aria-hidden />
                  Mon espace
                </Link>
              )}
            </nav>

            {!isAuthenticated && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rejoindre {APP_NAME}
                </p>
                <Link
                  to="/register?type=client"
                  className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <FiUsers className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-indigo-900">J&apos;ai un besoin</span>
                    <span className="text-xs text-indigo-700/80">Créer un compte client</span>
                  </span>
                </Link>
                <Link
                  to="/register?type=fournisseur"
                  className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <FiBriefcase className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-emerald-900">Je propose un service</span>
                    <span className="text-xs text-emerald-800/80">Créer un compte fournisseur</span>
                  </span>
                </Link>
                <Link
                  to="/login"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-800"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FiLogIn className="h-4 w-4" />
                  Connexion
                </Link>
              </div>
            )}

            {isAuthenticated && (
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 md:hidden">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Mon compte</p>
                <p className="px-3 pb-2 text-sm font-medium text-slate-900">
                  {displayName}
                  <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getUserRoleColor()}`}>
                    {getUserRoleIcon()}
                    {roleLabel}
                  </span>
                </p>
                <Link
                  to={getProfileLink()}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FiUser className="h-4 w-4" />
                  Mon profil
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <FiLogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
