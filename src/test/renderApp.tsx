import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { createMockApi } from '../api/mockApi';
import { DEMO_PASSWORD } from '../api/seed';
import { AppProviders, AppRoutes } from '../App';
import type { DonsApi } from '../types';

/** Rend l'application complète avec l'API fictive, éventuellement déjà connectée (email ≠ null). */
export async function renderAppAs(email: string | null, route: string, decorate: (api: DonsApi) => DonsApi = (api) => api) {
  const mock = createMockApi();
  const api = decorate(mock);
  if (email) {
    const session = await mock.login({ email, password: DEMO_PASSWORD });
    if (!session.ok) throw new Error(session.error.message);
    sessionStorage.setItem('jigi.session', JSON.stringify(session.data));
  }
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders api={api}>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return { api, user };
}
