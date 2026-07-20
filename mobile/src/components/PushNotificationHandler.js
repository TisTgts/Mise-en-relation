import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { getNotificationData } from '../services/pushNotifications';

/**
 * Écoute les taps sur notifications et navigue vers Messages / MessageThread.
 * navigationRef : ref React Navigation (createNavigationContainerRef).
 */
export default function PushNotificationHandler({ navigationRef }) {
  const responseSub = useRef(null);

  useEffect(() => {
    const handle = (response) => {
      const data = getNotificationData(response);
      if (!navigationRef?.isReady?.()) return;

      const transactionId = data.transactionId || data.transaction_id;
      if (transactionId) {
        navigationRef.navigate('MessageThread', {
          transactionId: Number(transactionId) || transactionId,
        });
        return;
      }
      if (data.screen === 'Messages' || data.screen === 'MessagesTab') {
        navigationRef.navigate('Tabs', { screen: 'MessagesTab' });
      }
    };

    responseSub.current = Notifications.addNotificationResponseReceivedListener(handle);

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handle(response);
    });

    return () => {
      responseSub.current?.remove?.();
    };
  }, [navigationRef]);

  return null;
}
