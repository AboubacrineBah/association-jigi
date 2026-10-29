import { useCallback, useState } from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { FormModal } from '../components/forms/FormModal';
import type { FieldDef } from '../components/forms/FormModal';
import { AmountText } from '../components/ui/AmountText';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataState } from '../components/ui/DataState';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { PageHeader } from '../components/ui/PageHeader';
import { RowActions } from '../components/ui/RowActions';
import { ALLOCATION_CATEGORY_LABELS, BENEFICIARY_TYPE_LABELS, CURRENCIES } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useResource } from '../hooks/useResource';
import { beneficiarySchema, beneficiaryValues } from '../schemas/entities';
import type { Allocation, Beneficiary } from '../types';
import { formatDate } from '../utils/dates';
import { optionsOf } from '../utils/options';
import { joinResults } from '../utils/results';

/** Total reçu par un bénéficiaire (redistributions uniquement), devise par devise. */
function ReceivedTotals({ allocations }: { allocations: readonly Allocation[] }) {
  const lines = CURRENCIES.map((currency) => ({ currency, amount: allocations.filter((item) => item.currency === currency).reduce((total, item) => total + item.amount, 0) })).filter((line) => line.amount > 0);
  if (lines.length === 0) return <span className="text-body-secondary">Aucune aide</span>;
  return (
    <>
      {lines.map((line) => (
        <div key={line.currency}>
          <AmountText amount={line.amount} currency={line.currency} />
        </div>
      ))}
    </>
  );
}

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Nom', type: 'text', wide: true },
  { name: 'type', label: 'Type', type: 'select', options: optionsOf(BENEFICIARY_TYPE_LABELS) },
  { name: 'city', label: 'Ville', type: 'text' },
  { name: 'contact', label: 'Contact', type: 'text', wide: true },
  { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
];

export function BeneficiariesView() {
  const api = useApi();
  const { canWrite } = useAuth();
  const load = useCallback(async () => joinResults<[Beneficiary[], Allocation[]]>(await Promise.all([api.beneficiaries.list(), api.allocations.list()])), [api]);
  const { state, reload } = useResource(load);
  const editor = useEntityEditor(api.beneficiaries, reload, { saved: 'Bénéficiaire enregistré.', deleted: 'Bénéficiaire supprimé.' });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        title="Bénéficiaires"
        subtitle="Suivre les redistributions."
        actions={canWrite ? <Button onClick={editor.openNew}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Nouveau bénéficiaire</Button> : null}
      />
      <DataState state={state} onRetry={reload} what="les bénéficiaires">
        {([beneficiaries, allocations]) => {
          const receivedBy = (id: number): Allocation[] => allocations.filter((item) => item.kind === 'redistribution' && item.beneficiaryId === id);
          const needle = search.trim().toLowerCase();
          const rows = beneficiaries.filter((item) => !needle || `${item.name} ${item.city}`.toLowerCase().includes(needle));
          const selected = beneficiaries.find((item) => item.id === selectedId) ?? null;

          const columns: Column<Beneficiary>[] = [
            {
              key: 'name',
              header: 'Bénéficiaire',
              rowHeader: true,
              sortValue: (item) => item.name,
              render: (item) => (
                <Button variant="link" className="p-0 fw-semibold text-start" onClick={() => setSelectedId(item.id)} aria-pressed={item.id === selectedId}>
                  {item.name}
                </Button>
              ),
            },
            { key: 'type', header: 'Type', render: (item) => BENEFICIARY_TYPE_LABELS[item.type] },
            { key: 'city', header: 'Ville', render: (item) => item.city || '—' },
            { key: 'total', header: 'Total reçu', align: 'end', render: (item) => <ReceivedTotals allocations={receivedBy(item.id)} /> },
          ];

          return (
            <Row className="g-3">
              <Col lg={8}>
                <Form className="card card-body mb-3" role="search" aria-label="Filtrer les bénéficiaires" onSubmit={(event) => event.preventDefault()}>
                  <Form.Label htmlFor="b-search" className="small fw-semibold mb-1">Recherche</Form.Label>
                  <Form.Control id="b-search" type="search" placeholder="Nom, ville…" value={search} onChange={(event) => setSearch(event.target.value)} />
                </Form>
                <DataTable
                  caption="Liste des bénéficiaires"
                  columns={columns}
                  rows={rows}
                  rowKey={(item) => item.id}
                  emptyMessage="Aucun bénéficiaire ne correspond à cette recherche."
                  actions={canWrite ? (item) => <RowActions target={`le bénéficiaire ${item.name}`} onEdit={() => editor.openEdit(item)} onDelete={() => editor.askDelete(item)} /> : undefined}
                />
              </Col>
              <Col lg={4}>
                <Card as="aside" aria-labelledby="beneficiary-detail-title">
                  <Card.Body>
                    {selected ? (
                      <>
                        <h2 className="h5 mb-0" id="beneficiary-detail-title">{selected.name}</h2>
                        <p className="small text-body-secondary">{BENEFICIARY_TYPE_LABELS[selected.type]}{selected.city ? ` · ${selected.city}` : ''}</p>
                        <p className="small mb-1 fw-semibold">Total reçu</p>
                        <div className="mb-3"><ReceivedTotals allocations={receivedBy(selected.id)} /></div>
                        <h3 className="h6">Ce qu’il a reçu</h3>
                        <DataTable
                          caption={`Aides reçues par ${selected.name}`}
                          pageSize={5}
                          rows={receivedBy(selected.id)}
                          rowKey={(item) => item.id}
                          initialSort={{ key: 'date', direction: 'descending' }}
                          emptyMessage="Aucune aide enregistrée."
                          columns={[
                            { key: 'date', header: 'Date', render: (item) => formatDate(item.date), sortValue: (item) => item.date },
                            { key: 'amount', header: 'Montant', align: 'end', render: (item) => <AmountText amount={item.amount} currency={item.currency} /> },
                            { key: 'category', header: 'Catégorie', render: (item) => ALLOCATION_CATEGORY_LABELS[item.category] },
                          ]}
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="h5" id="beneficiary-detail-title">Fiche bénéficiaire</h2>
                        <p className="text-body-secondary small mb-0">Sélectionnez un bénéficiaire pour voir l’historique de ce qu’il a reçu.</p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              {editor.isOpen ? (
                <FormModal title={editor.current ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'} fields={FIELDS} initialValues={beneficiaryValues(editor.current)} schema={beneficiarySchema} onSubmit={editor.save} onClose={editor.closeEditor} />
              ) : null}
              <ConfirmDialog show={editor.deleting !== null} title="Supprimer ce bénéficiaire ?" message={editor.deleting ? `La fiche de ${editor.deleting.name} sera définitivement supprimée.` : ''} confirmLabel="Supprimer" onConfirm={() => void editor.confirmDelete()} onCancel={editor.cancelDelete} />
            </Row>
          );
        }}
      </DataState>
    </>
  );
}
