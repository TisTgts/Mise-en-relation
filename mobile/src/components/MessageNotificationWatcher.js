import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { fetchMessages } from '../services/dataService';
import { scheduleLocalNotification, canUseNotifications } from '../services/pushNotifications';
import { getUserId } from '../utils/messageThreads';

const POLL_MS = 90_000;

/** Corps générique — jamais le contenu du message (données sensibles). */
function buildBody(delta) {
  if (delta === 1) return 'Vous avez reçu un nouveau message.';
  return `Vous avez ${delta} nouveaux messages.`;
}

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
    const notifyEnabled = canUseNotifications();

    const check = async () => {
      try {
        const msgs = await fetchMessages();
        const unreadList = msgs.filter(
          (m) => getUserId(m.destinataire) === user.id && !m.lu
        );
        const unread = unreadList.length;

        if (cancelled) return;

        if (
          notifyEnabled &&
          initialized.current &&
          unread > lastUnread.current &&
          appState.current !== 'active'
        ) {
          const delta = unread - lastUnread.current;
          const newest = unreadList
            .slice()
            .sort(
              (a, b) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
            )[0];
          const transactionId =
            newest?.transaction ||
            newest?.transaction_id ||
            newest?.transactionId ||
            null;

          await scheduleLocalNotification({
            title: 'Nouveau message',
            body: buildBody(delta),
            data: transactionId
              ? { screen: 'MessageThread', transactionId }
              : { screen: 'Messages' },
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
    const onAppStateChange = (next) => {
      appState.current = next;
      if (next === 'active') {
        check();
      }
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [isAuthenticated, user?.id, refreshAppData]);

  return null;
}
