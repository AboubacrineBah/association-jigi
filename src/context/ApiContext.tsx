import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { DonsApi } from '../types';

const ApiContext = createContext<DonsApi | null>(null);

interface ApiProviderProps {
  api: DonsApi;
  children: ReactNode;
}

/** Fournit l'API à l'application ; les tests y injectent l'API fictive. */
export function ApiProvider({ api, children }: ApiProviderProps) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): DonsApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi doit être utilisé à l’intérieur d’un <ApiProvider>.');
  return api;
}
