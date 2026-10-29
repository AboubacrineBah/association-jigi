import type { Currency, MinorAmount } from '../../types';
import { formatMoney } from '../../utils/money';

interface CampaignProgressProps {
  name: string;
  raised: MinorAmount;
  goal: MinorAmount;
  currency: Currency;
}

export function CampaignProgress({ name, raised, goal, currency }: CampaignProgressProps) {
  const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return (
    <div>
      <div className="d-flex justify-content-between small fw-semibold mb-1">
        <span>{name}</span>
        <span>{percent} %</span>
      </div>
      <div className="progress" role="progressbar" aria-label={`${name} : ${percent} %`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar bg-success" style={{ width: `${percent}%` }} />
      </div>
      <p className="small text-body-secondary mb-0 mt-1">
        {formatMoney(raised, currency)} sur {formatMoney(goal, currency)}
      </p>
    </div>
  );
}
