import { useCallback, useEffect, useState } from 'react';
import type { ApiError, Result } from '../types';

export type ResourceState<T> = { status: 'loading' } | { status: 'error'; error: ApiError } | { status: 'ready'; data: T };

export interface Resource<T> {
  state: ResourceState<T>;
  reload: () => void;
}

/**
 * Charge une ressource via un appel API (qui retourne un `Result` typé).
 * `load` doit être stable (useCallback) : il relance le chargement quand il change.
 */
export function useResource<T>(load: () => Promise<Result<T>>): Resource<T> {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      try {
        const result = await load();
        if (cancelled) return;
        setState(result.ok ? { status: 'ready', data: result.data } : { status: 'error', error: result.error });
      } catch {
        // Filet de sécurité : l'API ne lève pas d'exception, mais une erreur inattendue ne doit pas figer l'écran.
        if (!cancelled) setState({ status: 'error', error: { status: 0, message: 'Une erreur inattendue est survenue.' } });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  return { state, reload };
}
