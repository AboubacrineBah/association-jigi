import type { Currency, Id, MinorAmount } from './common';

/** Totaux d'une devise ; les devises ne sont jamais additionnées entre elles. */
export interface CurrencyTotals {
  currency: Currency;
  collected: MinorAmount;
  used: MinorAmount;
  /** Solde disponible = dons « reçus » − utilisations. */
  balance: MinorAmount;
  donationCount: number;
  averageDonation: MinorAmount;
}

export interface MonthlyPoint {
  /** Mois au format `yyyy-MM`. */
  month: string;
  currency: Currency;
  amount: MinorAmount;
}

export interface CampaignProgress {
  campaignId: Id;
  name: string;
  goalAmount: MinorAmount;
  goalCurrency: Currency;
  raised: MinorAmount;
}

export interface Stats {
  totals: CurrencyTotals[];
  monthly: MonthlyPoint[];
  campaigns: CampaignProgress[];
}
