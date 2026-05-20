import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import AppBrand from '../AppBrand';
import AuthPageTabs from './AuthPageTabs';
import { APP_NAME, APP_INITIALS, APP_TAGLINE } from '../../config/branding';

/**
 * Mise en page login / inscription :
 * - panneau informatif à gauche sur grand écran
 * - formulaire connexion / inscription à droite (colonne large)
 */
const AuthLayout = ({
  badge,
  title,
  description,
  features = [],
  formTitle,
  formSubtitle,
  children,
  formMaxWidth = '',
  footerLink,
  alternateLink,
}) => {
  const bottomLink = alternateLink ?? footerLink;

  return (
    <div className="min-h-screen bg-slate-50 py-5 sm:py-8">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_15%_0%,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 py-1.5 pl-1.5 pr-3.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-600">
              <FiArrowLeft className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="hidden sm:inline">Retour à l&apos;accueil</span>
            <span className="sm:hidden">Accueil</span>
          </Link>
          <AppBrand to="/" size="sm" className="lg:hidden" />
        </header>

        <div className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-700 to-blue-800 px-4 py-4 text-white shadow-md lg:hidden">
          {badge && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200">{badge}</p>
          )}
          <p className="mt-1 text-base font-bold leading-snug">{title}</p>
          {description && <p className="mt-1 line-clamp-2 text-xs text-indigo-100">{description}</p>}
        </div>

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-start lg:gap-5 xl:gap-6">
          <aside className="relative order-2 hidden flex-col gap-5 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 p-6 text-white shadow-lg lg:order-1 lg:flex lg:sticky lg:top-6 xl:p-7">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" aria-hidden />

            <div className="relative">
              <Link to="/" className="inline-flex items-center gap-2.5 transition hover:opacity-90">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-xs font-bold ring-1 ring-white/20">
                  {APP_INITIALS}
                </div>
                <div>
                  <p className="font-bold leading-tight">{APP_NAME}</p>
                  <p className="text-[11px] text-indigo-200">{APP_TAGLINE}</p>
                </div>
              </Link>
              {badge && (
                <p className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-100">
                  {badge}
                </p>
              )}
              <h2 className="mt-3 text-xl font-bold leading-tight xl:text-2xl">{title}</h2>
              {description && <p className="mt-2 text-sm leading-relaxed text-indigo-100/95">{description}</p>}
            </div>

            {features.length > 0 && (
              <ul className="relative space-y-2">
                {features.map(({ icon: Icon, title: ft, description: fd }) => (
                  <li key={ft} className="flex gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                    {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-200" aria-hidden />}
                    <div>
                      <p className="text-sm font-medium text-white">{ft}</p>
                      {fd && <p className="mt-0.5 text-xs text-indigo-100/85">{fd}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="relative mt-auto pt-2 text-[11px] text-indigo-200/75">
              © {new Date().getFullYear()} {APP_NAME}
            </p>
          </aside>

          <main className={`order-1 min-w-0 lg:order-2 ${formMaxWidth || 'w-full'}`}>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              {(formTitle || formSubtitle) && (
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-5 sm:px-7 sm:py-6">
                  {formTitle && (
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{formTitle}</h1>
                  )}
                  {formSubtitle && <p className="mt-1 text-sm text-slate-600">{formSubtitle}</p>}
                </div>
              )}

              <div className="px-5 py-6 sm:px-7 sm:py-7">
                <AuthPageTabs />
                {children}
              </div>

              {bottomLink && (
                <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 text-center sm:px-7">
                  {bottomLink}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
