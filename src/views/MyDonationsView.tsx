import { useCallback } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { AmountText } from '../components/ui/AmountText';
import { DataState } from '../components/ui/DataState';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { DonationStatusBadge } from '../components/ui/DonationStatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { CURRENCIES, CURRENCY_META, PAYMENT_MODE_LABELS } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import type { Campaign, Donation } from '../types';
import { formatDate } from '../utils/dates';
import { joinResults } from '../utils/results';
import { receivedDonations } from '../utils/stats';

/** Espace donateur : consultation en lecture seule de ses propres dons (cahier des charges 4 et 5.1). */
export function MyDonationsView() {
  const api = useApi();
  const { user } = useAuth();
  const load = useCallback(async () => joinResults<[Donation[], Campaign[]]>(await Promise.all([api.myDonations(), api.campaigns.list()])), [api]);
  const { state, reload } = useResource(load);
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader title="Mes dons" subtitle={`Bonjour ${firstName}, merci pour votre générosité.`} />
      <DataState state={state} onRetry={reload} what="vos dons">
        {([donations, campaigns]) => {
          const campaignName = (id: number | null): string => (id === null ? '—' : (campaigns.find((item) => item.id === id)?.name ?? '—'));
          const received = receivedDonations(donations);
          const totals = CURRENCIES.map((currency) => ({ currency, amount: received.filter((item) => item.currency === currency).reduce((sum, item) => sum + item.amount, 0) })).filter((item) => item.amount > 0);
          const columns: Column<Donation>[] = [
            { key: 'date', header: 'Date', rowHeader: true, render: (item) => formatDate(item.date), sortValue: (item) => item.date },
            { key: 'amount', header: 'Montant', align: 'end', render: (item) => <AmountText amount={item.amount} currency={item.currency} />, sortValue: (item) => item.amount },
            { key: 'campaign', header: 'Campagne', render: (item) => campaignName(item.campaignId) },
            { key: 'mode', header: 'Mode', render: (item) => PAYMENT_MODE_LABELS[item.paymentMode] },
            { key: 'status', header: 'Statut', render: (item) => <DonationStatusBadge status={item.status} /> },
          ];
          if (donations.length === 0) return <EmptyState title="Aucun don enregistré pour le moment." hint="Vos dons apparaîtront ici dès que l’association les aura enregistrés." />;
          return (
            <div className="d-flex flex-column gap-3">
              <Row xs={1} sm={2} className="g-3" as="section" aria-label="Total cumulé par devise">
                {totals.map((total) => (
                  <Col key={total.currency}>
                    <Card>
                      <Card.Body>
                        <p className="small text-body-secondary mb-1">Total cumulé · {CURRENCY_META[total.currency].label}</p>
                        <p className="h4 mb-0 stat-positive"><AmountText amount={total.amount} currency={total.currency} /></p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              <DataTable caption="Historique de mes dons" columns={columns} rows={donations} rowKey={(item) => item.id} initialSort={{ key: 'date', direction: 'descending' }} />
              <p className="small text-body-secondary">Lecture seule : vous ne voyez que vos propres dons.</p>
            </div>
          );
        }}
      </DataState>
    </>
  );
}
