import { useCallback, useState } from 'react';
import { Button, Card, Col, Form, Row } from 'react-bootstrap';
import { FormModal } from '../components/forms/FormModal';
import type { FieldDef } from '../components/forms/FormModal';
import { AmountText } from '../components/ui/AmountText';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataState } from '../components/ui/DataState';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { DonationStatusBadge } from '../components/ui/DonationStatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { RowActions } from '../components/ui/RowActions';
import { CURRENCIES, DONOR_TYPE_LABELS } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useResource } from '../hooks/useResource';
import { donorSchema, donorValues } from '../schemas/entities';
import type { Donation, Donor } from '../types';
import { formatDate } from '../utils/dates';
import { optionsOf } from '../utils/options';
import { joinResults } from '../utils/results';
import { receivedDonations } from '../utils/stats';

/** Totaux cumulés d'un donateur, par devise (dons reçus uniquement). */
function TotalsByCurrency({ donations }: { donations: readonly Donation[] }) {
  const received = receivedDonations(donations);
  const lines = CURRENCIES.map((currency) => ({ currency, amount: received.filter((donation) => donation.currency === currency).reduce((total, donation) => total + donation.amount, 0) })).filter((line) => line.amount > 0);
  if (lines.length === 0) return <span className="text-body-secondary">Aucun don reçu</span>;
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

export function DonorsView() {
  const api = useApi();
  const { canWrite } = useAuth();
  const load = useCallback(async () => joinResults<[Donor[], Donation[]]>(await Promise.all([api.donors.list(), api.donations.list()])), [api]);
  const { state, reload } = useResource(load);
  const editor = useEntityEditor(api.donors, reload, { saved: 'Donateur enregistré.', deleted: 'Donateur supprimé.' });
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fields: FieldDef[] = [
    { name: 'name', label: 'Nom', type: 'text', wide: true },
    { name: 'type', label: 'Type', type: 'select', options: optionsOf(DONOR_TYPE_LABELS) },
    { name: 'phone', label: 'Téléphone', type: 'text' },
    { name: 'email', label: 'Adresse e-mail', type: 'email' },
    { name: 'city', label: 'Ville', type: 'text' },
    { name: 'country', label: 'Pays', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea', wide: true },
  ];

  return (
    <>
      <PageHeader
        title="Donateurs"
        subtitle="Connaître et fidéliser les donateurs."
        actions={canWrite ? <Button onClick={editor.openNew}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Nouveau donateur</Button> : null}
      />
      <DataState state={state} onRetry={reload} what="les donateurs">
        {([donors, donations]) => {
          const needle = search.trim().toLowerCase();
          const rows = donors.filter((donor) => (!type || donor.type === type) && (!needle || `${donor.name} ${donor.city} ${donor.country}`.toLowerCase().includes(needle)));
          const donationsOf = (donorId: number): Donation[] => donations.filter((donation) => donation.donorId === donorId);
          const selected = donors.find((donor) => donor.id === selectedId) ?? null;

          const columns: Column<Donor>[] = [
            {
              key: 'name',
              header: 'Donateur',
              rowHeader: true,
              sortValue: (donor) => donor.name,
              render: (donor) => (
                <Button variant="link" className="p-0 fw-semibold text-start" onClick={() => setSelectedId(donor.id)} aria-pressed={donor.id === selectedId}>
                  {donor.name}
                </Button>
              ),
            },
            { key: 'type', header: 'Type', render: (donor) => DONOR_TYPE_LABELS[donor.type] },
            { key: 'place', header: 'Ville, pays', render: (donor) => [donor.city, donor.country].filter(Boolean).join(', ') || '—' },
            { key: 'total', header: 'Total cumulé', align: 'end', render: (donor) => <TotalsByCurrency donations={donationsOf(donor.id)} /> },
          ];

          return (
            <Row className="g-3">
              <Col lg={8}>
                <Form className="card card-body mb-3" role="search" aria-label="Filtrer les donateurs" onSubmit={(event) => event.preventDefault()}>
                  <Row className="g-2">
                    <Col sm={8}>
                      <Form.Label htmlFor="d-search" className="small fw-semibold mb-1">Recherche</Form.Label>
                      <Form.Control id="d-search" type="search" placeholder="Nom, ville, pays…" value={search} onChange={(event) => setSearch(event.target.value)} />
                    </Col>
                    <Col sm={4}>
                      <Form.Label htmlFor="d-type" className="small fw-semibold mb-1">Type</Form.Label>
                      <Form.Select id="d-type" value={type} onChange={(event) => setType(event.target.value)}>
                        <option value="">Tous</option>
                        {optionsOf(DONOR_TYPE_LABELS).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Form.Select>
                    </Col>
                  </Row>
                </Form>
                <DataTable
                  caption="Liste des donateurs"
                  columns={columns}
                  rows={rows}
                  rowKey={(donor) => donor.id}
                  emptyMessage="Aucun donateur ne correspond à cette recherche."
                  actions={canWrite ? (donor) => <RowActions target={`le donateur ${donor.name}`} onEdit={() => editor.openEdit(donor)} onDelete={() => editor.askDelete(donor)} /> : undefined}
                />
              </Col>
              <Col lg={4}>
                <Card as="aside" aria-labelledby="donor-detail-title" className="position-sticky" style={{ top: '1rem' }}>
                  <Card.Body>
                    {selected ? (
                      <>
                        <h2 className="h5 mb-0" id="donor-detail-title">{selected.name}</h2>
                        <p className="text-body-secondary small">{DONOR_TYPE_LABELS[selected.type]} · donateur depuis le {formatDate(selected.createdAt)}</p>
                        <dl className="small mb-3">
                          <dt>Téléphone</dt><dd>{selected.phone || '—'}</dd>
                          <dt>Adresse e-mail</dt><dd>{selected.email || '—'}</dd>
                          <dt>Total cumulé</dt><dd><TotalsByCurrency donations={donationsOf(selected.id)} /></dd>
                        </dl>
                        <h3 className="h6">Historique des dons</h3>
                        <DataTable
                          caption={`Dons de ${selected.name}`}
                          pageSize={5}
                          rows={donationsOf(selected.id)}
                          rowKey={(donation) => donation.id}
                          initialSort={{ key: 'date', direction: 'descending' }}
                          emptyMessage="Aucun don pour ce donateur."
                          columns={[
                            { key: 'date', header: 'Date', render: (donation) => formatDate(donation.date), sortValue: (donation) => donation.date },
                            { key: 'amount', header: 'Montant', align: 'end', render: (donation) => <AmountText amount={donation.amount} currency={donation.currency} /> },
                            { key: 'status', header: 'Statut', render: (donation) => <DonationStatusBadge status={donation.status} /> },
                          ]}
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="h5" id="donor-detail-title">Fiche donateur</h2>
                        <p className="text-body-secondary small mb-0">Sélectionnez un donateur dans la liste pour voir ses coordonnées et son historique.</p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              {editor.isOpen ? (
                <FormModal title={editor.current ? 'Modifier le donateur' : 'Nouveau donateur'} fields={fields} initialValues={donorValues(editor.current)} schema={donorSchema} onSubmit={editor.save} onClose={editor.closeEditor} />
              ) : null}
              <ConfirmDialog show={editor.deleting !== null} title="Supprimer ce donateur ?" message={editor.deleting ? `La fiche de ${editor.deleting.name} sera définitivement supprimée.` : ''} confirmLabel="Supprimer" onConfirm={() => void editor.confirmDelete()} onCancel={editor.cancelDelete} />
            </Row>
          );
        }}
      </DataState>
    </>
  );
}
