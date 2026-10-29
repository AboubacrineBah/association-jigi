import { CURRENCY_META } from '../config/constants';
import type { Currency, MinorAmount } from '../types';

/** Affiche un montant au format français, ex. « 25 000 FCFA », « 1 250,00 € », « 300,00 $US ». */
export function formatMoney(amount: MinorAmount, currency: Currency): string {
  const { digits, label } = CURRENCY_META[currency];
  const number = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount / 10 ** digits);
  return `${number}\u00A0${label}`;
}

/**
 * Convertit une saisie utilisateur (« 25 000 », « 1 250,50 ») en entier dans la plus petite
 * unité de la devise. Retourne `null` si la saisie est invalide ou a trop de décimales.
 */
export function parseAmount(text: string, currency: Currency): MinorAmount | null {
  const cleaned = text.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const { digits } = CURRENCY_META[currency];
  const decimals = cleaned.split('.')[1]?.length ?? 0;
  if (decimals > digits) return null;
  return Math.round(Number(cleaned) * 10 ** digits);
}

/** Valeur éditable d'un montant (sans séparateur de milliers), ex. « 1250,50 ». */
export function toInputAmount(amount: MinorAmount, currency: Currency): string {
  const { digits } = CURRENCY_META[currency];
  return (amount / 10 ** digits).toFixed(digits).replace('.', ',');
}
