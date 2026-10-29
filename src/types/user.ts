import type { Id, Role } from './common';

export interface User {
  id: Id;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  /** Fiche donateur liée, uniquement pour le rôle « donateur ». */
  donorId: Id | null;
}

export type UserInput = Omit<User, 'id'>;

export interface Credentials {
  email: string;
  password: string;
}

export interface Session {
  user: User;
  token: string;
}
