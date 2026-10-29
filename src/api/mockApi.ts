import { CURRENCY_META, STAFF_ROLES, WRITER_ROLES } from '../config/constants';
import type {
  Allocation,
  AllocationInput,
  Beneficiary,
  BeneficiaryInput,
  Campaign,
  CampaignInput,
  Crud,
  Credentials,
  Donation,
  DonationInput,
  DonorInput,
  Donor,
  DonsApi,
  Id,
  Result,
  Role,
  Session,
  Stats,
  User,
  UserInput,
} from '../types';
import { toIsoDate } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { fail, ok } from '../utils/results';
import { availableBalance, computeStats } from '../utils/stats';
import { buildSeed, DEMO_PASSWORD } from './seed';
import type { SeedData } from './seed';

export interface MockOptions {
  /** Latence simulée en millisecondes (0 par défaut, utile pour voir les états de chargement). */
  latency?: number;
  seed?: SeedData;
  today?: Date;
}

interface StoreConfig<T extends { id: Id }, I> {
  items: T[];
  readRoles: readonly Role[];
  writeRoles: readonly Role[];
  build(id: Id, input: I, previous?: T): T;
  /** Règle métier appliquée avant création ou modification. */
  validate?(input: I, previous?: T): Result<never> | null;
  /** Message de refus si l'élément est encore référencé ailleurs. */
  inUse?(id: Id): string | null;
}

const MOCK_TOKEN = /^mock-token-(\d+)$/;

/**
 * API fictive en mémoire : applique les mêmes règles que l'API Laravel (droits par rôle,
 * isolation des donateurs, contrôle du solde) pour que l'interface soit démontrable et testable.
 */
export function createMockApi(options: MockOptions = {}): DonsApi {
  const latency = options.latency ?? 0;
  const today = options.today ?? new Date();
  const seed = options.seed ?? buildSeed(today);
  const db = {
    users: [...seed.users],
    donors: [...seed.donors],
    campaigns: [...seed.campaigns],
    donations: [...seed.donations],
    allocations: [...seed.allocations],
    beneficiaries: [...seed.beneficiaries],
  };
  let currentUserId: Id | null = null;
  let nextId = 1000;

  const pause = (): Promise<void> => (latency > 0 ? new Promise((resolve) => setTimeout(resolve, latency)) : Promise.resolve());
  const currentUser = (): User | null => db.users.find((user) => user.id === currentUserId) ?? null;

  function guard(roles: readonly Role[]): Result<never> | null {
    const user = currentUser();
    if (!user) return fail(401, 'Session expirée : reconnectez-vous.');
    if (!roles.includes(user.role)) return fail(403, 'Accès refusé pour votre rôle.');
    return null;
  }

  function makeCrud<T extends { id: Id }, I>(config: StoreConfig<T, I>): Crud<T, I> {
    return {
      async list() {
        await pause();
        return guard(config.readRoles) ?? ok([...config.items]);
      },
      async create(input) {
        await pause();
        const rejected = guard(config.writeRoles) ?? config.validate?.(input) ?? null;
        if (rejected) return rejected;
        const item = config.build(nextId, input);
        nextId += 1;
        config.items.push(item);
        return ok(item);
      },
      async update(id, input) {
        await pause();
        const denied = guard(config.writeRoles);
        if (denied) return denied;
        const index = config.items.findIndex((item) => item.id === id);
        const previous = config.items[index];
        if (index < 0 || !previous) return fail(404, 'Élément introuvable.');
        const rejected = config.validate?.(input, previous);
        if (rejected) return rejected;
        const item = config.build(id, input, previous);
        config.items[index] = item;
        return ok(item);
      },
      async remove(id) {
        await pause();
        const denied = guard(config.writeRoles);
        if (denied) return denied;
        const index = config.items.findIndex((item) => item.id === id);
        if (index < 0) return fail(404, 'Élément introuvable.');
        const inUse = config.inUse?.(id) ?? null;
        if (inUse) return fail(409, inUse);
        config.items.splice(index, 1);
        return ok(null);
      },
    };
  }

  const donations = makeCrud<Donation, DonationInput>({
    items: db.donations,
    readRoles: STAFF_ROLES,
    writeRoles: WRITER_ROLES,
    build: (id, input) => ({ id, ...input }),
    validate: (input) => (db.donors.some((donor) => donor.id === input.donorId) ? null : fail(422, 'Donateur inconnu.', { donorId: ['Donateur inconnu.'] })),
  });

  const donors = makeCrud<Donor, DonorInput>({
    items: db.donors,
    readRoles: STAFF_ROLES,
    writeRoles: WRITER_ROLES,
    build: (id, input, previous) => ({ id, createdAt: previous?.createdAt ?? toIsoDate(today), ...input }),
    inUse: (id) =>
      db.donations.some((donation) => donation.donorId === id) || db.users.some((user) => user.donorId === id)
        ? 'Ce donateur a des dons ou un compte associé : suppression impossible.'
        : null,
  });

  const campaigns = makeCrud<Campaign, CampaignInput>({
    items: db.campaigns,
    // Les noms de campagne sont visibles de tous les profils (ex. historique « Mes dons »).
    readRoles: [...STAFF_ROLES, 'donateur'],
    writeRoles: WRITER_ROLES,
    build: (id, input) => ({ id, ...input }),
    inUse: (id) =>
      db.donations.some((donation) => donation.campaignId === id) || db.allocations.some((allocation) => allocation.campaignId === id)
        ? 'Cette campagne est utilisée par des dons ou des utilisations : archivez-la plutôt.'
        : null,
  });

  const beneficiaries = makeCrud<Beneficiary, BeneficiaryInput>({
    items: db.beneficiaries,
    readRoles: STAFF_ROLES,
    writeRoles: WRITER_ROLES,
    build: (id, input) => ({ id, ...input }),
    inUse: (id) => (db.allocations.some((allocation) => allocation.beneficiaryId === id) ? 'Ce bénéficiaire a reçu des aides : suppression impossible.' : null),
  });

  const allocations = makeCrud<Allocation, AllocationInput>({
    items: db.allocations,
    readRoles: STAFF_ROLES,
    writeRoles: WRITER_ROLES,
    build: (id, input) => ({ id, ...input }),
    // Contrôle du solde : global par devise (et non par campagne).
    validate: (input, previous) => {
      const balance = availableBalance(db.donations, db.allocations, input.currency, previous?.id);
      if (input.amount <= balance) return null;
      const message = `Montant refusé : ${formatMoney(input.amount, input.currency)} dépasse le solde disponible en ${CURRENCY_META[input.currency].code} (${formatMoney(Math.max(balance, 0), input.currency)}).`;
      // Message global uniquement : afficher aussi le même texte sous le champ ferait lire l'alerte deux fois.
      return fail(422, message);
    },
  });

  const users = makeCrud<User, UserInput>({
    items: db.users,
    readRoles: ['administrateur'],
    writeRoles: ['administrateur'],
    build: (id, input) => ({ id, ...input }),
    inUse: (id) => (id === currentUserId ? 'Vous ne pouvez pas supprimer votre propre compte.' : null),
  });

  return {
    setToken(token) {
      const match = token ? MOCK_TOKEN.exec(token) : null;
      currentUserId = match?.[1] ? Number(match[1]) : null;
    },
    async login(credentials: Credentials): Promise<Result<Session>> {
      await pause();
      const user = db.users.find((candidate) => candidate.email.toLowerCase() === credentials.email.trim().toLowerCase());
      if (!user || credentials.password !== DEMO_PASSWORD) return fail(401, 'Adresse e-mail ou mot de passe incorrect.');
      if (!user.active) return fail(403, 'Ce compte est désactivé. Contactez l’association.');
      currentUserId = user.id;
      return ok({ user, token: `mock-token-${user.id}` });
    },
    async logout() {
      await pause();
      currentUserId = null;
      return ok(null);
    },
    async me() {
      await pause();
      const user = currentUser();
      return user ? ok(user) : fail(401, 'Session expirée : reconnectez-vous.');
    },
    donations,
    // Isolation des donateurs : seul le donateur lié au compte voit ses propres dons.
    async myDonations() {
      await pause();
      const denied = guard(['donateur']);
      if (denied) return denied;
      const donorId = currentUser()?.donorId ?? null;
      return ok(db.donations.filter((donation) => donation.donorId === donorId));
    },
    donors,
    campaigns,
    allocations,
    beneficiaries,
    users,
    async stats(): Promise<Result<Stats>> {
      await pause();
      return guard(STAFF_ROLES) ?? ok(computeStats(db.donations, db.allocations, db.campaigns, today));
    },
  };
}
