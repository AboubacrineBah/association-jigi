import type { Id, IsoDate } from './common';

export type DonorType = 'particulier' | 'entreprise' | 'organisation';

export interface Donor {
  id: Id;
  name: string;
  type: DonorType;
  phone: string;
  email: string;
  city: string;
  country: string;
  notes: string;
  createdAt: IsoDate;
}

export type DonorInput = Omit<Donor, 'id' | 'createdAt'>;
