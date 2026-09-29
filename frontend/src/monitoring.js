import React from 'react';
import * as Sentry from '@sentry/react';

// Inactif tant que REACT_APP_SENTRY_DSN n'est pas défini au moment du build.
export const initMonitoring = () => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    ignoreErrors: ['ResizeObserver loop', 'Network Error', 'Request aborted', 'Loading chunk'],
  });
};

const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Une erreur inattendue est survenue</h1>
      <p className="mt-3 text-sm text-slate-600">
        La page n&apos;a pas pu s&apos;afficher. Rechargez-la ; si le problème persiste, revenez à l&apos;accueil.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Recharger la page
        </button>
        <a
          href="/"
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  </div>
);

export const AppErrorBoundary = ({ children }) => (
  <Sentry.ErrorBoundary fallback={<ErrorFallback />}>{children}</Sentry.ErrorBoundary>
);
