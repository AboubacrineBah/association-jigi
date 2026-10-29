import type { Currency, MinorAmount } from '../../types';
import { formatMoney } from '../../utils/money';

/** Montant au format français ; la devise est toujours affichée avec le montant. */
export function AmountText({ amount, currency }: { amount: MinorAmount; currency: Currency }) {
  return <span className="amount">{formatMoney(amount, currency)}</span>;
}
