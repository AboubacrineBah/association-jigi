import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAppAs } from './test/renderApp';

describe('Connexion et routage par rôle', () => {
  it('redirige un visiteur non connecté vers la page de connexion', async () => {
    await renderAppAs(null, '/dons');
    expect(await screen.findByRole('heading', { level: 1, name: 'Connexion' })).toBeInTheDocument();
  });

  it('affiche une erreur accessible quand les identifiants sont incorrects', async () => {
    const { user } = await renderAppAs(null, '/connexion');
    await user.type(await screen.findByLabelText('Adresse e-mail'), 'admin@demo.jigi');
    await user.type(screen.getByLabelText('Mot de passe'), 'faux');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Adresse e-mail ou mot de passe incorrect.');
  });

  it('signale les champs vides avant tout appel à l’API', async () => {
    const { user } = await renderAppAs(null, '/connexion');
    await user.click(await screen.findByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByText('Adresse e-mail invalide')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('aria-invalid', 'true');
  });

  it('connecte un gestionnaire et ouvre le tableau de bord', async () => {
    const { user } = await renderAppAs(null, '/connexion');
    await user.type(await screen.findByLabelText('Adresse e-mail'), 'gestionnaire@demo.jigi');
    await user.type(screen.getByLabelText('Mot de passe'), 'demo1234');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument();
  });

  it('refuse l’accès aux vues d’équipe à un donateur', async () => {
    await renderAppAs('donateur@demo.jigi', '/dons');
    expect(await screen.findByRole('heading', { level: 1, name: 'Accès refusé' })).toBeInTheDocument();
  });

  it('réserve la page Utilisateurs à l’administrateur', async () => {
    await renderAppAs('gestionnaire@demo.jigi', '/utilisateurs');
    expect(await screen.findByRole('heading', { level: 1, name: 'Accès refusé' })).toBeInTheDocument();
  });

  it('envoie un donateur sur son espace « Mes dons » et ne montre que ses dons', async () => {
    await renderAppAs('donateur@demo.jigi', '/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Mes dons' })).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: /Historique de mes dons/ });
    // 4 dons du donateur « Aminata Traoré » + la ligne d'en-tête.
    expect(within(table).getAllByRole('row')).toHaveLength(5);
  });
});

describe('Tableau de bord', () => {
  it('affiche les totaux séparés par devise', async () => {
    await renderAppAs('admin@demo.jigi', '/');
    const table = await screen.findByRole('table', { name: /Collecté, utilisé et solde disponible/ });
    expect(within(table).getByRole('rowheader', { name: 'FCFA' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: '$US' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: '€' })).toBeInTheDocument();
  });
});
