import type { Allocation, AllocationInput } from './allocation';
import type { Beneficiary, BeneficiaryInput } from './beneficiary';
import type { Campaign, CampaignInput } from './campaign';
import type { Id } from './common';
import type { Donation, DonationInput } from './donation';
import type { Donor, DonorInput } from './donor';
import type { Stats } from './stats';
import type { Credentials, Session, User, UserInput } from './user';

/** Erreur d'API normalisée, affichable telle quelle dans l'interface. */
export interface ApiError {
  /** Code HTTP ; 0 si le serveur est injoignable. */
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/** Retour typé des appels API : jamais d'exception à gérer côté interface. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface Crud<T, I> {
  list(): Promise<Result<T[]>>;
  create(input: I): Promise<Result<T>>;
  update(id: Id, input: I): Promise<Result<T>>;
  remove(id: Id): Promise<Result<null>>;
}

/** Contrat d'API (cahier des charges 6.3), implémenté par le client HTTP et par l'API fictive. */
export interface DonsApi {
  setToken(token: string | null): void;
  login(credentials: Credentials): Promise<Result<Session>>;
  logout(): Promise<Result<null>>;
  me(): Promise<Result<User>>;
  donations: Crud<Donation, DonationInput>;
  /** Dons du donateur connecté (lecture seule). */
  myDonations(): Promise<Result<Donation[]>>;
  donors: Crud<Donor, DonorInput>;
  campaigns: Crud<Campaign, CampaignInput>;
  allocations: Crud<Allocation, AllocationInput>;
  beneficiaries: Crud<Beneficiary, BeneficiaryInput>;
  users: Crud<User, UserInput>;
  stats(): Promise<Result<Stats>>;
}
