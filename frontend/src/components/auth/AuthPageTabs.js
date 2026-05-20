import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/login', label: 'Connexion' },
  { to: '/register', label: 'Inscription' },
];

const AuthPageTabs = () => {
  const { pathname } = useLocation();

  return (
    <nav className="mb-5 flex rounded-lg bg-slate-100 p-1" aria-label="Connexion ou inscription">
      {TABS.map(({ to, label }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition ${
              active
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default AuthPageTabs;
