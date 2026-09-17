import { useEffect, useRef } from 'react';
import { getNotificationData, getNotificationsModule } from '../services/pushNotifications';

/**
 * Écoute les taps sur notifications et navigue vers Messages / MessageThread.
 * No-op dans Expo Go (push distant indisponible depuis SDK 53).
 */
export default function PushNotificationHandler({ navigationRef }) {
  const responseSub = useRef(null);

  useEffect(() => {
    const N = getNotificationsModule();
    if (!N) return undefined;

    const navigateWhenReady = (fn) => {
      const tryNav = () => {
        if (!navigationRef?.isReady?.()) {
          setTimeout(tryNav, 200);
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
      if (response) handle(response);
    });

    return () => {
      responseSub.current?.remove?.();
    };
  }, [navigationRef]);

  return null;
}
