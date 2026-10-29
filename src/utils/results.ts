import type { ApiError, Result } from '../types';

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(status: number, message: string, fieldErrors?: Record<string, string[]>): Result<T> {
  const error: ApiError = fieldErrors ? { status, message, fieldErrors } : { status, message };
  return { ok: false, error };
}

/** Combine plusieurs résultats : la première erreur rencontrée l'emporte. */
export function joinResults<T extends readonly unknown[]>(results: { [K in keyof T]: Result<T[K]> }): Result<T> {
  const data: unknown[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    data.push(result.data);
  }
  return ok(data as unknown as T);
}
