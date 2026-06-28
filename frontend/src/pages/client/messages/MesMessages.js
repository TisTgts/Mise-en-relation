import React from 'react';
import MessagesInbox from '../../../components/messaging/MessagesInbox';

const MesMessages = () => (
  <MessagesInbox
    title="Messagerie"
    subtitle="Échangez avec les fournisseurs, par besoin et transaction."
    transactionBasePath="/client/transactions"
    expectedUserType="client"
  />
);

export default MesMessages;