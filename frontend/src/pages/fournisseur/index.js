export { default as FournisseurDashboard } from './FournisseurDashboard';
export { default as PrestationCreate } from './prestation/PrestationCreate';
/** @deprecated utiliser PrestationCreate */
export { default as CreerPrestation } from './prestation/PrestationCreate';
export { default as PrestationDetail } from './prestation/PrestationDetail';
export { default as PrestationEdit } from './prestation/PrestationEdit';
/** @deprecated utiliser PrestationEdit */
export { default as ModifierPrestation } from './prestation/PrestationEdit';
export { default as MesPrestations } from './prestation/MesPrestations';
export { default as MesTransactions } from './transactions/MesTransactions';
/** Détail transaction côté fournisseur (distinct du composant client homonyme) */
export { default as FournisseurTransactionDetail } from './transactions/TransactionDetail';
export { default as MonProfil } from './profil/MonProfil';
export { default as MesMessages } from './messages/MesMessages';
export { default as MesCollaborations } from './collaborations/MesCollaborations';
export { default as FournisseurCollaborationWorkspace } from './collaborations/CollaborationWorkspace';
