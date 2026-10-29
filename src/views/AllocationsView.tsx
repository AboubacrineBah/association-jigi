import { useCallback } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';
import { FormModal } from '../components/forms/FormModal';
import type { FieldDef } from '../components/forms/FormModal';
import { AmountText } from '../components/ui/AmountText';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataState } from '../components/ui/DataState';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { RowActions } from '../components/ui/RowActions';
import { ALLOCATION_CATEGORY_LABELS, ALLOCATION_KIND_LABELS, CURRENCY_LABELS, CURRENCY_META } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useResource } from '../hooks/useResource';
import { allocationSchema, allocationValues } from '../schemas/entities';
import type { Allocation, Beneficiary, Campaign, Stats } from '../types';
import { formatDate } from '../utils/dates';
import { entityOptions, optionsOf } from '../utils/options';
import { joinResults } from '../utils/results';

export function AllocationsView() {
  const api = useApi();
  const { canWrite } = useAuth();
  const load = useCallback(
    async () => joinResults<[Allocation[], Beneficiary[], Campaign[], Stats]>(await Promise.all([api.allocations.list(), api.beneficiaries.list(), api.campaigns.list(), api.stats()])),
    [api],
  );
  const { state, reload } = useResource(load);
  const editor = useEntityEditor(api.allocations, reload, { saved: 'Utilisation enregistrée.', deleted: 'Utilisation supprimée.' });

  return (
    <>
      <PageHeader
        title="Utilisations"
        subtitle="Tracer ce que deviennent les dons. Solde disponible = dons reçus − utilisations, devise par devise."
        actions={canWrite ? <Button onClick={editor.openNew}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Nouvelle utilisation</Button> : null}
      />
      <DataState state={state} onRetry={reload} what="les utilisations">
        {([allocations, beneficiaries, campaigns, stats]) => {
          const beneficiaryName = (id: number | null): string => (id === null ? '—' : (beneficiaries.find((item) => item.id === id)?.name ?? '—'));
          const campaignName = (id: number | null): string => (id === null ? '—' : (campaigns.find((item) => item.id === id)?.name ?? '—'));

          const columns: Column<Allocation>[] = [
            { key: 'kind', header: 'Type', rowHeader: true, render: (a) => ALLOCATION_KIND_LABELS[a.kind], sortValue: (a) => a.kind },
            { key: 'beneficiary', header: 'Bénéficiaire', render: (a) => beneficiaryName(a.beneficiaryId) },
            { key: 'campaign', header: 'Campagne', render: (a) => campaignName(a.campaignId) },
            { key: 'amount', header: 'Montant', align: 'end', render: (a) => <AmountText amount={a.amount} currency={a.currency} />, sortValue: (a) => a.amount },
            { key: 'date', header: 'Date', render: (a) => formatDate(a.date), sortValue: (a) => a.date },
            { key: 'category', header: 'Catégorie', render: (a) => ALLOCATION_CATEGORY_LABELS[a.category] },
          ];

          const fields: FieldDef[] = [
            { name: 'kind', label: 'Type', type: 'select', options: optionsOf(ALLOCATION_KIND_LABELS) },
            { name: 'beneficiaryId', label: 'Bénéficiaire (obligatoire pour une redistribution)', type: 'select', options: entityOptions(beneficiaries, (item) => item.name, '— Aucun —') },
            { name: 'amount', label: 'Montant', type: 'amount', placeholder: 'Ex. 150 000 ou 400,00' },
            { name: 'currency', label: 'Devise', type: 'select', options: optionsOf(CURRENCY_LABELS) },
            { name: 'date', label: 'Date', type: 'date' },
            { name: 'category', label: 'Catégorie', type: 'select', options: optionsOf(ALLOCATION_CATEGORY_LABELS) },
            { name: 'campaignId', label: 'Campagne (facultative)', type: 'select', options: entityOptions(campaigns, (item) => item.name, '— Aucune —'), wide: true },
            { name: 'description', label: 'Description', type: 'textarea', wide: true },
          ];

          return (
            <>
              <Row xs={1} md={3} className="g-3 mb-3">
                {stats.totals.map((total) => (
                  <Col key={total.currency}>
                    <Card as="section" aria-label={`Solde disponible en ${CURRENCY_META[total.currency].code}`}>
                      <Card.Body>
                        <p className="small text-body-secondary mb-1">Solde disponible · {CURRENCY_META[total.currency].label}</p>
                        <p className="h4 mb-0 stat-positive"><AmountText amount={total.balance} currency={total.currency} /></p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              <DataTable
                caption="Redistributions et dépenses"
                columns={columns}
                rows={allocations}
                rowKey={(allocation) => allocation.id}
                initialSort={{ key: 'date', direction: 'descending' }}
                emptyMessage="Aucune utilisation enregistrée."
                actions={canWrite ? (allocation) => <RowActions target={`l’utilisation du ${formatDate(allocation.date)}`} onEdit={() => editor.openEdit(allocation)} onDelete={() => editor.askDelete(allocation)} /> : undefined}
              />
              {editor.isOpen ? (
                <FormModal
                  title={editor.current ? 'Modifier l’utilisation' : 'Nouvelle utilisation'}
                  intro={<p className="small text-body-secondary">Le montant ne peut pas dépasser le solde disponible de la devise choisie.</p>}
                  fields={fields}
                  initialValues={allocationValues(editor.current)}
                  schema={allocationSchema}
                  onSubmit={editor.save}
                  onClose={editor.closeEditor}
                />
              ) : null}
              <ConfirmDialog show={editor.deleting !== null} title="Supprimer cette utilisation ?" message="Le solde disponible sera recalculé." confirmLabel="Supprimer" onConfirm={() => void editor.confirmDelete()} onCancel={editor.cancelDelete} />
            </>
          );
        }}
      </DataState>
    </>
  );
}
