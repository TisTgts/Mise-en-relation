import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_INITIALS, APP_TAGLINE } from '../config/branding';

/**
 * Logo + nom de l'application (affichage unifié Header / SideBar / TopBar).
 */
const AppBrand = ({
  to,
  subtitle,
  showSubtitle = true,
  size = 'md',
  className = '',
  textClassName = '',
}) => {
  const iconBox =
    size === 'sm'
      ? 'h-8 w-8 rounded-lg text-xs'
      : 'h-9 w-9 rounded-xl text-sm';
  const titleClass =
    size === 'sm'
      ? 'text-base font-bold leading-tight'
      : 'text-lg font-bold tracking-tight leading-tight';

  const line2 = subtitle ?? APP_TAGLINE;

  const content = (
    <div className={`flex min-w-0 items-center gap-2.5 sm:gap-3 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-primary-600 to-primary-700 font-bold text-white shadow-sm ${iconBox}`}
        aria-hidden
      >
        {APP_INITIALS}
      </div>
      <div className={`min-w-0 flex-1 ${textClassName}`}>
        <p className={`truncate text-slate-900 ${titleClass}`}>{APP_NAME}</p>
        {showSubtitle && line2 ? (
          <p className="truncate text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">
            {line2}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block min-w-0 rounded-lg transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default AppBrand;
