import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../config/navigation';
import { PageHeader } from '../components/ui/PageHeader';

export function ForbiddenView() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Accès refusé" />
      <p>Votre rôle ne permet pas d’accéder à cette page.</p>
      <Link to={user ? homePathFor(user.role) : '/connexion'}>Retour à mon espace</Link>
    </>
  );
}
