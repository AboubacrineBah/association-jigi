import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAppAs } from '../test/renderApp';

describe('AllocationsView', () => {
  it('affiche le solde disponible de chaque devise', async () => {
    await renderAppAs('gestionnaire@demo.jigi', '/utilisations');
    expect(await screen.findByRole('region', { name: 'Solde disponible en XOF' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Solde disponible en USD' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Solde disponible en EUR' })).toBeInTheDocument();
  });

  it('refuse, avec un message clair, une utilisation supérieure au solde', async () => {
    const { user } = await renderAppAs('gestionnaire@demo.jigi', '/utilisations');
    await user.click(await screen.findByRole('button', { name: 'Nouvelle utilisation' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nouvelle utilisation' });
    await user.selectOptions(within(dialog).getByLabelText('Type'), 'Dépense');
    await user.type(within(dialog).getByLabelText('Montant'), '999999999');
    await user.selectOptions(within(dialog).getByLabelText('Devise'), 'Dollar US');
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/dépasse le solde disponible en USD/);
  });
});
