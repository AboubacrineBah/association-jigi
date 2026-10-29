import type { ApiError, Crud, DonsApi, Result, Session, Stats, User } from '../types';
import { fail, ok } from '../utils/results';

const NETWORK_MESSAGE = 'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Laravel peut envelopper la réponse dans `{ data: … }` (API Resources) : on la déballe. */
function unwrap(payload: unknown): unknown {
  return isRecord(payload) && 'data' in payload ? payload.data : payload;
}

function toApiError(status: number, payload: unknown): ApiError {
  const message = isRecord(payload) && typeof payload.message === 'string' ? payload.message : `Erreur du serveur (${status}).`;
  const fieldErrors: Record<string, string[]> = {};
  if (isRecord(payload) && isRecord(payload.errors)) {
    for (const [field, messages] of Object.entries(payload.errors)) {
      if (Array.isArray(messages)) fieldErrors[field] = messages.filter((item): item is string => typeof item === 'string');
    }
  }
  return Object.keys(fieldErrors).length > 0 ? { status, message, fieldErrors } : { status, message };
}

/**
 * Client de l'API Laravel (contrat : cahier des charges 6.3).
 * Hypothèse : le JSON est en camelCase (adapter ici si l'API renvoie du snake_case).
 */
export function createHttpApi(baseUrl: string): DonsApi {
  let token: string | null = null;

  async function request<T>(method: string, path: string, body?: unknown): Promise<Result<T>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) return { ok: false, error: toApiError(response.status, payload) };
      return ok(unwrap(payload) as T);
    } catch {
      return fail(0, NETWORK_MESSAGE);
    }
  }

  function crud<T, I>(resource: string): Crud<T, I> {
    return {
      list: () => request<T[]>('GET', `/api/${resource}`),
      create: (input) => request<T>('POST', `/api/${resource}`, input),
      update: (id, input) => request<T>('PUT', `/api/${resource}/${id}`, input),
      remove: (id) => request<null>('DELETE', `/api/${resource}/${id}`),
    };
  }

  return {
    setToken(value) {
      token = value;
    },
    async login(credentials) {
      const result = await request<Session>('POST', '/api/auth/login', credentials);
      if (result.ok) token = result.data.token;
      return result;
    },
    async logout() {
      const result = await request<null>('POST', '/api/auth/logout');
      token = null;
      return result;
    },
    me: () => request<User>('GET', '/api/me'),
    donations: crud('donations'),
    myDonations: () => request('GET', '/api/me/donations'),
    donors: crud('donors'),
    campaigns: crud('campaigns'),
    allocations: crud('allocations'),
    beneficiaries: crud('beneficiaries'),
    users: crud('users'),
    stats: () => request<Stats>('GET', '/api/stats/summary'),
  };
}
