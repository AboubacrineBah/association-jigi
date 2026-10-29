import type { Id } from './common';

export type BeneficiaryType = 'personne' | 'famille' | 'structure' | 'projet';

export interface Beneficiary {
  id: Id;
  name: string;
  type: BeneficiaryType;
  contact: string;
  city: string;
  notes: string;
}

export type BeneficiaryInput = Omit<Beneficiary, 'id'>;
