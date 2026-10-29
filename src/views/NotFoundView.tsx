import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';

export function NotFoundView() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <p>Cette page n’existe pas.</p>
      <Link to="/">Retour à l’accueil</Link>
    </>
  );
}
