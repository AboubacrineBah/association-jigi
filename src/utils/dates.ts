import { format, parseISO } from 'date-fns';
import type { IsoDate } from '../types';

/** `2026-10-24` → `24/10/2026`. */
export function formatDate(iso: IsoDate): string {
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function toIsoDate(date: Date): IsoDate {
  return format(date, 'yyyy-MM-dd');
}

/** `2026-10` → « oct. » (libellé court pour les graphiques). */
export function shortMonthLabel(month: string): string {
  const label = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(parseISO(`${month}-01`));
  return label;
}
