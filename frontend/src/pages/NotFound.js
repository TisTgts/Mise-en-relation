import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBriefcase,
  FiCompass,
  FiFileText,
  FiHome,
  FiLayout,
  FiLogIn,
  FiMail,
  FiMessageSquare,
  FiUserPlus,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONTACT_EMAIL } from '../config/branding';
import { dashboardPathForRole } from '../utils/roles';

const suggestionsFor = (user, isAuthenticated) => {
  if (!isAuthenticated || !user) {
    return [
      { to: '/services', label: 'Découvrir nos services', hint: 'Les catégories et les prestataires disponibles', icon: FiCompass },
      { to: '/login', label: 'Se connecter', hint: 'Accéder à votre espace', icon: FiLogIn },
      { to: '/register', label: 'Créer un compte', hint: 'Client ou prestataire, c’est gratuit', icon: FiUserPlus },
    ];
  }
  const dashboard = {
    to: dashboardPathForRole(user.type_utilisateur),
    label: 'Mon tableau de bord',
    hint: 'Retrouver votre activité',
    icon: FiLayout,
  };
  if (user.type_utilisateur === 'client') {
    return [
      dashboard,
      { to: '/client/creer-besoin', label: 'Publier un besoin', hint: 'Trouver le bon prestataire', icon: FiFileText },
      { to: '/client/messages', label: 'Mes messages', hint: 'Échanger avec vos prestataires', icon: FiMessageSquare },
    ];
  }
  if (user.type_utilisateur === 'fournisseur') {
    return [
      dashboard,
      { to: '/fournisseur/creer-prestation', label: 'Publier une prestation', hint: 'Proposer vos services', icon: FiBriefcase },
      { to: '/fournisseur/messages', label: 'Mes messages', hint: 'Échanger avec vos clients', icon: FiMessageSquare },
    ];
  }
  return [dashboard, { to: '/services', label: 'Nos services', hint: 'Les catégories disponibles', icon: FiCompass }];
};

const NotFound = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const suggestions = suggestionsFor(user, isAuthenticated);
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:py-24">
        <p className="select-none bg-gradient-to-br from-indigo-500 to-indigo-700 bg-clip-text text-8xl font-extrabold tracking-tight text-transparent sm:text-9xl">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Cette page est introuvable</h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Le lien est peut-être incorrect, ou la page a été déplacée ou supprimée. Pas d&apos;inquiétude : voici
          de quoi retrouver votre chemin.
        </p>

        <p className="mt-4 max-w-full truncate rounded-full border border-slate-200 bg-white px-4 py-1.5 font-mono text-xs text-slate-500">
          {location.pathname}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <FiHome className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          {canGoBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <FiArrowLeft className="h-4 w-4" />
              Page précédente
            </button>
          )}
        </div>

        <div className="mt-12 w-full">
          <p className="text-sm font-medium text-slate-500">Vous cherchiez peut-être :</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {suggestions.map(({ to, label, hint, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
              >
                <span className="rounded-full bg-indigo-50 p-2.5 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-2 text-sm font-semibold text-slate-900">{label}</span>
                <span className="mt-0.5 text-xs text-slate-500">{hint}</span>
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          Le problème persiste ?{' '}
          <a
            href={`mailto:${APP_CONTACT_EMAIL}?subject=${encodeURIComponent(`Page introuvable : ${location.pathname}`)}`}
            className="inline-flex items-center gap-1 font-medium text-indigo-700 hover:underline"
          >
            <FiMail className="h-3.5 w-3.5" />
            Écrivez-nous
          </a>
        </p>
      </div>
    </section>
  );
};

export default NotFound;
