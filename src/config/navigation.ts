import type { Role } from '../types';
import { STAFF_ROLES } from './constants';

export interface NavItem {
  path: string;
  label: string;
  /** Classe Bootstrap Icons (décorative). */
  icon: string;
  roles: readonly Role[];
  /** Onglet affiché dans la barre du bas sur mobile (les autres vont dans « Menu »). */
  mobileTab: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Tableau de bord', icon: 'bi-speedometer2', roles: STAFF_ROLES, mobileTab: true },
  { path: '/dons', label: 'Dons', icon: 'bi-gift', roles: STAFF_ROLES, mobileTab: true },
  { path: '/donateurs', label: 'Donateurs', icon: 'bi-people', roles: STAFF_ROLES, mobileTab: false },
  { path: '/campagnes', label: 'Campagnes', icon: 'bi-flag', roles: STAFF_ROLES, mobileTab: false },
  { path: '/utilisations', label: 'Utilisations', icon: 'bi-box-arrow-up-right', roles: STAFF_ROLES, mobileTab: true },
  { path: '/beneficiaires', label: 'Bénéficiaires', icon: 'bi-person-heart', roles: STAFF_ROLES, mobileTab: false },
  { path: '/rapports', label: 'Rapports et exports', icon: 'bi-file-earmark-bar-graph', roles: STAFF_ROLES, mobileTab: false },
  { path: '/utilisateurs', label: 'Utilisateurs', icon: 'bi-person-gear', roles: ['administrateur'], mobileTab: false },
  { path: '/mes-dons', label: 'Mes dons', icon: 'bi-heart', roles: ['donateur'], mobileTab: false },
];

/** Page d'accueil selon le rôle. */
export function homePathFor(role: Role): string {
  return role === 'donateur' ? '/mes-dons' : '/';
}
