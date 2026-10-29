import { describe, expect, it } from 'vitest';
import type { Allocation, Donation } from '../types';
import { availableBalance, computeTotals } from './stats';

const donation = (id: number, amount: number, currency: Donation['currency'], status: Donation['status']): Donation => ({
  id, donorId: 1, campaignId: null, amount, currency, date: '2026-10-01', paymentMode: 'virement', status, reference: '', note: '',
});
const allocation = (id: number, amount: number, currency: Allocation['currency']): Allocation => ({
  id, kind: 'depense', beneficiaryId: null, campaignId: null, amount, currency, date: '2026-10-02', category: 'autre', description: '',
});

const donations = [donation(1, 100_000, 'XOF', 'recu'), donation(2, 50_000, 'XOF', 'promis'), donation(3, 70_000, 'XOF', 'annule'), donation(4, 20_000, 'EUR', 'recu')];
const allocations = [allocation(1, 30_000, 'XOF'), allocation(2, 5_000, 'EUR')];

describe('computeTotals', () => {
  it('ne compte que les dons reçus (promis et annulés exclus)', () => {
    const xof = computeTotals(donations, allocations).find((total) => total.currency === 'XOF');
    expect(xof).toMatchObject({ collected: 100_000, used: 30_000, balance: 70_000, donationCount: 1 });
  });
  it('garde les devises séparées', () => {
    const totals = computeTotals(donations, allocations);
    expect(totals.map((total) => total.currency)).toEqual(['XOF', 'USD', 'EUR']);
    expect(totals.find((total) => total.currency === 'EUR')?.balance).toBe(15_000);
    expect(totals.find((total) => total.currency === 'USD')?.balance).toBe(0);
  });
});

describe('availableBalance', () => {
  it('ignore l’utilisation en cours de modification', () => {
    expect(availableBalance(donations, allocations, 'XOF')).toBe(70_000);
    expect(availableBalance(donations, allocations, 'XOF', 1)).toBe(100_000);
  });
});
