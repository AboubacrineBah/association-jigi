import { describe, expect, it } from 'vitest';
import type { AllocationInput } from '../types';
import { createMockApi } from './mockApi';
import { DEMO_PASSWORD } from './seed';

async function apiAs(email: string) {
  const api = createMockApi();
  const session = await api.login({ email, password: DEMO_PASSWORD });
  if (!session.ok) throw new Error(session.error.message);
  return api;
}

const hugeAllocation: AllocationInput = {
  kind: 'depense', beneficiaryId: null, campaignId: null, amount: 999_999_999, currency: 'USD', date: '2026-10-10', category: 'autre', description: '',
};

describe('API fictive — authentification', () => {
  it('refuse un mot de passe incorrect', async () => {
    const result = await createMockApi().login({ email: 'admin@demo.jigi', password: 'faux' });
    expect(result).toMatchObject({ ok: false, error: { status: 401 } });
  });
  it('refuse un compte désactivé', async () => {
    const result = await createMockApi().login({ email: 'boubacar@demo.jigi', password: DEMO_PASSWORD });
    expect(result).toMatchObject({ ok: false, error: { status: 403 } });
  });
  it('exige une session pour lire les données', async () => {
    const result = await createMockApi().donations.list();
    expect(result).toMatchObject({ ok: false, error: { status: 401 } });
  });
});

describe('API fictive — droits par rôle', () => {
  it('interdit la modification au lecteur', async () => {
    const api = await apiAs('lecteur@demo.jigi');
    expect((await api.donations.list()).ok).toBe(true);
    expect(await api.donations.remove(1)).toMatchObject({ ok: false, error: { status: 403 } });
  });
  it('réserve la gestion des utilisateurs à l’administrateur', async () => {
    expect(await (await apiAs('gestionnaire@demo.jigi')).users.list()).toMatchObject({ ok: false, error: { status: 403 } });
    expect((await (await apiAs('admin@demo.jigi')).users.list()).ok).toBe(true);
  });
});

describe('API fictive — isolation des donateurs', () => {
  it('ne renvoie au donateur que ses propres dons', async () => {
    const api = await apiAs('donateur@demo.jigi');
    const result = await api.myDonations();
    if (!result.ok) throw new Error(result.error.message);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((donation) => donation.donorId === 1)).toBe(true);
  });
  it('interdit au donateur la liste complète des dons et les statistiques', async () => {
    const api = await apiAs('donateur@demo.jigi');
    expect(await api.donations.list()).toMatchObject({ ok: false, error: { status: 403 } });
    expect(await api.stats()).toMatchObject({ ok: false, error: { status: 403 } });
  });
});

describe('API fictive — contrôle du solde', () => {
  it('refuse une utilisation supérieure au solde disponible de la devise', async () => {
    const result = await (await apiAs('gestionnaire@demo.jigi')).allocations.create(hugeAllocation);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.status).toBe(422);
      expect(result.error.message).toContain('dépasse le solde disponible en USD');
    }
  });
  it('accepte une utilisation dans la limite du solde', async () => {
    const api = await apiAs('gestionnaire@demo.jigi');
    const result = await api.allocations.create({ ...hugeAllocation, amount: 1_000 });
    expect(result.ok).toBe(true);
  });
  it('empêche de supprimer un donateur qui a des dons', async () => {
    const result = await (await apiAs('gestionnaire@demo.jigi')).donors.remove(1);
    expect(result).toMatchObject({ ok: false, error: { status: 409 } });
  });
});
