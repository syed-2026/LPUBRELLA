import { apiClient } from './client';
import type {
  AdminAnalytics,
  AuditLog,
  DamageReport,
  DamageReportStatus,
  PricingPlan,
  RebalancingTask,
  RebalancingTaskStatus,
  Rental,
  RentalStatus,
  Station,
  StationStatus,
  Umbrella,
  UmbrellaCondition,
  UmbrellaStatus,
  User,
  UserRole,
  UserStatus,
  Payment,
  PaymentStatus,
} from '@/types';

interface Page {
  page?: number;
  limit?: number;
}

// ---------------- Users ----------------
export interface AdminUsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateStaffOrAdminPayload {
  lpuId: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'STAFF' | 'ADMIN';
  assignedStationId?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  status?: UserStatus;
  assignedStationId?: string | null;
}

// ---------------- Stations ----------------
export interface AdminStationsListResponse {
  stations: Station[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateStationPayload {
  code: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  capacity: number;
  openingTime: string; // "HH:mm"
  closingTime: string; // "HH:mm"
}

export type UpdateStationPayload = Partial<CreateStationPayload> & { status?: StationStatus };

// ---------------- Umbrellas ----------------
export interface AdminUmbrellasListResponse {
  umbrellas: Umbrella[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUmbrellaPayload {
  publicCode: string;
  qrIdentifier: string;
  currentStationId: string;
  condition?: UmbrellaCondition;
}

export interface UpdateUmbrellaPayload {
  status?: UmbrellaStatus;
  condition?: UmbrellaCondition;
  currentStationId?: string;
}

// ---------------- Pricing ----------------
export interface CreatePricingPlanPayload {
  name: string;
  durationMinutes: number;
  pricePaise: number;
  active?: boolean;
}
export type UpdatePricingPlanPayload = Partial<CreatePricingPlanPayload>;

// ---------------- Rentals / Payments / Damage / Audit ----------------
export interface AdminRentalsListResponse {
  rentals: Rental[];
  total: number;
  page: number;
  limit: number;
}
export interface AdminPaymentsListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}
export interface AdminDamageReportsListResponse {
  reports: DamageReport[];
  total: number;
  page: number;
  limit: number;
}
export interface AdminAuditLogsListResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

// ---------------- Rebalancing ----------------
export interface AdminRebalancingListResponse {
  tasks: RebalancingTask[];
  total: number;
  page: number;
  limit: number;
}
export interface CreateRebalancingTaskPayload {
  fromStationId: string;
  toStationId: string;
  umbrellaCount: number;
  assignedStaffId?: string;
  notes?: string;
}

export const adminApi = {
  // ---- Users ----
  createStaffOrAdmin: async (payload: CreateStaffOrAdminPayload): Promise<User> => {
    const { data } = await apiClient.post<{ user: User }>('/admin/users', payload);
    return data.user;
  },
  listUsers: async (
    params: Page & { role?: UserRole; status?: UserStatus }
  ): Promise<AdminUsersListResponse> => {
    const { data } = await apiClient.get<AdminUsersListResponse>('/admin/users', { params });
    return data;
  },
  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await apiClient.patch<{ user: User }>(`/admin/users/${id}`, payload);
    return data.user;
  },

  // ---- Stations ----
  createStation: async (payload: CreateStationPayload): Promise<Station> => {
    const { data } = await apiClient.post<{ station: Station }>('/admin/stations', payload);
    return data.station;
  },
  listStations: async (params: Page): Promise<AdminStationsListResponse> => {
    const { data } = await apiClient.get<AdminStationsListResponse>('/admin/stations', { params });
    return data;
  },
  updateStation: async (id: string, payload: UpdateStationPayload): Promise<Station> => {
    const { data } = await apiClient.patch<{ station: Station }>(`/admin/stations/${id}`, payload);
    return data.station;
  },

  // ---- Umbrellas ----
  createUmbrella: async (payload: CreateUmbrellaPayload): Promise<Umbrella> => {
    const { data } = await apiClient.post<{ umbrella: Umbrella }>('/admin/umbrellas', payload);
    return data.umbrella;
  },
  listUmbrellas: async (
    params: Page & { status?: UmbrellaStatus; stationId?: string }
  ): Promise<AdminUmbrellasListResponse> => {
    const { data } = await apiClient.get<AdminUmbrellasListResponse>('/admin/umbrellas', { params });
    return data;
  },
  updateUmbrella: async (id: string, payload: UpdateUmbrellaPayload): Promise<Umbrella> => {
    const { data } = await apiClient.patch<{ umbrella: Umbrella }>(`/admin/umbrellas/${id}`, payload);
    return data.umbrella;
  },

  // ---- Pricing ----
  createPricingPlan: async (payload: CreatePricingPlanPayload): Promise<PricingPlan> => {
    const { data } = await apiClient.post<{ plan: PricingPlan }>('/admin/pricing', payload);
    return data.plan;
  },
  listPricingPlans: async (): Promise<PricingPlan[]> => {
    const { data } = await apiClient.get<{ plans: PricingPlan[] }>('/admin/pricing');
    return data.plans;
  },
  updatePricingPlan: async (id: string, payload: UpdatePricingPlanPayload): Promise<PricingPlan> => {
    const { data } = await apiClient.patch<{ plan: PricingPlan }>(`/admin/pricing/${id}`, payload);
    return data.plan;
  },

  // ---- Read models ----
  listRentals: async (
    params: Page & { status?: RentalStatus; studentId?: string }
  ): Promise<AdminRentalsListResponse> => {
    const { data } = await apiClient.get<AdminRentalsListResponse>('/admin/rentals', { params });
    return data;
  },
  listPayments: async (params: Page & { status?: PaymentStatus }): Promise<AdminPaymentsListResponse> => {
    const { data } = await apiClient.get<AdminPaymentsListResponse>('/admin/payments', { params });
    return data;
  },
  listDamageReports: async (
    params: Page & { status?: DamageReportStatus }
  ): Promise<AdminDamageReportsListResponse> => {
    const { data } = await apiClient.get<AdminDamageReportsListResponse>('/admin/damage-reports', { params });
    return data;
  },
  listAuditLogs: async (
    params: Page & { action?: string; entity?: string }
  ): Promise<AdminAuditLogsListResponse> => {
    const { data } = await apiClient.get<AdminAuditLogsListResponse>('/admin/audit-logs', { params });
    return data;
  },

  // ---- Rebalancing ----
  createRebalancingTask: async (payload: CreateRebalancingTaskPayload): Promise<RebalancingTask> => {
    const { data } = await apiClient.post<{ task: RebalancingTask }>('/admin/rebalancing-tasks', payload);
    return data.task;
  },
  listRebalancingTasks: async (
    params: Page & { status?: RebalancingTaskStatus }
  ): Promise<AdminRebalancingListResponse> => {
    const { data } = await apiClient.get<AdminRebalancingListResponse>('/admin/rebalancing-tasks', {
      params,
    });
    return data;
  },

  // ---- Analytics ----
  analytics: async (): Promise<AdminAnalytics> => {
    const { data } = await apiClient.get<AdminAnalytics>('/admin/analytics');
    return data;
  },
};
