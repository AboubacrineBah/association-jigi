import { lazy, Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './components/layout/RequireRole';
import { STAFF_ROLES } from './config/constants';
import { ApiProvider } from './context/ApiContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import type { DonsApi } from './types';
import { LoginView } from './views/LoginView';
import { NotFoundView } from './views/NotFoundView';

/** Chargement différé des vues (cahier des charges 6.4) : chaque vue forme un fragment séparé. */
function lazyView<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(async () => ({ default: (await load())[name] }));
}

const DashboardView = lazyView(() => import('./views/DashboardView'), 'DashboardView');
const DonationsView = lazyView(() => import('./views/DonationsView'), 'DonationsView');
const DonorsView = lazyView(() => import('./views/DonorsView'), 'DonorsView');
const CampaignsView = lazyView(() => import('./views/CampaignsView'), 'CampaignsView');
const AllocationsView = lazyView(() => import('./views/AllocationsView'), 'AllocationsView');
const BeneficiariesView = lazyView(() => import('./views/BeneficiariesView'), 'BeneficiariesView');
const ReportsView = lazyView(() => import('./views/ReportsView'), 'ReportsView');
const UsersView = lazyView(() => import('./views/UsersView'), 'UsersView');
const MyDonationsView = lazyView(() => import('./views/MyDonationsView'), 'MyDonationsView');

function Staff({ children }: { children: ReactNode }) {
  return <RequireRole roles={STAFF_ROLES}>{children}</RequireRole>;
}

function Home() {
  const { user } = useAuth();
  if (user?.role === 'donateur') return <Navigate to="/mes-dons" replace />;
  return (
    <Staff>
      <DashboardView />
    </Staff>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<div role="status" className="p-4">Chargement…</div>}>
      <Routes>
        <Route path="/connexion" element={<LoginView />} />
        <Route element={<RequireAuth />}>
          <Route index element={<Home />} />
          <Route path="dons" element={<Staff><DonationsView /></Staff>} />
          <Route path="donateurs" element={<Staff><DonorsView /></Staff>} />
          <Route path="campagnes" element={<Staff><CampaignsView /></Staff>} />
          <Route path="utilisations" element={<Staff><AllocationsView /></Staff>} />
          <Route path="beneficiaires" element={<Staff><BeneficiariesView /></Staff>} />
          <Route path="rapports" element={<Staff><ReportsView /></Staff>} />
          <Route path="utilisateurs" element={<RequireRole roles={['administrateur']}><UsersView /></RequireRole>} />
          <Route path="mes-dons" element={<RequireRole roles={['donateur']}><MyDonationsView /></RequireRole>} />
          <Route path="*" element={<NotFoundView />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

/** Fournisseurs d'état partagé (React Context) : API, notifications, session. */
export function AppProviders({ api, children }: { api: DonsApi; children: ReactNode }) {
  return (
    <ApiProvider api={api}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ApiProvider>
  );
}
