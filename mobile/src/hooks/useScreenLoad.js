import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { extractErrorMessage } from '../services/authService';

/**
 * Gère le chargement initial vs refresh sans masquer le contenu existant.
 * @param {() => Promise<void>} loader
 * @param {unknown[]} deps
 */
export function useScreenLoad(loader, deps = []) {
  const hasLoaded = useRef(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (mode = 'initial') => {
      if (mode === 'refresh') {
        setRefreshing(true);
      } else if (!hasLoaded.current) {
        setInitialLoading(true);
      }
      setError(null);
      try {
        await loader();
        hasLoaded.current = true;
      } catch (e) {
        setError(extractErrorMessage(e, 'Chargement impossible'));
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useFocusEffect(
    useCallback(() => {
      run(hasLoaded.current ? 'refresh' : 'initial');
    }, [run])
  );

  return {
    initialLoading: initialLoading && !hasLoaded.current,
    refreshing,
    error,
    retry: () => run('initial'),
    refresh: () => run('refresh'),
  };
}
