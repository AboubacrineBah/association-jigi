import { useCallback, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { FormModal } from '../components/forms/FormModal';
import type { FieldDef } from '../components/forms/FormModal';
import { AmountText } from '../components/ui/AmountText';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataState } from '../components/ui/DataState';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { DonationStatusBadge } from '../components/ui/DonationStatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { RowActions } from '../components/ui/RowActions';
import { CURRENCY_LABELS, DONATION_STATUS_LABELS, PAYMENT_MODE_LABELS } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useResource } from '../hooks/useResource';
import { donationSchema, donationValues } from '../schemas/entities';
import type { Campaign, Donation, Donor } from '../types';
import { formatDate } from '../utils/dates';
import { entityOptions, optionsOf } from '../utils/options';
import { joinResults } from '../utils/results';

interface Filters {
  search: string;
  currency: string;
  status: string;
  campaignId: string;
  mode: string;
  from: string;
  to: string;
}

const NO_FILTERS: Filters = { search: '', currency: '', status: '', campaignId: '', mode: '', from: '', to: '' };
const ALL = { value: '', label: 'Tous' };

export function DonationsView() {
  const api = useApi();
  const { canWrite } = useAuth();
  const load = useCallback(async () => joinResults<[Donation[], Donor[], Campaign[]]>(await Promise.all([api.donations.list(), api.donors.list(), api.campaigns.list()])), [api]);
  const { state, reload } = useResource(load);
  const editor = useEntityEditor(api.donations, reload, { saved: 'Don enregistré.', deleted: 'Don supprimé.' });
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  const setFilter = (name: keyof Filters) => (event: { target: { value: string } }) => setFilters((previous) => ({ ...previous, [name]: event.target.value }));

  return (
    <>
      <PageHeader
        title="Dons"
        subtitle="Enregistrer et retrouver n’importe quel don."
        actions={
          canWrite ? (
            <Button onClick={editor.openNew}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              Nouveau don
            </Button>
          ) : null
        }
      />
      <DataState state={state} onRetry={reload} what="les dons">
        {([donations, donors, campaigns]) => {
          const donorName = (id: number): string => donors.find((donor) => donor.id === id)?.name ?? 'Donateur inconnu';
          const campaignName = (id: number | null): string => (id === null ? '—' : (campaigns.find((campaign) => campaign.id === id)?.name ?? '—'));
          const needle = filters.search.trim().toLowerCase();
          const rows = donations.filter(
            (donation) =>
              (!needle || donorName(donation.donorId).toLowerCase().includes(needle) || donation.reference.toLowerCase().includes(needle)) &&
              (!filters.currency || donation.currency === filters.currency) &&
              (!filters.status || donation.status === filters.status) &&
              (!filters.mode || donation.paymentMode === filters.mode) &&
              (!filters.campaignId || String(donation.campaignId) === filters.campaignId) &&
              (!filters.from || donation.date >= filters.from) &&
              (!filters.to || donation.date <= filters.to),
          );

          const columns: Column<Donation>[] = [
            { key: 'date', header: 'Date', render: (d) => formatDate(d.date), sortValue: (d) => d.date },
            { key: 'donor', header: 'Donateur', rowHeader: true, render: (d) => donorName(d.donorId), sortValue: (d) => donorName(d.donorId) },
            { key: 'campaign', header: 'Campagne', render: (d) => campaignName(d.campaignId) },
            { key: 'amount', header: 'Montant', align: 'end', render: (d) => <AmountText amount={d.amount} currency={d.currency} />, sortValue: (d) => d.amount },
            { key: 'mode', header: 'Mode', render: (d) => PAYMENT_MODE_LABELS[d.paymentMode] },
            { key: 'status', header: 'Statut', render: (d) => <DonationStatusBadge status={d.status} /> },
          ];

          const fields: FieldDef[] = [
            { name: 'donorId', label: 'Donateur', type: 'select', options: entityOptions(donors, (donor) => donor.name, '— Choisir un donateur —') },
            { name: 'campaignId', label: 'Campagne (facultative)', type: 'select', options: entityOptions(campaigns, (campaign) => campaign.name, '— Aucune —') },
            { name: 'amount', label: 'Montant', type: 'amount', placeholder: 'Ex. 25 000 ou 1 250,50' },
            { name: 'currency', label: 'Devise', type: 'select', options: optionsOf(CURRENCY_LABELS) },
            { name: 'date', label: 'Date', type: 'date' },
            { name: 'paymentMode', label: 'Mode de paiement', type: 'select', options: optionsOf(PAYMENT_MODE_LABELS) },
            { name: 'status', label: 'Statut', type: 'select', options: optionsOf(DONATION_STATUS_LABELS) },
            { name: 'reference', label: 'Référence', type: 'text' },
            { name: 'note', label: 'Note', type: 'textarea', wide: true },
          ];

          return (
            <>
              <Form className="card card-body mb-3" role="search" aria-label="Filtrer les dons" onSubmit={(event) => event.preventDefault()}>
                <Row className="g-2">
                  <Col md={6} lg={4}>
                    <Form.Label htmlFor="f-search" className="small fw-semibold mb-1">Recherche</Form.Label>
                    <Form.Control id="f-search" type="search" placeholder="Donateur, référence…" value={filters.search} onChange={setFilter('search')} />
                  </Col>
                  <Col xs={6} md={3} lg={2}>
                    <Form.Label htmlFor="f-from" className="small fw-semibold mb-1">Du</Form.Label>
                    <Form.Control id="f-from" type="date" value={filters.from} onChange={setFilter('from')} />
                  </Col>
                  <Col xs={6} md={3} lg={2}>
                    <Form.Label htmlFor="f-to" className="small fw-semibold mb-1">Au</Form.Label>
                    <Form.Control id="f-to" type="date" value={filters.to} onChange={setFilter('to')} />
                  </Col>
                  <Col xs={6} md={3} lg={2}>
                    <Form.Label htmlFor="f-currency" className="small fw-semibold mb-1">Devise</Form.Label>
                    <Form.Select id="f-currency" value={filters.currency} onChange={setFilter('currency')}>
                      {[ALL, ...optionsOf(CURRENCY_LABELS)].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Form.Select>
                  </Col>
                  <Col xs={6} md={3} lg={2}>
                    <Form.Label htmlFor="f-status" className="small fw-semibold mb-1">Statut</Form.Label>
                    <Form.Select id="f-status" value={filters.status} onChange={setFilter('status')}>
                      {[ALL, ...optionsOf(DONATION_STATUS_LABELS)].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Form.Select>
                  </Col>
                  <Col xs={6} md={4} lg={4}>
                    <Form.Label htmlFor="f-campaign" className="small fw-semibold mb-1">Campagne</Form.Label>
                    <Form.Select id="f-campaign" value={filters.campaignId} onChange={setFilter('campaignId')}>
                      {[ALL, ...entityOptions(campaigns, (campaign) => campaign.name, '').slice(1)].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Form.Select>
                  </Col>
                  <Col xs={6} md={4} lg={3}>
                    <Form.Label htmlFor="f-mode" className="small fw-semibold mb-1">Mode de paiement</Form.Label>
                    <Form.Select id="f-mode" value={filters.mode} onChange={setFilter('mode')}>
                      {[ALL, ...optionsOf(PAYMENT_MODE_LABELS)].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Form.Select>
                  </Col>
                  <Col xs={12} md={4} lg={5} className="d-flex align-items-end">
                    <Button variant="outline-primary" size="sm" onClick={() => setFilters(NO_FILTERS)}>Réinitialiser les filtres</Button>
                  </Col>
                </Row>
              </Form>

              {donations.length === 0 ? (
                <EmptyState
                  title="Aucun don enregistré."
                  hint="Les dons apparaîtront ici dès leur saisie."
                  action={canWrite ? <Button onClick={editor.openNew}>Enregistrer le premier don</Button> : undefined}
                />
              ) : (
                <DataTable
                  caption="Liste des dons"
                  columns={columns}
                  rows={rows}
                  rowKey={(donation) => donation.id}
                  initialSort={{ key: 'date', direction: 'descending' }}
                  emptyMessage="Aucun don ne correspond à ces filtres."
                  actions={canWrite ? (donation) => <RowActions target={`le don du ${formatDate(donation.date)} (${donorName(donation.donorId)})`} onEdit={() => editor.openEdit(donation)} onDelete={() => editor.askDelete(donation)} /> : undefined}
                />
              )}

              {editor.isOpen ? (
                <FormModal
                  title={editor.current ? 'Modifier le don' : 'Nouveau don'}
                  fields={fields}
                  initialValues={donationValues(editor.current)}
                  schema={donationSchema}
                  onSubmit={editor.save}
                  onClose={editor.closeEditor}
                />
              ) : null}
              <ConfirmDialog
                show={editor.deleting !== null}
                title="Supprimer ce don ?"
                message={editor.deleting ? `Le don du ${formatDate(editor.deleting.date)} sera définitivement supprimé.` : ''}
                confirmLabel="Supprimer"
                onConfirm={() => void editor.confirmDelete()}
                onCancel={editor.cancelDelete}
              />
            </>
          );
        }}
      </DataState>
    </>
  );
}
