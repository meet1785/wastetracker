import { differenceInDays, parseISO, isValid } from 'date-fns';
import { EXPIRY_THRESHOLDS, COLORS } from './constants';

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'caution' | 'good';

export function getDaysUntilExpiry(expiryDate: string): number {
  const parsed = parseISO(expiryDate);
  if (!isValid(parsed)) return 0;
  return differenceInDays(parsed, new Date());
}

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return 'expired';
  if (days <= EXPIRY_THRESHOLDS.CRITICAL) return 'critical';
  if (days <= EXPIRY_THRESHOLDS.WARNING) return 'warning';
  if (days <= EXPIRY_THRESHOLDS.CAUTION) return 'caution';
  return 'good';
}

export function getExpiryColor(status: ExpiryStatus): string {
  switch (status) {
    case 'expired': return COLORS.danger;
    case 'critical': return COLORS.danger;
    case 'warning': return COLORS.secondary;
    case 'caution': return COLORS.warning;
    case 'good': return COLORS.primary;
  }
}

export function getExpiryLabel(expiryDate: string): string {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today!';
  if (days === 1) return 'Expires tomorrow';
  return `Expires in ${days} days`;
}

export function getExpiryBackgroundColor(status: ExpiryStatus): string {
  switch (status) {
    case 'expired': return COLORS.dangerLight;
    case 'critical': return COLORS.dangerLight;
    case 'warning': return COLORS.secondaryLight;
    case 'caution': return COLORS.warningLight;
    case 'good': return COLORS.primaryLight;
  }
}
