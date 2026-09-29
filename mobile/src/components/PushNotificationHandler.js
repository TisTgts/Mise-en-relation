import { useEffect, useRef } from 'react';
import { getNotificationData, getNotificationsModule } from '../services/pushNotifications';

const MAX_NAV_RETRIES = 25;

/**
 * Écoute les taps sur notifications et navigue vers Messages / MessageThread.
 * No-op dans Expo Go (push distant indisponible depuis SDK 53).
 */
export default function PushNotificationHandler({ navigationRef }) {
  const responseSub = useRef(null);

  useEffect(() => {
    const N = getNotificationsModule();
    if (!N) return undefined;

    let cancelled = false;
    const timers = [];

    const navigateWhenReady = (fn) => {
      let attempts = 0;
      const tryNav = () => {
        if (cancelled) return;
        if (!navigationRef?.isReady?.()) {
          if (attempts >= MAX_NAV_RETRIES) return;
          attempts += 1;
          timers.push(setTimeout(tryNav, 200));
          return;
        }
        fn();
      };
      tryNav();
    };

    const handle = (response) => {
      const data = getNotificationData(response);
      const transactionId = data.transactionId || data.transaction_id;
      const collaborationId = data.collaborationId || data.transactionId || data.transaction_id;

      navigateWhenReady(() => {
        if (cancelled) return;
        if (data.screen === 'CollaborationDetail' && collaborationId) {
          navigationRef.navigate('CollaborationDetail', {
            id: Number(collaborationId) || collaborationId,
          });
          return;
        }
        if (transactionId) {
          navigationRef.navigate('MessageThread', {
            transactionId: Number(transactionId) || transactionId,
          });
          return;
        }
        if (data.screen === 'Messages' || data.screen === 'MessagesTab') {
          navigationRef.navigate('Tabs', { screen: 'MessagesTab' });
        }
      });
    };

    responseSub.current = N.addNotificationResponseReceivedListener(handle);

    N.getLastNotificationResponseAsync().then((response) => {
      if (!cancelled && response) handle(response);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      responseSub.current?.remove?.();
    };
  }, [navigationRef]);

  return null;
}
