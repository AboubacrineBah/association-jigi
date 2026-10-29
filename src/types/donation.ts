import type { Currency, Id, IsoDate, MinorAmount } from './common';

export type DonationStatus = 'promis' | 'recu' | 'annule';

export type PaymentMode = 'especes' | 'virement' | 'mobile_money' | 'cheque' | 'autre';

export interface Donation {
  id: Id;
  donorId: Id;
  campaignId: Id | null;
  amount: MinorAmount;
  currency: Currency;
  date: IsoDate;
  paymentMode: PaymentMode;
  status: DonationStatus;
  reference: string;
  note: string;
}

export type DonationInput = Omit<Donation, 'id'>;
