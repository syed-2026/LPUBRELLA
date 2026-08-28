// Mirrors prisma/schema.prisma enums/models in the backend exactly.
// Do not add fields the backend doesn't actually return.

export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type StationStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type UmbrellaStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'MISSING' | 'LOST' | 'RETIRED';
export type UmbrellaCondition = 'GOOD' | 'FAIR' | 'DAMAGED';
export type RentalStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'RETURN_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'LOST';
export type PaymentStatus = 'CREATED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
export type DamageSeverity = 'MINOR' | 'MAJOR' | 'UNUSABLE';
export type DamageReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
export type RebalancingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type NotificationType =
  | 'RENTAL_ACTIVATED'
  | 'RENTAL_OVERDUE'
  | 'RETURN_COMPLETED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_FAILED'
  | 'GENERAL';
export type AuditAction =
  | 'LOGIN'
  | 'REGISTER'
  | 'RENTAL_CREATED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_FAILED'
  | 'RENTAL_ACTIVATED'
  | 'RETURN_TOKEN_CREATED'
  | 'RETURN_COMPLETED'
  | 'RENTAL_MARKED_OVERDUE'
  | 'RENTAL_CANCELLED'
  | 'UMBRELLA_MARKED_MAINTENANCE'
  | 'UMBRELLA_MARKED_MISSING'
  | 'UMBRELLA_MARKED_LOST'
  | 'UMBRELLA_MARKED_AVAILABLE'
  | 'INVENTORY_MOVED'
  | 'ADMIN_ACTION';

export interface User {
  id: string;
  lpuId: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  assignedStationId: string | null;
  createdAt: string;
  updatedAt: string;
  // passwordHash is never returned by the backend - intentionally absent here.
}

export interface Station {
  id: string;
  code: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  capacity: number;
  status: StationStatus;
  openingTime: string;
  closingTime: string;
  createdAt: string;
  updatedAt: string;
  // Present on GET /stations and GET /stations/:id (computed live, not stored).
  inventory?: InventoryCounts;
}

export interface InventoryCounts {
  AVAILABLE: number;
  RENTED: number;
  MAINTENANCE: number;
  MISSING: number;
  LOST: number;
  RETIRED: number;
}

export interface Umbrella {
  id: string;
  publicCode: string;
  qrIdentifier: string;
  status: UmbrellaStatus;
  condition: UmbrellaCondition;
  currentStationId: string | null;
  createdAt: string;
  updatedAt: string;
  currentStation?: Station | null;
}

export interface PricingPlan {
  id: string;
  name: string;
  durationMinutes: number;
  pricePaise: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  rentalId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amountPaise: number;
  status: PaymentStatus;
  failureReason: string | null;
  createdAt: string;
  verifiedAt: string | null;
  updatedAt: string;
}

export interface RentalStudent {
  id: string;
  name: string;
  lpuId: string;
  email?: string;
  phone?: string | null;
}

export interface Rental {
  id: string;
  studentId: string;
  umbrellaId: string;
  pricingPlanId: string;
  priceAtRentalPaise: number;
  durationMinutesAtRental: number;
  status: RentalStatus;
  originStationId: string;
  returnStationId: string | null;
  startedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  umbrella?: Umbrella;
  pricingPlan?: PricingPlan;
  originStation?: Station;
  returnStation?: Station | null;
  payment?: Payment | null;
  student?: RentalStudent;
}

export interface DamageReport {
  id: string;
  umbrellaId: string;
  reportedById: string;
  severity: DamageSeverity;
  description: string;
  status: DamageReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  umbrella?: Umbrella;
  reportedBy?: User;
}

export interface RebalancingTask {
  id: string;
  fromStationId: string;
  toStationId: string;
  umbrellaCount: number;
  status: RebalancingTaskStatus;
  assignedStaffId: string | null;
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: Pick<User, 'id' | 'name' | 'email' | 'role'> | null;
}

export interface AdminAnalytics {
  rentalsByStatus: Partial<Record<RentalStatus, number>>;
  umbrellasByStatus: Partial<Record<UmbrellaStatus, number>>;
  totalRevenuePaise: number;
  verifiedPaymentsCount: number;
  currentlyActiveRentals: number;
}

// ---- Paginated list envelope shape used across the backend ----
// The backend returns paginated results as `{ <key>: T[], total, page, limit }`
// where <key> varies per endpoint (rentals/umbrellas/stations/users/...).
// Concrete list response types are declared per-module in src/api/*.ts.

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}
