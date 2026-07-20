import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { fetchMessages } from '../services/dataService';
import { scheduleLocalNotification } from '../services/pushNotifications';
import { getUserId } from '../utils/messageThreads';

const POLL_MS = 90_000;

export default function MessageNotificationWatcher() {
  const { user, isAuthenticated } = useAuth();
  const { refreshAppData } = useAppData();
  const lastUnread = useRef(0);
  const initialized = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      lastUnread.current = 0;
      initialized.current = false;
      return undefined;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const msgs = await fetchMessages();
        const unread = msgs.filter(
          (m) => getUserId(m.destinataire) === user.id && !m.lu
        ).length;

        if (cancelled) return;

        if (
          initialized.current &&
          unread > lastUnread.current &&
          appState.current !== 'active'
        ) {
          const delta = unread - lastUnread.current;
          await scheduleLocalNotification({
            title: 'Nouveau message',
            body:
              delta === 1
                ? 'Vous avez reçu un nouveau message.'
                : `Vous avez ${delta} nouveaux messages.`,
            data: { screen: 'Messages' },
          });
        }

        lastUnread.current = unread;
        initialized.current = true;
        refreshAppData();
      } catch {
        /* polling silencieux */
      }
    };

    check();
    const interval = setInterval(check, POLL_MS);
    const subscription = AppState.addEventListener('change', (next) => {
      appState.current = next;
      if (next === 'active') {
        check();
      }
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, [isAuthenticated, user?.id, refreshAppData]);

  return null;
}
