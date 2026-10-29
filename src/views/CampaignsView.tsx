import { useCallback } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';
import { FormModal } from '../components/forms/FormModal';
import type { FieldDef } from '../components/forms/FormModal';
import { CampaignProgress } from '../components/ui/CampaignProgress';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataState } from '../components/ui/DataState';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { RowActions } from '../components/ui/RowActions';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CAMPAIGN_STATUS_LABELS, CURRENCY_LABELS } from '../config/constants';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { useEntityEditor } from '../hooks/useEntityEditor';
import { useResource } from '../hooks/useResource';
import { campaignSchema, campaignValues } from '../schemas/entities';
import type { Campaign, Stats } from '../types';
import { formatDate } from '../utils/dates';
import { optionsOf } from '../utils/options';
import { joinResults } from '../utils/results';

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'Nom', type: 'text', wide: true },
  { name: 'description', label: 'Description', type: 'textarea', wide: true },
  { name: 'goalAmount', label: 'Objectif', type: 'amount', placeholder: 'Ex. 5 000 000' },
  { name: 'goalCurrency', label: 'Devise de l’objectif', type: 'select', options: optionsOf(CURRENCY_LABELS) },
  { name: 'startDate', label: 'Date de début', type: 'date' },
  { name: 'endDate', label: 'Date de fin', type: 'date' },
  { name: 'status', label: 'Statut', type: 'select', options: optionsOf(CAMPAIGN_STATUS_LABELS) },
];

export function CampaignsView() {
  const api = useApi();
  const { canWrite } = useAuth();
  const load = useCallback(async () => joinResults<[Campaign[], Stats]>(await Promise.all([api.campaigns.list(), api.stats()])), [api]);
  const { state, reload } = useResource(load);
  const editor = useEntityEditor(api.campaigns, reload, { saved: 'Campagne enregistrée.', deleted: 'Campagne supprimée.' });

  return (
    <>
      <PageHeader
        title="Campagnes"
        subtitle="Piloter les collectes. La progression ne compte que les dons reçus dans la devise de l’objectif."
        actions={canWrite ? <Button onClick={editor.openNew}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Nouvelle campagne</Button> : null}
      />
      <DataState state={state} onRetry={reload} what="les campagnes">
        {([campaigns, stats]) => (
          <>
            {campaigns.length === 0 ? (
              <EmptyState title="Aucune campagne pour le moment." hint="Créez une campagne pour suivre un objectif de collecte." action={canWrite ? <Button onClick={editor.openNew}>Créer une campagne</Button> : undefined} />
            ) : (
              <Row xs={1} md={2} className="g-3">
                {campaigns.map((campaign) => {
                  const progress = stats.campaigns.find((item) => item.campaignId === campaign.id);
                  return (
                    <Col key={campaign.id}>
                      <Card as="article" className="h-100" aria-labelledby={`campaign-${campaign.id}`}>
                        <Card.Body className="d-flex flex-column gap-2">
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <h2 className="h5 mb-0" id={`campaign-${campaign.id}`}>{campaign.name}</h2>
                            <StatusBadge tone={campaign.status === 'active' ? 'success' : 'neutral'}>{CAMPAIGN_STATUS_LABELS[campaign.status]}</StatusBadge>
                          </div>
                          <p className="small text-body-secondary mb-0">Du {formatDate(campaign.startDate)} au {formatDate(campaign.endDate)}</p>
                          {campaign.description ? <p className="small mb-0">{campaign.description}</p> : null}
                          <div className="mt-2">
                            <CampaignProgress name="Progression" raised={progress?.raised ?? 0} goal={campaign.goalAmount} currency={campaign.goalCurrency} />
                          </div>
                          {canWrite ? (
                            <div className="mt-auto pt-2 d-flex justify-content-end">
                              <RowActions target={`la campagne ${campaign.name}`} onEdit={() => editor.openEdit(campaign)} onDelete={() => editor.askDelete(campaign)} />
                            </div>
                          ) : null}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
            {editor.isOpen ? (
              <FormModal title={editor.current ? 'Modifier la campagne' : 'Nouvelle campagne'} fields={FIELDS} initialValues={campaignValues(editor.current)} schema={campaignSchema} onSubmit={editor.save} onClose={editor.closeEditor} />
            ) : null}
            <ConfirmDialog show={editor.deleting !== null} title="Supprimer cette campagne ?" message={editor.deleting ? `La campagne « ${editor.deleting.name} » sera définitivement supprimée.` : ''} confirmLabel="Supprimer" onConfirm={() => void editor.confirmDelete()} onCancel={editor.cancelDelete} />
          </>
        )}
      </DataState>
    </>
  );
}
