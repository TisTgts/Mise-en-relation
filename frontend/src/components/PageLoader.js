import React from 'react';

// Loader plein conteneur, style unifié pour toute l'application.
const PageLoader = ({ label, className = '', minHeight = 'min-h-[60vh]' }) => (
  <div className={`flex ${minHeight} flex-col items-center justify-center gap-3 ${className}`}>
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
    {label ? <p className="text-sm text-slate-500">{label}</p> : null}
  </div>
);

export default PageLoader;
