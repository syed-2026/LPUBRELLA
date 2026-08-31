import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { stationsApi } from '@/api/stations';
import type {
  DamageReportStatus,
  PaymentStatus,
  RebalancingTaskStatus,
  RentalStatus,
  UmbrellaCondition,
  UmbrellaStatus,
  UserRole,
  UserStatus,
} from '@/types';

export const adminKeys = {
  analytics: ['admin', 'analytics'] as const,
  users: (params: Record<string, unknown>) => ['admin', 'users', params] as const,
  stations: (params: Record<string, unknown>) => ['admin', 'stations', params] as const,
  station: (id: string) => ['station', id] as const,
  umbrellas: (params: Record<string, unknown>) => ['admin', 'umbrellas', params] as const,
  rentals: (params: Record<string, unknown>) => ['admin', 'rentals', params] as const,
  payments: (params: Record<string, unknown>) => ['admin', 'payments', params] as const,
  damageReports: (params: Record<string, unknown>) => ['admin', 'damage-reports', params] as const,
  auditLogs: (params: Record<string, unknown>) => ['admin', 'audit-logs', params] as const,
  rebalancing: (params: Record<string, unknown>) => ['admin', 'rebalancing', params] as const,
  pricing: ['admin', 'pricing'] as const,
};

// ---------------- Analytics ----------------
export function useAdminAnalytics() {
  return useQuery({ queryKey: adminKeys.analytics, queryFn: adminApi.analytics });
}

// ---------------- Users (students/staff/admins) ----------------
export function useAdminUsers(params: { page: number; limit: number; role?: UserRole; status?: UserStatus }) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.listUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateStaffOrAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createStaffOrAdmin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminApi.updateUser>[1] }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

// ---------------- Stations ----------------
export function useAdminStations(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: adminKeys.stations(params),
    queryFn: () => adminApi.listStations(params),
    placeholderData: (prev) => prev,
  });
}

export function useStation(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.station(id ?? ''),
    queryFn: () => stationsApi.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createStation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stations'] }),
  });
}

export function useUpdateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminApi.updateStation>[1] }) =>
      adminApi.updateStation(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'stations'] });
      qc.invalidateQueries({ queryKey: adminKeys.station(vars.id) });
    },
  });
}

// ---------------- Umbrellas ----------------
export function useAdminUmbrellas(params: {
  page: number;
  limit: number;
  status?: UmbrellaStatus;
  stationId?: string;
}) {
  return useQuery({
    queryKey: adminKeys.umbrellas(params),
    queryFn: () => adminApi.listUmbrellas(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateUmbrella() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createUmbrella,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'umbrellas'] }),
  });
}

export function useUpdateUmbrella() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminApi.updateUmbrella>[1] }) =>
      adminApi.updateUmbrella(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'umbrellas'] }),
  });
}

export type { UmbrellaCondition };

// ---------------- Rentals ----------------
export function useAdminRentals(params: { page: number; limit: number; status?: RentalStatus; studentId?: string }) {
  return useQuery({
    queryKey: adminKeys.rentals(params),
    queryFn: () => adminApi.listRentals(params),
    placeholderData: (prev) => prev,
  });
}

// ---------------- Payments ----------------
export function useAdminPayments(params: { page: number; limit: number; status?: PaymentStatus }) {
  return useQuery({
    queryKey: adminKeys.payments(params),
    queryFn: () => adminApi.listPayments(params),
    placeholderData: (prev) => prev,
  });
}

// ---------------- Damage reports ----------------
export function useAdminDamageReports(params: { page: number; limit: number; status?: DamageReportStatus }) {
  return useQuery({
    queryKey: adminKeys.damageReports(params),
    queryFn: () => adminApi.listDamageReports(params),
    placeholderData: (prev) => prev,
  });
}

// ---------------- Audit logs ----------------
export function useAdminAuditLogs(params: { page: number; limit: number; action?: string; entity?: string }) {
  return useQuery({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminApi.listAuditLogs(params),
    placeholderData: (prev) => prev,
  });
}

// ---------------- Rebalancing ----------------
export function useAdminRebalancingTasks(params: { page: number; limit: number; status?: RebalancingTaskStatus }) {
  return useQuery({
    queryKey: adminKeys.rebalancing(params),
    queryFn: () => adminApi.listRebalancingTasks(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRebalancingTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createRebalancingTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rebalancing'] }),
  });
}

// ---------------- Pricing ----------------
export function useAdminPricingPlans() {
  return useQuery({ queryKey: adminKeys.pricing, queryFn: adminApi.listPricingPlans });
}

export function useCreatePricingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createPricingPlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.pricing }),
  });
}

export function useUpdatePricingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof adminApi.updatePricingPlan>[1] }) =>
      adminApi.updatePricingPlan(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.pricing }),
  });
}
