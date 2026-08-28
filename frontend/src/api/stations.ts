import { apiClient } from './client';
import type { Station } from '@/types';

export interface StationsListResponse {
  stations: Station[];
  total: number;
  page: number;
  limit: number;
}

export const stationsApi = {
  // GET /api/v1/stations?page=&limit=
  list: async (params?: { page?: number; limit?: number }): Promise<StationsListResponse> => {
    const { data } = await apiClient.get<StationsListResponse>('/stations', { params });
    return data;
  },

  // GET /api/v1/stations/:id -> { station }
  getById: async (id: string): Promise<Station> => {
    const { data } = await apiClient.get<{ station: Station }>(`/stations/${id}`);
    return data.station;
  },
};
