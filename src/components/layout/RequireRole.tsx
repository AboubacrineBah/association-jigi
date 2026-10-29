import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';
import { ForbiddenView } from '../../views/ForbiddenView';
import { AppLayout } from './AppLayout';

/** Garde de routes connectées : sans session, retour à la page de connexion. */
export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return <AppLayout />;
}

interface RequireRoleProps {
  roles: readonly Role[];
  children: ReactNode;
}

/** Protège une vue : rôle insuffisant → page « Accès refusé » (les droits sont aussi contrôlés côté API). */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <ForbiddenView />;
  return <>{children}</>;
}
