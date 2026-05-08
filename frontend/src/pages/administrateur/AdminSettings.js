import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronLeft,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiGrid,
  FiBarChart,
  FiSearch,
  FiMessageSquare,
  FiSettings,
  FiExternalLink,
} from 'react-icons/fi';

const LINKS = [
  { to: '/admin/dashboard', label: 'Tableau de bord', sub: 'Indicateurs et matching', icon: FiSettings, tone: 'indigo' },
  { to: '/admin/users', label: 'Utilisateurs', sub: 'Comptes et statuts', icon: FiUsers, tone: 'blue' },
  { to: '/admin/prestations', label: 'Prestations', sub: 'Offres fournisseurs', icon: FiBriefcase, tone: 'emerald' },
  { to: '/admin/besoins', label: 'Besoins', sub: 'Demandes clients', icon: FiFileText, tone: 'violet' },
  { to: '/admin/categories', label: 'Catégories', sub: 'Taxonomie', icon: FiGrid, tone: 'amber' },
  { to: '/admin/transactions', label: 'Transactions', sub: 'Flux et montants', icon: FiBarChart, tone: 'sky' },
  { to: '/admin/correspondances', label: 'Correspondances', sub: 'Matching par besoin', icon: FiSearch, tone: 'slate' },
  { to: '/admin/messages', label: 'Messages', sub: 'Messagerie globale', icon: FiMessageSquare, tone: 'teal' },
];

const ring = {
  blue: 'ring-blue-100 hover:bg-blue-50/80',
  emerald: 'ring-emerald-100 hover:bg-emerald-50/80',
  violet: 'ring-violet-100 hover:bg-violet-50/80',
  amber: 'ring-amber-100 hover:bg-amber-50/80',
  sky: 'ring-sky-100 hover:bg-sky-50/80',
  indigo: 'ring-indigo-100 hover:bg-indigo-50/80',
  teal: 'ring-teal-100 hover:bg-teal-50/80',
  slate: 'ring-slate-200 hover:bg-slate-50',
};

const iconBg = {
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  teal: 'bg-teal-100 text-teal-700',
  slate: 'bg-slate-100 text-slate-700',
};

const AdminSettings = () => {
  const apiUrl = process.env.REACT_APP_API_URL || '/api';

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <FiChevronLeft className="h-4 w-4" />
          Tableau de bord
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres et accès rapide</h1>
        <p className="mt-2 text-sm text-slate-600">
          Cette page centralise les liens vers les modules d’administration. La configuration métier (poids du matching,
          données sensibles) se fait côté backend ou interface Django admin selon votre déploiement.
        </p>
        <dl className="mt-6 grid gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-700">URL API front (REACT_APP_API_URL)</dt>
            <dd className="mt-1 font-mono text-xs text-slate-600 break-all">{apiUrl}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-700">Raccourcis tableau de bord</dt>
            <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <Link className="text-indigo-600 hover:underline" to="/admin/dashboard">
                Vue d’ensemble
              </Link>
              <Link className="text-indigo-600 hover:underline" to="/admin/dashboard?tab=matching">
                Matching
              </Link>
              <Link className="text-indigo-600 hover:underline" to="/admin/dashboard?tab=shortcuts">
                Navigation
              </Link>
            </dd>
          </div>
        </dl>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Modules administration</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-transparent transition ${ring[item.tone]}`}
            >
              <span className={`rounded-lg p-2.5 ${iconBg[item.tone]}`}>
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold text-slate-900">
                  {item.label}
                  <FiExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                </span>
                <span className="mt-0.5 block text-sm text-slate-600">{item.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
