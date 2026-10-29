import type { DonsApi } from '../types';
import { createHttpApi } from './http';
import { createMockApi } from './mockApi';

/**
 * Sans `VITE_API_URL`, l'application utilise l'API fictive en mémoire (mode démonstration).
 * Avec `VITE_API_URL`, elle appelle l'API Laravel.
 */
export function createDefaultApi(): DonsApi {
  const url = import.meta.env.VITE_API_URL;
  if (url) return createHttpApi(url.replace(/\/$/, ''));
  const latency = Number.parseInt(import.meta.env.VITE_MOCK_LATENCY_MS ?? '250', 10);
  return createMockApi({ latency: Number.isNaN(latency) ? 250 : latency });
}

export const IS_MOCK_API = !import.meta.env.VITE_API_URL;
