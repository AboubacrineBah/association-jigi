import type {
  AllocationCategory,
  AllocationKind,
  BeneficiaryType,
  CampaignStatus,
  Currency,
  DonationStatus,
  DonorType,
  PaymentMode,
  Role,
} from '../types';

export const CURRENCIES: readonly Currency[] = ['XOF', 'USD', 'EUR'];

export interface CurrencyMeta {
  /** Libellé affiché avec le montant (ex. « FCFA »). */
  label: string;
  /** Code ISO, utilisé dans les messages (ex. « XOF »). */
  code: Currency;
  /** Nombre de décimales de la devise. */
  digits: number;
}

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  XOF: { label: 'FCFA', code: 'XOF', digits: 0 },
  USD: { label: '$US', code: 'USD', digits: 2 },
  EUR: { label: '€', code: 'EUR', digits: 2 },
};

export const ROLE_LABELS: Record<Role, string> = {
  administrateur: 'Administrateur',
  gestionnaire: 'Gestionnaire',
  lecteur: 'Lecteur',
  donateur: 'Donateur',
};

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  promis: 'Promis',
  recu: 'Reçu',
  annule: 'Annulé',
};

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  especes: 'Espèces',
  virement: 'Virement',
  mobile_money: 'Mobile money',
  cheque: 'Chèque',
  autre: 'Autre',
};

export const DONOR_TYPE_LABELS: Record<DonorType, string> = {
  particulier: 'Particulier',
  entreprise: 'Entreprise',
  organisation: 'Organisation',
};

export const BENEFICIARY_TYPE_LABELS: Record<BeneficiaryType, string> = {
  personne: 'Personne',
  famille: 'Famille',
  structure: 'Structure',
  projet: 'Projet',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  active: 'Active',
  terminee: 'Terminée',
  archivee: 'Archivée',
};

export const ALLOCATION_KIND_LABELS: Record<AllocationKind, string> = {
  redistribution: 'Redistribution',
  depense: 'Dépense',
};

export const ALLOCATION_CATEGORY_LABELS: Record<AllocationCategory, string> = {
  aide_directe: 'Aide directe',
  materiel: 'Matériel',
  fonctionnement: 'Fonctionnement',
  autre: 'Autre',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  XOF: 'FCFA',
  USD: 'Dollar US',
  EUR: 'Euro',
};

/** Rôles autorisés à modifier les données (le lecteur et le donateur sont en lecture seule). */
export const WRITER_ROLES: readonly Role[] = ['administrateur', 'gestionnaire'];
export const STAFF_ROLES: readonly Role[] = ['administrateur', 'gestionnaire', 'lecteur'];
