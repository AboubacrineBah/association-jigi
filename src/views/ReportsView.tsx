import { useCallback, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { AmountText } from '../components/ui/AmountText';
import { DataState } from '../components/ui/DataState';
import { DataTable } from '../components/ui/DataTable';
import { DonationStatusBadge } from '../components/ui/DonationStatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { ALLOCATION_CATEGORY_LABELS, ALLOCATION_KIND_LABELS, CURRENCY_LABELS, DONATION_STATUS_LABELS, PAYMENT_MODE_LABELS } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import type { Allocation, Beneficiary, Campaign, Donation, Donor } from '../types';
import { downloadCsv, toCsv } from '../utils/csv';
import { formatDate, toIsoDate } from '../utils/dates';
import { entityOptions, optionsOf } from '../utils/options';
import { toInputAmount } from '../utils/money';
import { joinResults } from '../utils/results';

export function ReportsView() {
  const api = useApi();
  const { canWrite } = useAuth();
  const load = useCallback(
    async () =>
      joinResults<[Donation[], Donor[], Campaign[], Allocation[], Beneficiary[]]>(
        await Promise.all([api.donations.list(), api.donors.list(), api.campaigns.list(), api.allocations.list(), api.beneficiaries.list()]),
      ),
    [api],
  );
  const { state, reload } = useResource(load);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [currency, setCurrency] = useState('');
  const [campaignId, setCampaignId] = useState('');

  return (
    <>
      <PageHeader title="Rapports et exports" subtitle="Rendre compte sur la période choisie. Les montants restent séparés par devise dans les fichiers exportés." />
      <DataState state={state} onRetry={reload} what="les données du rapport">
        {([donations, donors, campaigns, allocations, beneficiaries]) => {
          const donorName = (id: number): string => donors.find((item) => item.id === id)?.name ?? 'Donateur inconnu';
          const campaignName = (id: number | null): string => (id === null ? '' : (campaigns.find((item) => item.id === id)?.name ?? ''));
          const beneficiaryName = (id: number | null): string => (id === null ? '' : (beneficiaries.find((item) => item.id === id)?.name ?? ''));
          const inPeriod = (date: string): boolean => (!from || date >= from) && (!to || date <= to);
          const filteredDonations = donations.filter((item) => inPeriod(item.date) && (!currency || item.currency === currency) && (!campaignId || String(item.campaignId) === campaignId));
          const filteredAllocations = allocations.filter((item) => inPeriod(item.date) && (!currency || item.currency === currency) && (!campaignId || String(item.campaignId) === campaignId));
          const stamp = toIsoDate(new Date());

          function exportDonations(): void {
            const rows = filteredDonations.map((item) => [formatDate(item.date), donorName(item.donorId), campaignName(item.campaignId), toInputAmount(item.amount, item.currency), item.currency, PAYMENT_MODE_LABELS[item.paymentMode], DONATION_STATUS_LABELS[item.status], item.reference]);
            downloadCsv(`dons-${stamp}.csv`, toCsv(['Date', 'Donateur', 'Campagne', 'Montant', 'Devise', 'Mode de paiement', 'Statut', 'Référence'], rows));
          }

          function exportAllocations(): void {
            const rows = filteredAllocations.map((item) => [formatDate(item.date), ALLOCATION_KIND_LABELS[item.kind], beneficiaryName(item.beneficiaryId), campaignName(item.campaignId), toInputAmount(item.amount, item.currency), item.currency, ALLOCATION_CATEGORY_LABELS[item.category], item.description]);
            downloadCsv(`utilisations-${stamp}.csv`, toCsv(['Date', 'Type', 'Bénéficiaire', 'Campagne', 'Montant', 'Devise', 'Catégorie', 'Description'], rows));
          }

          return (
            <div className="d-flex flex-column gap-3">
              <Card as="section" aria-labelledby="report-filters">
                <Card.Body>
                  <h2 className="h5 mb-3" id="report-filters">Filtres</h2>
                  <Row className="g-3">
                    <Col sm={6} lg={3}>
                      <Form.Label htmlFor="r-from" className="small fw-semibold mb-1">Du</Form.Label>
                      <Form.Control id="r-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                    </Col>
                    <Col sm={6} lg={3}>
                      <Form.Label htmlFor="r-to" className="small fw-semibold mb-1">Au</Form.Label>
                      <Form.Control id="r-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                    </Col>
                    <Col sm={6} lg={3}>
                      <Form.Label htmlFor="r-currency" className="small fw-semibold mb-1">Devise</Form.Label>
                      <Form.Select id="r-currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
                        <option value="">Toutes</option>
                        {optionsOf(CURRENCY_LABELS).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Form.Select>
                    </Col>
                    <Col sm={6} lg={3}>
                      <Form.Label htmlFor="r-campaign" className="small fw-semibold mb-1">Campagne</Form.Label>
                      <Form.Select id="r-campaign" value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
                        {entityOptions(campaigns, (item) => item.name, 'Toutes').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Form.Select>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card as="section" aria-labelledby="report-preview">
                <Card.Body>
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <h2 className="h5 mb-0" id="report-preview">Aperçu</h2>
                    {canWrite ? (
                      <div className="d-flex flex-wrap gap-2">
                        <Button onClick={exportDonations}><i className="bi bi-download me-1" aria-hidden="true" />Exporter les dons (CSV)</Button>
                        <Button variant="outline-primary" onClick={exportAllocations}><i className="bi bi-download me-1" aria-hidden="true" />Exporter les utilisations (CSV)</Button>
                      </div>
                    ) : null}
                  </div>
                  <p aria-live="polite" className="fw-semibold">
                    {filteredDonations.length} don{filteredDonations.length > 1 ? 's' : ''} et {filteredAllocations.length} utilisation{filteredAllocations.length > 1 ? 's' : ''} correspondent aux filtres.
                  </p>
                  {canWrite ? null : <Alert variant="secondary" className="small">Les exports sont réservés aux administrateurs et gestionnaires.</Alert>}
                  <DataTable
                    caption="Aperçu des dons filtrés"
                    pageSize={5}
                    rows={filteredDonations}
                    rowKey={(item) => item.id}
                    initialSort={{ key: 'date', direction: 'descending' }}
                    emptyMessage="Aucun don ne correspond à ces filtres."
                    columns={[
                      { key: 'date', header: 'Date', render: (item) => formatDate(item.date), sortValue: (item) => item.date },
                      { key: 'donor', header: 'Donateur', rowHeader: true, render: (item) => donorName(item.donorId) },
                      { key: 'amount', header: 'Montant', align: 'end', render: (item) => <AmountText amount={item.amount} currency={item.currency} /> },
                      { key: 'status', header: 'Statut', render: (item) => <DonationStatusBadge status={item.status} /> },
                    ]}
                  />
                </Card.Body>
              </Card>
            </div>
          );
        }}
      </DataState>
    </>
  );
}
