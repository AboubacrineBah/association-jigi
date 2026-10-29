import { z } from 'zod';

/** Valeurs brutes d'un formulaire : tous les champs HTML sont des chaînes. */
export type FormValues = Record<string, string>;

/** Schéma Zod à partir d'un dictionnaire de libellés (source unique des valeurs autorisées). */
export function enumOf<K extends string>(labels: Record<K, string>) {
  return z.enum(Object.keys(labels) as [K, ...K[]]);
}

export const requiredText = (message: string) => z.string().trim().min(1, message);

export const requiredId = (message: string) =>
  z
    .string()
    .min(1, message)
    .transform((value) => Number(value))
    .pipe(z.number().int(message).positive(message));

/** Liste déroulante facultative : la valeur vide devient `null`. */
export const optionalId = z.string().transform((value): number | null => (value === '' ? null : Number(value)));

export const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide');

export const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === '' || z.string().email().safeParse(value).success, 'Adresse e-mail invalide');
