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
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(async (mode = 'initial', isCancelled = () => false) => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else if (!hasLoaded.current) {
      setInitialLoading(true);
    }
    setError(null);
    try {
      await loaderRef.current();
      if (isCancelled()) return;
      hasLoaded.current = true;
    } catch (e) {
      if (isCancelled()) return;
      setError(extractErrorMessage(e, 'Chargement impossible'));
    } finally {
      if (!isCancelled()) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      run(hasLoaded.current ? 'refresh' : 'initial', () => cancelled);
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run, ...deps])
  );

  return {
    initialLoading: initialLoading && !hasLoaded.current,
    refreshing,
    error,
    retry: () => run('initial'),
    refresh: () => run('refresh'),
  };
}
