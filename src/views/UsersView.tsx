import { useCallback } from 'react';
import { Button } from 'react-bootstrap';
import { FormModal } from '../components/forms/FormModal';
import type { FieldDef } from '../components/forms/FormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataState } from '../components/ui/DataState';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { RowActions } from '../components/ui/RowActions';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ROLE_LABELS } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useResource } from '../hooks/useResource';
import { userSchema, userValues } from '../schemas/entities';
import type { Donor, User } from '../types';
import { entityOptions, optionsOf } from '../utils/options';
import { joinResults } from '../utils/results';

export function UsersView() {
  const api = useApi();
  const load = useCallback(async () => joinResults<[User[], Donor[]]>(await Promise.all([api.users.list(), api.donors.list()])), [api]);
  const { state, reload } = useResource(load);
  const editor = useEntityEditor(api.users, reload, { saved: 'Utilisateur enregistré.', deleted: 'Utilisateur supprimé.' });

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Créer les comptes et attribuer les rôles." actions={<Button onClick={editor.openNew}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Nouvel utilisateur</Button>} />
      <DataState state={state} onRetry={reload} what="les utilisateurs">
        {([users, donors]) => {
          const donorName = (id: number | null): string => (id === null ? '—' : (donors.find((item) => item.id === id)?.name ?? '—'));
          const columns: Column<User>[] = [
            { key: 'name', header: 'Nom', rowHeader: true, sortValue: (user) => user.name, render: (user) => user.name },
            { key: 'email', header: 'Adresse e-mail', render: (user) => user.email },
            { key: 'role', header: 'Rôle', sortValue: (user) => user.role, render: (user) => ROLE_LABELS[user.role] },
            { key: 'active', header: 'Compte', render: (user) => <StatusBadge tone={user.active ? 'success' : 'danger'}>{user.active ? 'Actif' : 'Inactif'}</StatusBadge> },
            { key: 'donor', header: 'Fiche donateur', render: (user) => donorName(user.donorId) },
          ];
          const fields: FieldDef[] = [
            { name: 'name', label: 'Nom', type: 'text' },
            { name: 'email', label: 'Adresse e-mail', type: 'email' },
            { name: 'role', label: 'Rôle', type: 'select', options: optionsOf(ROLE_LABELS) },
            { name: 'active', label: 'Compte', type: 'select', options: [{ value: 'true', label: 'Actif' }, { value: 'false', label: 'Inactif' }] },
            { name: 'donorId', label: 'Fiche donateur liée (rôle « donateur » uniquement)', type: 'select', options: entityOptions(donors, (donor) => donor.name, '— Aucune —'), wide: true },
          ];
          return (
            <>
              <DataTable
                caption="Comptes utilisateurs"
                columns={columns}
                rows={users}
                rowKey={(user) => user.id}
                actions={(user) => <RowActions target={`le compte de ${user.name}`} onEdit={() => editor.openEdit(user)} onDelete={() => editor.askDelete(user)} />}
              />
              {editor.isOpen ? (
                <FormModal
                  title={editor.current ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
                  intro={<p className="small text-body-secondary">Le compte donateur est créé par l’association : il donne accès en lecture seule aux seuls dons de la fiche liée.</p>}
                  fields={fields}
                  initialValues={userValues(editor.current)}
                  schema={userSchema}
                  onSubmit={editor.save}
                  onClose={editor.closeEditor}
                />
              ) : null}
              <ConfirmDialog show={editor.deleting !== null} title="Supprimer ce compte ?" message={editor.deleting ? `Le compte de ${editor.deleting.name} sera définitivement supprimé.` : ''} confirmLabel="Supprimer" onConfirm={() => void editor.confirmDelete()} onCancel={editor.cancelDelete} />
            </>
          );
        }}
      </DataState>
    </>
  );
}
