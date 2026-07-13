import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Cloche + panneau : données issues du NotificationProvider (messages non lus, actions transactions).
 */
const dashboardFallback = (role) => {
  switch (role) {
    case 'super_admin':
      return '/super-admin/dashboard';
    case 'administrateur':
      return '/admin/dashboard';
    case 'fournisseur':
      return '/fournisseur/dashboard';
    case 'client':
    default:
      return '/client/dashboard';
  }
};

const NotificationBell = ({ variant = 'dashboard' }) => {
  const { user } = useAuth();
  const { items, totalCount, loading, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const badge = totalCount > 99 ? '99+' : String(totalCount);
  const hubHref = useMemo(() => {
    const msg = items.find((i) => i.kind === 'messages');
    if (msg?.href) return msg.href;
    if (items[0]?.href) return items[0].href;
    return dashboardFallback(user?.type_utilisateur);
  }, [items, user?.type_utilisateur]);

  const btnTone =
    variant === 'header'
      ? 'text-gray-600 hover:text-gray-900'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 ${btnTone}`}
        aria-label="Notifications"
      >
        <FiBell className="h-5 w-5" />
        {totalCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white py-2 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <span className="text-xs text-gray-500">
              {loading ? '…' : `${totalCount} à traiter`}
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                Rien à signaler pour le moment.
              </p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dotClass || 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{item.subtitle}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2">
            <button
              type="button"
              onClick={() => refresh()}
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Actualiser
            </button>
            <Link
              to={hubHref}
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Ouvrir
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
