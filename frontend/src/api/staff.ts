import { apiClient } from './client';
import type { DamageReport, DamageSeverity, InventoryCounts, Rental, Station, Umbrella } from '@/types';

// ---- GET /api/v1/staff/dashboard ----
export interface StaffDashboard {
  station: Station;
  inventory: InventoryCounts;
  recentRentals: Rental[]; // ACTIVE/OVERDUE only, most recent 20, per backend
}

// ---- GET /api/v1/staff/rentals ----
export interface StaffRentalsListResponse {
  rentals: Rental[];
  total: number;
  page: number;
  limit: number;
}

export interface StaffRentalsParams {
  page?: number;
  limit?: number;
  /** Comma-separated RentalStatus values, e.g. "ACTIVE,OVERDUE" */
  status?: string;
  /** Free-text: umbrella code, student name/LPU ID, or exact rental ID */
  search?: string;
}

// ---- GET /api/v1/staff/inventory ----
export interface StaffInventoryResponse {
  umbrellas: Umbrella[];
  counts: InventoryCounts;
}

export const staffApi = {
  dashboard: async (): Promise<StaffDashboard> => {
    const { data } = await apiClient.get<StaffDashboard>('/staff/dashboard');
    return data;
  },

  rentals: async (params?: StaffRentalsParams): Promise<StaffRentalsListResponse> => {
    const { data } = await apiClient.get<StaffRentalsListResponse>('/staff/rentals', { params });
    return data;
  },

  // Backend addition (see README "Backend changes"): GET /staff/rentals/lookup?umbrellaCode=UMB-0001
  // Finds the umbrella's current ACTIVE/OVERDUE rental by its human-friendly
  // code, regardless of which station it was originally rented from. This
  // is what powers the "search by Umbrella ID" step of the return workflow.
  lookupRentalByUmbrellaCode: async (umbrellaCode: string): Promise<Rental> => {
    const { data } = await apiClient.get<{ rental: Rental }>('/staff/rentals/lookup', {
      params: { umbrellaCode },
    });
    return data.rental;
  },

  inventory: async (): Promise<StaffInventoryResponse> => {
    const { data } = await apiClient.get<StaffInventoryResponse>('/staff/inventory');
    return data;
  },

  // POST /api/v1/staff/damage { umbrellaId, severity, description } -> { report }
  reportDamage: async (payload: {
    umbrellaId: string;
    severity: DamageSeverity;
    description: string;
  }): Promise<DamageReport> => {
    const { data } = await apiClient.post<{ report: DamageReport }>('/staff/damage', payload);
    return data.report;
  },

  // POST /api/v1/staff/missing { umbrellaId, description? } -> { umbrella }
  reportMissing: async (payload: { umbrellaId: string; description?: string }): Promise<Umbrella> => {
    const { data } = await apiClient.post<{ umbrella: Umbrella }>('/staff/missing', payload);
    return data.umbrella;
  },
};
