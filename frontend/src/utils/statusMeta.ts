import type {
  DamageReportStatus,
  DamageSeverity,
  PaymentStatus,
  RebalancingTaskStatus,
  RentalStatus,
  StationStatus,
  UmbrellaCondition,
  UmbrellaStatus,
  UserStatus,
} from '@/types';

export type StatusTone = 'available' | 'limited' | 'unavailable' | 'neutral';

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

// Tailwind class fragments for each tone - used by <StatusBadge>.
export const toneClasses: Record<StatusTone, string> = {
  available: 'bg-status-available/15 text-[#4F6B3C] border-status-available/30',
  limited: 'bg-status-limited/15 text-brand-dark border-status-limited/30',
  unavailable: 'bg-status-unavailable/15 text-text-secondary border-status-unavailable/30',
  neutral: 'bg-surface-secondary text-text-secondary border-border',
};

export const umbrellaStatusMeta: Record<UmbrellaStatus, StatusMeta> = {
  AVAILABLE: { label: 'Available', tone: 'available' },
  RENTED: { label: 'Rented', tone: 'limited' },
  MAINTENANCE: { label: 'Maintenance', tone: 'unavailable' },
  MISSING: { label: 'Missing', tone: 'unavailable' },
  LOST: { label: 'Lost', tone: 'unavailable' },
  RETIRED: { label: 'Retired', tone: 'neutral' },
};

export const rentalStatusMeta: Record<RentalStatus, StatusMeta> = {
  CREATED: { label: 'Created', tone: 'neutral' },
  PAYMENT_PENDING: { label: 'Payment pending', tone: 'limited' },
  ACTIVE: { label: 'Active', tone: 'available' },
  OVERDUE: { label: 'Overdue', tone: 'unavailable' },
  RETURN_PENDING: { label: 'Return pending', tone: 'limited' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  LOST: { label: 'Lost', tone: 'unavailable' },
};

export const paymentStatusMeta: Record<PaymentStatus, StatusMeta> = {
  CREATED: { label: 'Created', tone: 'neutral' },
  PENDING: { label: 'Pending', tone: 'limited' },
  VERIFIED: { label: 'Verified', tone: 'available' },
  FAILED: { label: 'Failed', tone: 'unavailable' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
};

export const stationStatusMeta: Record<StationStatus, StatusMeta> = {
  ACTIVE: { label: 'Active', tone: 'available' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  MAINTENANCE: { label: 'Maintenance', tone: 'unavailable' },
};

export const userStatusMeta: Record<UserStatus, StatusMeta> = {
  ACTIVE: { label: 'Active', tone: 'available' },
  SUSPENDED: { label: 'Suspended', tone: 'unavailable' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
};

export const damageSeverityMeta: Record<DamageSeverity, StatusMeta> = {
  MINOR: { label: 'Minor', tone: 'limited' },
  MAJOR: { label: 'Major', tone: 'unavailable' },
  UNUSABLE: { label: 'Unusable', tone: 'unavailable' },
};

export const damageReportStatusMeta: Record<DamageReportStatus, StatusMeta> = {
  OPEN: { label: 'Open', tone: 'limited' },
  IN_REVIEW: { label: 'In review', tone: 'limited' },
  RESOLVED: { label: 'Resolved', tone: 'available' },
};

export const umbrellaConditionMeta: Record<UmbrellaCondition, StatusMeta> = {
  GOOD: { label: 'Good', tone: 'available' },
  FAIR: { label: 'Fair', tone: 'limited' },
  DAMAGED: { label: 'Damaged', tone: 'unavailable' },
};

export const rebalancingStatusMeta: Record<RebalancingTaskStatus, StatusMeta> = {
  PENDING: { label: 'Pending', tone: 'neutral' },
  IN_PROGRESS: { label: 'In progress', tone: 'limited' },
  COMPLETED: { label: 'Completed', tone: 'available' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};
