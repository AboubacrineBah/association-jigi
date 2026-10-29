import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAppAs } from '../test/renderApp';

describe('DonationsView', () => {
  it('liste les dons avec un tableau accessible', async () => {
    await renderAppAs('gestionnaire@demo.jigi', '/dons');
    const table = await screen.findByRole('table', { name: /Liste des dons/ });
    expect(within(table).getAllByRole('columnheader').length).toBeGreaterThan(5);
    expect(within(table).getByRole('columnheader', { name: /Date/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('filtre les dons par statut', async () => {
    const { user } = await renderAppAs('gestionnaire@demo.jigi', '/dons');
    await screen.findByRole('table', { name: /Liste des dons/ });
    await user.selectOptions(screen.getByLabelText('Statut'), 'Annulé');
    const table = await screen.findByRole('table', { name: /Liste des dons/ });
    expect(within(table).getAllByText('Annulé').length).toBeGreaterThan(0);
    expect(within(table).queryByText('Reçu')).not.toBeInTheDocument();
  });

  it('cache les actions de modification au lecteur', async () => {
    await renderAppAs('lecteur@demo.jigi', '/dons');
    await screen.findByRole('table', { name: /Liste des dons/ });
    expect(screen.queryByRole('button', { name: 'Nouveau don' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Modifier le don/ })).not.toBeInTheDocument();
  });

  it('affiche les erreurs de validation du formulaire de don', async () => {
    const { user } = await renderAppAs('gestionnaire@demo.jigi', '/dons');
    await user.click(await screen.findByRole('button', { name: 'Nouveau don' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nouveau don' });
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));
    expect(await within(dialog).findByText('Choisissez un donateur')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Donateur')).toHaveAttribute('aria-invalid', 'true');
  });

  it('demande une confirmation avant de supprimer un don', async () => {
    const { user } = await renderAppAs('gestionnaire@demo.jigi', '/dons');
    const [firstDelete] = await screen.findAllByRole('button', { name: /Supprimer le don/ });
    if (!firstDelete) throw new Error('Aucun bouton de suppression trouvé.');
    await user.click(firstDelete);
    const dialog = await screen.findByRole('dialog', { name: 'Supprimer ce don ?' });
    expect(within(dialog).getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
  });

  it('enregistre un nouveau don et confirme par une notification', async () => {
    const { user } = await renderAppAs('gestionnaire@demo.jigi', '/dons');
    await user.click(await screen.findByRole('button', { name: 'Nouveau don' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nouveau don' });
    await user.selectOptions(within(dialog).getByLabelText('Donateur'), 'Aminata Traoré');
    await user.type(within(dialog).getByLabelText('Montant'), '12 500');
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Don enregistré.')).toBeInTheDocument();
  });

  it('propose de réessayer quand l’API échoue', async () => {
    await renderAppAs('gestionnaire@demo.jigi', '/dons', (api) => ({
      ...api,
      donations: { ...api.donations, list: async () => ({ ok: false as const, error: { status: 0, message: 'Réseau indisponible.' } }) },
    }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Impossible de charger les dons. Réseau indisponible.');
    expect(within(alert).getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });
});
