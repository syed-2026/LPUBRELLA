import { apiClient } from './client';
import type { PricingPlan } from '@/types';

export const pricingApi = {
  // GET /api/v1/pricing -> { plans } (active plans only, per backend)
  listActive: async (): Promise<PricingPlan[]> => {
    const { data } = await apiClient.get<{ plans: PricingPlan[] }>('/pricing');
    return data.plans;
  },
};
