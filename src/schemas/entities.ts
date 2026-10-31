import { z } from 'zod';
import {
  ALLOCATION_CATEGORY_LABELS,
  ALLOCATION_KIND_LABELS,
  BENEFICIARY_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CURRENCY_LABELS,
  DONATION_STATUS_LABELS,
  DONOR_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
  ROLE_LABELS,
} from '../config/constants';
import type { Allocation, AllocationInput, Beneficiary, BeneficiaryInput, Campaign, CampaignInput, Donation, DonationInput, Donor, DonorInput, User, UserInput } from '../types';
import { parseAmount, toInputAmount } from '../utils/money';
import { toIsoDate } from '../utils/dates';
import { dateField, enumOf, optionalEmail, optionalId, requiredId, requiredText } from './common';
import type { FormValues } from './common';

const AMOUNT_MESSAGE = 'Montant invalide (ex. 25 000 ou 1 250,50)';

const idToText = (id: number | null): string => (id === null ? '' : String(id));

// ---------- Dons ----------
export const donationSchema = z
  .object({
    donorId: requiredId('Choisissez un donateur'),
    campaignId: optionalId,
    amount: requiredText('Montant requis'),
    currency: enumOf(CURRENCY_LABELS),
    date: dateField,
    paymentMode: enumOf(PAYMENT_MODE_LABELS),
    status: enumOf(DONATION_STATUS_LABELS),
    reference: z.string().trim(),
    note: z.string().trim(),
  })
  .transform((value, ctx): DonationInput => {
    const amount = parseAmount(value.amount, value.currency);
    if (amount === null || amount <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: AMOUNT_MESSAGE });
      return z.NEVER;
    }
    return { ...value, amount };
  });

export function donationValues(donation?: Donation): FormValues {
  return {
    donorId: idToText(donation?.donorId ?? null),
    campaignId: idToText(donation?.campaignId ?? null),
    amount: donation ? toInputAmount(donation.amount, donation.currency) : '',
    currency: donation?.currency ?? 'XOF',
    date: donation?.date ?? toIsoDate(new Date()),
    paymentMode: donation?.paymentMode ?? 'especes',
    status: donation?.status ?? 'recu',
    reference: donation?.reference ?? '',
    note: donation?.note ?? '',
  };
}

// ---------- Utilisations ----------
export const allocationSchema = z
  .object({
    kind: enumOf(ALLOCATION_KIND_LABELS),
    beneficiaryId: optionalId,
    campaignId: optionalId,
    amount: requiredText('Montant requis'),
    currency: enumOf(CURRENCY_LABELS),
    date: dateField,
    category: enumOf(ALLOCATION_CATEGORY_LABELS),
    description: z.string().trim(),
  })
  .transform((value, ctx): AllocationInput => {
    const amount = parseAmount(value.amount, value.currency);
    if (amount === null || amount <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: AMOUNT_MESSAGE });
      return z.NEVER;
    }
    if (value.kind === 'redistribution' && value.beneficiaryId === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['beneficiaryId'], message: 'Choisissez un bénéficiaire pour une redistribution' });
      return z.NEVER;
    }
    return { ...value, amount };
  });

export function allocationValues(allocation?: Allocation): FormValues {
  return {
    kind: allocation?.kind ?? 'redistribution',
    beneficiaryId: idToText(allocation?.beneficiaryId ?? null),
    campaignId: idToText(allocation?.campaignId ?? null),
    amount: allocation ? toInputAmount(allocation.amount, allocation.currency) : '',
    currency: allocation?.currency ?? 'XOF',
    date: allocation?.date ?? toIsoDate(new Date()),
    category: allocation?.category ?? 'aide_directe',
    description: allocation?.description ?? '',
  };
}

// ---------- Donateurs ----------
export const donorSchema = z.object({
  name: requiredText('Nom requis'),
  type: enumOf(DONOR_TYPE_LABELS),
  phone: z.string().trim(),
  email: optionalEmail,
  city: z.string().trim(),
  country: z.string().trim(),
  notes: z.string().trim(),
}) satisfies z.ZodType<DonorInput>;

export function donorValues(donor?: Donor): FormValues {
  return {
    name: donor?.name ?? '',
    type: donor?.type ?? 'particulier',
    phone: donor?.phone ?? '',
    email: donor?.email ?? '',
    city: donor?.city ?? '',
    country: donor?.country ?? 'Mali',
    notes: donor?.notes ?? '',
  };
}

// ---------- Campagnes ----------
export const campaignSchema = z
  .object({
    name: requiredText('Nom requis'),
    description: z.string().trim(),
    goalAmount: requiredText('Objectif requis'),
    goalCurrency: enumOf(CURRENCY_LABELS),
    startDate: dateField,
    endDate: dateField,
    status: enumOf(CAMPAIGN_STATUS_LABELS),
  })
  .transform((value, ctx): CampaignInput => {
    const goalAmount = parseAmount(value.goalAmount, value.goalCurrency);
    if (goalAmount === null || goalAmount <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['goalAmount'], message: AMOUNT_MESSAGE });
      return z.NEVER;
    }
    if (value.endDate < value.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'La fin doit suivre le début' });
      return z.NEVER;
    }
    return { ...value, goalAmount };
  });

export function campaignValues(campaign?: Campaign): FormValues {
  return {
    name: campaign?.name ?? '',
    description: campaign?.description ?? '',
    goalAmount: campaign ? toInputAmount(campaign.goalAmount, campaign.goalCurrency) : '',
    goalCurrency: campaign?.goalCurrency ?? 'XOF',
    startDate: campaign?.startDate ?? toIsoDate(new Date()),
    endDate: campaign?.endDate ?? toIsoDate(new Date()),
    status: campaign?.status ?? 'active',
  };
}

// ---------- Bénéficiaires ----------
export const beneficiarySchema = z.object({
  name: requiredText('Nom requis'),
  type: enumOf(BENEFICIARY_TYPE_LABELS),
  contact: z.string().trim(),
  city: z.string().trim(),
  notes: z.string().trim(),
}) satisfies z.ZodType<BeneficiaryInput>;

export function beneficiaryValues(beneficiary?: Beneficiary): FormValues {
  return {
    name: beneficiary?.name ?? '',
    type: beneficiary?.type ?? 'famille',
    contact: beneficiary?.contact ?? '',
    city: beneficiary?.city ?? '',
    notes: beneficiary?.notes ?? '',
  };
}

// ---------- Utilisateurs ----------
export const userSchema = z
  .object({
    name: requiredText('Nom requis'),
    email: z.string().trim().email('Adresse e-mail invalide'),
    role: enumOf(ROLE_LABELS),
    active: z.enum(['true', 'false']),
    donorId: optionalId,
  })
  .transform((value, ctx): UserInput => {
    if (value.role === 'donateur' && value.donorId === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['donorId'], message: 'Liez le compte à une fiche donateur' });
      return z.NEVER;
    }
    return { name: value.name, email: value.email, role: value.role, active: value.active === 'true', donorId: value.role === 'donateur' ? value.donorId : null };
  });

export function userValues(user?: User): FormValues {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'lecteur',
    active: user?.active === false ? 'false' : 'true',
    donorId: idToText(user?.donorId ?? null),
  };
}

// ---------- Connexion ----------
export const loginSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
