import type { Currency, Id, IsoDate, MinorAmount } from './common';

/** Une utilisation est soit une redistribution à un bénéficiaire, soit une dépense. */
export type AllocationKind = 'redistribution' | 'depense';

export type AllocationCategory = 'aide_directe' | 'materiel' | 'fonctionnement' | 'autre';

export interface Allocation {
  id: Id;
  kind: AllocationKind;
  /** Obligatoire pour une redistribution. */
  beneficiaryId: Id | null;
  campaignId: Id | null;
  amount: MinorAmount;
  currency: Currency;
  date: IsoDate;
  category: AllocationCategory;
  description: string;
}

export type AllocationInput = Omit<Allocation, 'id'>;
