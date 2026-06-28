import React from 'react';
import MessagesInbox from '../../../components/messaging/MessagesInbox';

const MesMessages = () => (
  <MessagesInbox
    title="Messagerie"
    subtitle="Échangez avec vos clients, par prestation et transaction."
    transactionBasePath="/fournisseur/transactions"
    expectedUserType="fournisseur"
  />
);

export default MesMessages;
