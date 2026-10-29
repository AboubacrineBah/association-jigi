import { useCallback, useMemo, useState } from 'react';
import { Card, Col, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AmountText } from '../components/ui/AmountText';
import { CampaignProgress } from '../components/ui/CampaignProgress';
import { DataState } from '../components/ui/DataState';
import { DonationStatusBadge } from '../components/ui/DonationStatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { CURRENCIES, CURRENCY_META, CURRENCY_LABELS } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useResource } from '../hooks/useResource';
import type { Currency, Donation, Donor, Stats } from '../types';
import { formatDate, shortMonthLabel } from '../utils/dates';
import { formatMoney } from '../utils/money';
import { joinResults } from '../utils/results';

const RECENT_COUNT = 5;

/** Axe du graphique : « 3,5 M » plutôt que « 3500000 » (lisible sur mobile). */
const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

function MonthlyChart({ stats }: { stats: Stats }) {
  const [currency, setCurrency] = useState<Currency>('XOF');
  const { digits, label } = CURRENCY_META[currency];
  const points = useMemo(
    () => stats.monthly.filter((point) => point.currency === currency).map((point) => ({ month: shortMonthLabel(point.month), amount: point.amount })),
    [stats.monthly, currency],
  );
  const description = `Dons reçus par mois en ${CURRENCY_LABELS[currency]}`;
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h5 mb-0">Évolution mensuelle ({label})</h2>
          <div role="group" aria-label="Devise du graphique" className="d-flex gap-1">
            {CURRENCIES.map((code) => (
              <button key={code} type="button" className={`btn btn-sm ${code === currency ? 'btn-primary' : 'btn-outline-primary'}`} aria-pressed={code === currency} onClick={() => setCurrency(code)}>
                {CURRENCY_META[code].label}
              </button>
            ))}
          </div>
        </div>
        <figure className="mb-0" aria-label={description}>
          <div style={{ width: '100%', height: 220 }} role="img" aria-label={description}>
            <ResponsiveContainer>
              <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis width={52} tickFormatter={(value: number) => compact.format(value / 10 ** digits)} />
                <Tooltip formatter={(value: number) => formatMoney(value, currency)} />
                <Bar dataKey="amount" fill="#a8431f" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="visually-hidden">
            <caption>{description}</caption>
            <thead>
              <tr>
                <th scope="col">Mois</th>
                <th scope="col">Montant</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.month}>
                  <th scope="row">{point.month}</th>
                  <td>{formatMoney(point.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </Card.Body>
    </Card>
  );
}

export function DashboardView() {
  const api = useApi();
  const load = useCallback(async () => joinResults<[Stats, Donation[], Donor[]]>(await Promise.all([api.stats(), api.donations.list(), api.donors.list()])), [api]);
  const { state, reload } = useResource(load);

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Les montants de devises différentes ne sont jamais additionnés." />
      <DataState state={state} onRetry={reload} what="le tableau de bord">
        {([stats, donations, donors]) => {
          const donorName = (id: number): string => donors.find((donor) => donor.id === id)?.name ?? 'Donateur inconnu';
          const recent = [...donations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, RECENT_COUNT);
          return (
            <div className="d-flex flex-column gap-3">
              <Card>
                <Card.Body>
                  <h2 className="h5">Totaux par devise (dons reçus)</h2>
                  <div className="table-responsive">
                    <Table className="mb-0 align-middle">
                      <caption className="visually-hidden">Collecté, utilisé et solde disponible pour chaque devise</caption>
                      <thead>
                        <tr>
                          <th scope="col">Devise</th>
                          <th scope="col" className="text-end">Collecté</th>
                          <th scope="col" className="text-end">Utilisé</th>
                          <th scope="col" className="text-end">Solde disponible</th>
                          <th scope="col" className="text-end">Dons</th>
                          <th scope="col" className="text-end">Don moyen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.totals.map((total) => (
                          <tr key={total.currency}>
                            <th scope="row">{CURRENCY_META[total.currency].label}</th>
                            <td className="text-end"><AmountText amount={total.collected} currency={total.currency} /></td>
                            <td className="text-end"><AmountText amount={total.used} currency={total.currency} /></td>
                            <td className="text-end stat-positive"><AmountText amount={total.balance} currency={total.currency} /></td>
                            <td className="text-end">{total.donationCount}</td>
                            <td className="text-end"><AmountText amount={total.averageDonation} currency={total.currency} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              <Row className="g-3">
                <Col lg={6}>
                  <MonthlyChart stats={stats} />
                </Col>
                <Col lg={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <h2 className="h5 mb-3">Progression des campagnes</h2>
                      <div className="d-flex flex-column gap-3">
                        {stats.campaigns.map((campaign) => (
                          <CampaignProgress key={campaign.campaignId} name={campaign.name} raised={campaign.raised} goal={campaign.goalAmount} currency={campaign.goalCurrency} />
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card>
                <Card.Body>
                  <h2 className="h5">Derniers dons</h2>
                  <div className="table-responsive">
                    <Table striped className="table-jigi mb-0 align-middle">
                      <caption className="visually-hidden">Les {RECENT_COUNT} dons les plus récents</caption>
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col">Donateur</th>
                          <th scope="col" className="text-end">Montant</th>
                          <th scope="col">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((donation) => (
                          <tr key={donation.id}>
                            <td>{formatDate(donation.date)}</td>
                            <td>{donorName(donation.donorId)}</td>
                            <td className="text-end"><AmountText amount={donation.amount} currency={donation.currency} /></td>
                            <td><DonationStatusBadge status={donation.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </div>
          );
        }}
      </DataState>
    </>
  );
}
