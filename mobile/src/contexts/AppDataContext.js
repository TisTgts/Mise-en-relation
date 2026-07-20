import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { fetchMessages, fetchTransactions } from '../services/dataService';
import { getUserId } from '../utils/messageThreads';

const AppDataContext = createContext({
  unreadMessages: 0,
  collabActions: 0,
  refreshAppData: () => {},
});

function countCollabActions(transactions, role) {
  if (role === 'fournisseur') {
    return transactions.filter(
      (t) =>
        t.statut !== 'terminee' &&
        t.statut !== 'annulee' &&
        ['a_proposer', 'rejete_client'].includes(t.devis_statut)
    ).length;
  }
  return transactions.filter(
    (t) =>
      t.statut !== 'terminee' &&
      t.statut !== 'annulee' &&
      t.devis_statut === 'en_attente_client'
  ).length;
}

export function AppDataProvider({ children }) {
  const { isAuthenticated, user, type_utilisateur } = useAuth();
  const role = type_utilisateur === 'fournisseur' ? 'fournisseur' : 'client';
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [collabActions, setCollabActions] = useState(0);

  const refreshAppData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUnreadMessages(0);
      setCollabActions(0);
      return;
    }
    try {
      const [messages, transactions] = await Promise.all([
        fetchMessages(),
        fetchTransactions(),
      ]);
      const unread = messages.filter(
        (m) => getUserId(m.destinataire) === user.id && !m.lu
      ).length;
      setUnreadMessages(unread);
      setCollabActions(countCollabActions(transactions, role));
    } catch {
      /* badges non bloquants */
    }
  }, [isAuthenticated, user?.id, role]);

  useEffect(() => {
    refreshAppData();
    const interval = setInterval(refreshAppData, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAppData();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [refreshAppData]);

  return (
    <AppDataContext.Provider value={{ unreadMessages, collabActions, refreshAppData }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
