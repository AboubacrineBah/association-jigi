import { useState } from 'react';
import { Alert, Button, Card, Form, Table } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { resolverFor } from '../components/forms/FormModal';
import { DemoBanner } from '../components/ui/DemoBanner';
import { Logo } from '../components/ui/Logo';
import { homePathFor } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { DEMO_PASSWORD, TEST_ACCOUNTS } from '../api/seed';
import { IS_MOCK_API } from '../api';
import { loginSchema } from '../schemas/entities';
import type { FormValues } from '../schemas/common';

export function LoginView() {
  usePageTitle('Connexion');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: '', password: '' }, resolver: resolverFor(loginSchema) });

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const submit = handleSubmit(async (values) => {
    setError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) return;
    const result = await login(parsed.data);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    const state: unknown = location.state;
    const from = typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string' ? state.from : null;
    navigate(from && from !== '/connexion' ? from : homePathFor(result.data.role), { replace: true });
  });

  return (
    <div className="login-page">
      <DemoBanner />
      <div className="login-split">
        <section className="login-brand" aria-label="Présentation">
          <Logo size={120} ring decorative />
          <p className="brand-name display-5 mb-0">Jigi Dons</p>
          <p className="fs-5 text-white-50">Suivre chaque don, de sa réception à sa redistribution.</p>
        </section>
        <main id="contenu" className="flex-grow-1 d-flex flex-column align-items-center justify-content-center gap-3 p-3 p-md-4">
          <div className="d-lg-none text-center">
            <Logo size={88} />
            <p className="brand-name h3 mb-0 mt-2">Jigi Dons</p>
            <p className="small text-body-secondary">Suivi des dons de l’Association Jigi</p>
          </div>
          <Card className="login-card">
            <Card.Body>
              <h1 className="h4 mb-3">Connexion</h1>
              {error ? (
                <Alert variant="danger" role="alert">
                  <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                  {error}
                </Alert>
              ) : null}
              <Form noValidate onSubmit={submit}>
                <Form.Group className="mb-3" controlId="login-email">
                  <Form.Label className="fw-semibold small">Adresse e-mail</Form.Label>
                  <Form.Control type="email" autoComplete="username" isInvalid={Boolean(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} {...register('email')} />
                  {errors.email ? (
                    <Form.Control.Feedback type="invalid" id="login-email-error" role="alert">
                      {errors.email.message}
                    </Form.Control.Feedback>
                  ) : null}
                </Form.Group>
                <Form.Group className="mb-3" controlId="login-password">
                  <Form.Label className="fw-semibold small">Mot de passe</Form.Label>
                  <Form.Control type="password" autoComplete="current-password" isInvalid={Boolean(errors.password)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : undefined} {...register('password')} />
                  {errors.password ? (
                    <Form.Control.Feedback type="invalid" id="login-password-error" role="alert">
                      {errors.password.message}
                    </Form.Control.Feedback>
                  ) : null}
                </Form.Group>
                <Button type="submit" className="w-100" disabled={isSubmitting}>
                  {isSubmitting ? 'Connexion…' : 'Se connecter'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <p className="login-card small bg-white border rounded p-3 mb-0">
            <strong>Démonstration.</strong> Ne saisissez aucune donnée personnelle réelle.
            {IS_MOCK_API ? ' Comptes de test (mot de passe commun) :' : ' Des comptes de test existent pour chaque rôle.'}
          </p>
          {IS_MOCK_API ? (
            <Table size="sm" className="login-card small mb-0" aria-label="Comptes de test">
              <thead>
                <tr>
                  <th scope="col">Rôle</th>
                  <th scope="col">Adresse e-mail</th>
                </tr>
              </thead>
              <tbody>
                {TEST_ACCOUNTS.map((account) => (
                  <tr key={account.email}>
                    <th scope="row">{account.roleLabel}</th>
                    <td>{account.email}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">Mot de passe</th>
                  <td>{DEMO_PASSWORD}</td>
                </tr>
              </tbody>
            </Table>
          ) : null}
        </main>
      </div>
    </div>
  );
}
