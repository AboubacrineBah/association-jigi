/** Devises gérées (cahier des charges 5.2) : FCFA (XOF), dollar US, euro. */
export type Currency = 'XOF' | 'USD' | 'EUR';

export type Role = 'administrateur' | 'gestionnaire' | 'lecteur' | 'donateur';

export type Id = number;

/** Date au format ISO `yyyy-MM-dd`. */
export type IsoDate = string;

/**
 * Montant exprimé en entier dans la plus petite unité de la devise
 * (XOF sans décimale, centimes pour USD et EUR) — cahier des charges 6.4.
 */
export type MinorAmount = number;
