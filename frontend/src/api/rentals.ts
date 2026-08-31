import { apiClient } from './client';
import type { Rental } from '@/types';

export const rentalsApi = {
  // GET /api/v1/rentals/:id -> { rental }
  // rentalService.getById only restricts STUDENT requesters to their own
  // rental; STAFF/ADMIN may look up any rental by id. Used here to poll a
  // rental's status while a Return QR is awaiting the student's scan.
  getById: async (id: string): Promise<Rental> => {
    const { data } = await apiClient.get<{ rental: Rental }>(`/rentals/${id}`);
    return data.rental;
  },
};
