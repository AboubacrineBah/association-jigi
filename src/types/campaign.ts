import type { Currency, Id, IsoDate, MinorAmount } from './common';

export type CampaignStatus = 'active' | 'terminee' | 'archivee';

export interface Campaign {
  id: Id;
  name: string;
  description: string;
  goalAmount: MinorAmount;
  goalCurrency: Currency;
  startDate: IsoDate;
  endDate: IsoDate;
  status: CampaignStatus;
}

export type CampaignInput = Omit<Campaign, 'id'>;
