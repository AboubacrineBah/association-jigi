import { subDays } from 'date-fns';
import type { Allocation, Beneficiary, Campaign, Donation, Donor, User } from '../types';
import { toIsoDate } from '../utils/dates';

export interface SeedData {
  users: User[];
  donors: Donor[];
  campaigns: Campaign[];
  donations: Donation[];
  allocations: Allocation[];
  beneficiaries: Beneficiary[];
}

/** Mot de passe commun des comptes de test (données fictives uniquement). */
export const DEMO_PASSWORD = 'demo1234';

export interface TestAccount {
  email: string;
  roleLabel: string;
}

export const TEST_ACCOUNTS: readonly TestAccount[] = [
  { email: 'admin@demo.jigi', roleLabel: 'Administrateur' },
  { email: 'gestionnaire@demo.jigi', roleLabel: 'Gestionnaire' },
  { email: 'lecteur@demo.jigi', roleLabel: 'Lecteur' },
  { email: 'donateur@demo.jigi', roleLabel: 'Donateur' },
];

/** Jeu de données fictives ; les dates sont relatives à `today` pour rester toujours récentes. */
export function buildSeed(today: Date = new Date()): SeedData {
  const day = (daysAgo: number): string => toIsoDate(subDays(today, daysAgo));
  const created = day(120);

  const donors: Donor[] = [
    { id: 1, name: 'Aminata Traoré', type: 'particulier', phone: '+223 70 00 00 00', email: 'aminata.traore@exemple.ml', city: 'Bamako', country: 'Mali', notes: '', createdAt: created },
    { id: 2, name: 'Sahel Services SARL', type: 'entreprise', phone: '+223 20 00 00 00', email: 'contact@sahel-services.exemple.ml', city: 'Bamako', country: 'Mali', notes: 'Partenaire depuis 2025.', createdAt: created },
    { id: 3, name: 'Boubacar Sidibé', type: 'particulier', phone: '', email: 'boubacar.sidibe@exemple.ca', city: 'Montréal', country: 'Canada', notes: '', createdAt: created },
    { id: 4, name: 'Fondation Horizon', type: 'organisation', phone: '', email: 'info@horizon.exemple.ch', city: 'Genève', country: 'Suisse', notes: '', createdAt: created },
    { id: 5, name: 'Fanta Coulibaly', type: 'particulier', phone: '', email: '', city: 'Ségou', country: 'Mali', notes: '', createdAt: created },
    { id: 6, name: 'Mariam Dembélé', type: 'particulier', phone: '', email: '', city: 'Kayes', country: 'Mali', notes: '', createdAt: created },
    { id: 7, name: 'Moussa Keïta', type: 'particulier', phone: '', email: '', city: 'Paris', country: 'France', notes: '', createdAt: created },
  ];

  const campaigns: Campaign[] = [
    { id: 1, name: 'Rentrée scolaire 2026', description: 'Fournitures et frais de scolarité.', goalAmount: 5_000_000, goalCurrency: 'XOF', startDate: day(90), endDate: day(-60), status: 'active' },
    { id: 2, name: 'Puits villageois', description: 'Forage et entretien de puits.', goalAmount: 4_000_000, goalCurrency: 'XOF', startDate: day(150), endDate: day(-30), status: 'active' },
    { id: 3, name: 'Urgence santé', description: 'Médicaments et soins d’urgence.', goalAmount: 300_000, goalCurrency: 'USD', startDate: day(100), endDate: day(-10), status: 'active' },
    { id: 4, name: 'Noël solidaire 2025', description: 'Collecte de fin d’année 2025.', goalAmount: 1_000_000, goalCurrency: 'XOF', startDate: day(330), endDate: day(300), status: 'terminee' },
  ];

  const donation = (id: number, donorId: number, campaignId: number | null, amount: number, currency: Donation['currency'], daysAgo: number, paymentMode: Donation['paymentMode'], status: Donation['status']): Donation => ({
    id, donorId, campaignId, amount, currency, date: day(daysAgo), paymentMode, status, reference: `DON-${String(id).padStart(4, '0')}`, note: '',
  });

  const donations: Donation[] = [
    donation(1, 1, 1, 25_000, 'XOF', 3, 'mobile_money', 'recu'),
    donation(2, 2, 2, 50_000, 'EUR', 5, 'virement', 'recu'),
    donation(3, 7, 3, 10_000, 'USD', 7, 'especes', 'promis'),
    donation(4, 5, 1, 75_000, 'XOF', 9, 'cheque', 'recu'),
    donation(5, 3, 3, 120_000, 'USD', 12, 'virement', 'recu'),
    donation(6, 4, 3, 25_000, 'EUR', 15, 'virement', 'annule'),
    donation(7, 6, 1, 40_000, 'XOF', 18, 'especes', 'recu'),
    donation(8, 1, 1, 40_000, 'XOF', 20, 'especes', 'recu'),
    donation(9, 4, 3, 200_000, 'EUR', 25, 'virement', 'recu'),
    donation(10, 3, 3, 100_000, 'USD', 35, 'virement', 'recu'),
    donation(11, 2, 1, 1_500_000, 'XOF', 40, 'virement', 'recu'),
    donation(12, 1, 2, 100_000, 'XOF', 54, 'virement', 'recu'),
    donation(13, 1, 3, 15_000, 'EUR', 73, 'virement', 'recu'),
    donation(14, 6, 2, 300_000, 'XOF', 95, 'especes', 'recu'),
  ];

  const beneficiaries: Beneficiary[] = [
    { id: 1, name: 'Famille Diarra', type: 'famille', contact: '', city: 'Bamako', notes: '' },
    { id: 2, name: 'École communautaire', type: 'structure', contact: '', city: 'Kati', notes: '' },
    { id: 3, name: 'Famille Sangaré', type: 'famille', contact: '', city: 'Ségou', notes: '' },
    { id: 4, name: 'Projet Puits villageois', type: 'projet', contact: '', city: 'Koulikoro', notes: '' },
  ];

  const allocation = (id: number, kind: Allocation['kind'], beneficiaryId: number | null, campaignId: number | null, amount: number, currency: Allocation['currency'], daysAgo: number, category: Allocation['category'], description: string): Allocation => ({
    id, kind, beneficiaryId, campaignId, amount, currency, date: day(daysAgo), category, description,
  });

  const allocations: Allocation[] = [
    allocation(1, 'redistribution', 1, 1, 150_000, 'XOF', 4, 'aide_directe', 'Aide de rentrée.'),
    allocation(2, 'depense', null, null, 85_000, 'XOF', 6, 'fonctionnement', 'Frais de fonctionnement du mois.'),
    allocation(3, 'redistribution', 2, 3, 120_000, 'USD', 8, 'materiel', 'Matériel médical.'),
    allocation(4, 'redistribution', 3, null, 40_000, 'EUR', 10, 'aide_directe', ''),
    allocation(5, 'depense', null, 3, 30_000, 'USD', 14, 'materiel', 'Transport de médicaments.'),
    allocation(6, 'redistribution', 4, 2, 900_000, 'XOF', 30, 'materiel', 'Pompe et tuyauterie.'),
  ];

  const users: User[] = [
    { id: 1, name: 'Seydou Konaté', email: 'admin@demo.jigi', role: 'administrateur', active: true, donorId: null },
    { id: 2, name: 'Fatoumata Diarra', email: 'gestionnaire@demo.jigi', role: 'gestionnaire', active: true, donorId: null },
    { id: 3, name: 'Awa Camara', email: 'lecteur@demo.jigi', role: 'lecteur', active: true, donorId: null },
    { id: 4, name: 'Aminata Traoré', email: 'donateur@demo.jigi', role: 'donateur', active: true, donorId: 1 },
    { id: 5, name: 'Boubacar Sidibé', email: 'boubacar@demo.jigi', role: 'donateur', active: false, donorId: 3 },
  ];

  return { users, donors, campaigns, donations, allocations, beneficiaries };
}
