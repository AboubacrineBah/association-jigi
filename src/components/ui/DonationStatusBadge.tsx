import { DONATION_STATUS_LABELS } from '../../config/constants';
import type { DonationStatus } from '../../types';
import { StatusBadge } from './StatusBadge';
import type { Tone } from './StatusBadge';

const TONES: Record<DonationStatus, Tone> = { recu: 'success', promis: 'neutral', annule: 'danger' };

export function DonationStatusBadge({ status }: { status: DonationStatus }) {
  return <StatusBadge tone={TONES[status]}>{DONATION_STATUS_LABELS[status]}</StatusBadge>;
}
