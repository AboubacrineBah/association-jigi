import { describe, expect, it } from 'vitest';
import { formatMoney, parseAmount, toInputAmount } from './money';

const plain = (text: string): string => text.replace(/[\u202F\u00A0]/g, ' ');

describe('formatMoney', () => {
  it('affiche le FCFA sans décimale', () => {
    expect(plain(formatMoney(25_000, 'XOF'))).toBe('25 000 FCFA');
  });
  it('affiche l’euro et le dollar avec deux décimales', () => {
    expect(plain(formatMoney(125_000, 'EUR'))).toBe('1 250,00 €');
    expect(plain(formatMoney(30_000, 'USD'))).toBe('300,00 $US');
  });
});

describe('parseAmount', () => {
  it('convertit une saisie en plus petite unité de la devise', () => {
    expect(parseAmount('25 000', 'XOF')).toBe(25_000);
    expect(parseAmount('1 250,50', 'EUR')).toBe(125_050);
    expect(parseAmount('300', 'USD')).toBe(30_000);
  });
  it('refuse les saisies invalides ou trop précises', () => {
    expect(parseAmount('abc', 'XOF')).toBeNull();
    expect(parseAmount('12,5', 'XOF')).toBeNull();
    expect(parseAmount('10,123', 'EUR')).toBeNull();
    expect(parseAmount('', 'EUR')).toBeNull();
  });
});

describe('toInputAmount', () => {
  it('produit une valeur éditable relisible par parseAmount', () => {
    expect(toInputAmount(125_050, 'EUR')).toBe('1250,50');
    expect(parseAmount(toInputAmount(125_050, 'EUR'), 'EUR')).toBe(125_050);
    expect(toInputAmount(25_000, 'XOF')).toBe('25000');
  });
});
