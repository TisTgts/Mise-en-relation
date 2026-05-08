import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { buildNotificationItems, loadNotificationsData } from '../services/notificationsService';

export const NOTIFICATIONS_REFRESH_EVENT = 'app:notifications-refresh';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || authLoading || !user?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { messages, transactions } = await loadNotificationsData(user);
      setItems(buildNotificationItems(user, messages, transactions));
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, authLoading]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setInterval(() => {
      if (isAuthenticated && user?.id && !authLoading) refresh();
    }, 120000);
    return () => clearInterval(t);
  }, [refresh, isAuthenticated, user?.id, authLoading]);

  useEffect(() => {
    const onFocus = () => {
      if (isAuthenticated && user?.id) refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh, isAuthenticated, user?.id]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, handler);
  }, [refresh]);

  const value = useMemo(
    () => ({
      items,
      totalCount: items.length,
      loading,
      refresh,
    }),
    [items, loading, refresh]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return ctx;
}

export function requestNotificationsRefresh() {
  window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
}
