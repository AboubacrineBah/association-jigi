import { addMonths, format, parseISO, startOfMonth } from 'date-fns';
import { CURRENCIES } from '../config/constants';
import type { Allocation, Campaign, CampaignProgress, Currency, CurrencyTotals, Donation, MinorAmount, MonthlyPoint, Stats } from '../types';

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/** Seuls les dons « reçus » comptent : les dons « promis » et « annulés » sont exclus. */
export function receivedDonations(donations: readonly Donation[]): Donation[] {
  return donations.filter((donation) => donation.status === 'recu');
}

export function computeTotals(donations: readonly Donation[], allocations: readonly Allocation[]): CurrencyTotals[] {
  const received = receivedDonations(donations);
  return CURRENCIES.map((currency) => {
    const collectedDonations = received.filter((donation) => donation.currency === currency);
    const collected = sum(collectedDonations.map((donation) => donation.amount));
    const used = sum(allocations.filter((allocation) => allocation.currency === currency).map((allocation) => allocation.amount));
    const donationCount = collectedDonations.length;
    return {
      currency,
      collected,
      used,
      balance: collected - used,
      donationCount,
      averageDonation: donationCount === 0 ? 0 : Math.round(collected / donationCount),
    };
  });
}

/**
 * Solde disponible d'une devise (global, et non par campagne).
 * `ignoreAllocationId` permet de recalculer le solde lors de la modification d'une utilisation.
 */
export function availableBalance(
  donations: readonly Donation[],
  allocations: readonly Allocation[],
  currency: Currency,
  ignoreAllocationId?: number,
): MinorAmount {
  const collected = sum(receivedDonations(donations).filter((donation) => donation.currency === currency).map((donation) => donation.amount));
  const used = sum(
    allocations
      .filter((allocation) => allocation.currency === currency && allocation.id !== ignoreAllocationId)
      .map((allocation) => allocation.amount),
  );
  return collected - used;
}

/** Dons reçus par mois sur les `months` derniers mois, pour chaque devise. */
export function computeMonthly(donations: readonly Donation[], today: Date, months = 6): MonthlyPoint[] {
  const received = receivedDonations(donations);
  const first = startOfMonth(addMonths(today, -(months - 1)));
  const points: MonthlyPoint[] = [];
  for (let index = 0; index < months; index += 1) {
    const month = format(addMonths(first, index), 'yyyy-MM');
    for (const currency of CURRENCIES) {
      const amount = sum(
        received.filter((donation) => donation.currency === currency && format(parseISO(donation.date), 'yyyy-MM') === month).map((donation) => donation.amount),
      );
      points.push({ month, currency, amount });
    }
  }
  return points;
}

/** Progression d'une campagne : dons reçus dans la devise de l'objectif (aucune conversion). */
export function computeCampaignProgress(campaigns: readonly Campaign[], donations: readonly Donation[]): CampaignProgress[] {
  const received = receivedDonations(donations);
  return campaigns.map((campaign) => ({
    campaignId: campaign.id,
    name: campaign.name,
    goalAmount: campaign.goalAmount,
    goalCurrency: campaign.goalCurrency,
    raised: sum(received.filter((donation) => donation.campaignId === campaign.id && donation.currency === campaign.goalCurrency).map((donation) => donation.amount)),
  }));
}

export function computeStats(
  donations: readonly Donation[],
  allocations: readonly Allocation[],
  campaigns: readonly Campaign[],
  today: Date = new Date(),
): Stats {
  return {
    totals: computeTotals(donations, allocations),
    monthly: computeMonthly(donations, today),
    campaigns: computeCampaignProgress(campaigns, donations),
  };
}
