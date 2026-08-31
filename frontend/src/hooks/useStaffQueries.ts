import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi, type StaffRentalsParams } from '@/api/staff';
import { returnsApi } from '@/api/returns';
import { rentalsApi } from '@/api/rentals';

export const staffKeys = {
  dashboard: ['staff', 'dashboard'] as const,
  inventory: ['staff', 'inventory'] as const,
  rentals: (params: StaffRentalsParams) => ['staff', 'rentals', params] as const,
  rentalLookup: (code: string) => ['staff', 'rental-lookup', code] as const,
  rental: (id: string) => ['rental', id] as const,
};

export function useStaffDashboard() {
  return useQuery({
    queryKey: staffKeys.dashboard,
    queryFn: staffApi.dashboard,
    refetchInterval: 30_000, // dashboard counts drift as rentals/returns happen
  });
}

export function useStaffInventory() {
  return useQuery({
    queryKey: staffKeys.inventory,
    queryFn: staffApi.inventory,
  });
}

export function useStaffRentals(params: StaffRentalsParams) {
  return useQuery({
    queryKey: staffKeys.rentals(params),
    queryFn: () => staffApi.rentals(params),
    placeholderData: (prev) => prev,
  });
}

export function useLookupRentalByUmbrella() {
  return useMutation({
    mutationFn: (umbrellaCode: string) => staffApi.lookupRentalByUmbrellaCode(umbrellaCode),
  });
}

export function useGenerateReturnToken() {
  return useMutation({
    mutationFn: (rentalId: string) => returnsApi.generateToken(rentalId),
  });
}

/** Polls a rental's status while a Return QR is awaiting the student's scan. */
export function useRentalStatusPoll(rentalId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: rentalId ? staffKeys.rental(rentalId) : ['rental', 'none'],
    queryFn: () => rentalsApi.getById(rentalId as string),
    enabled: !!rentalId && enabled,
    refetchInterval: 2500,
  });
}

export function useReportDamage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.reportDamage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.inventory });
      queryClient.invalidateQueries({ queryKey: staffKeys.dashboard });
    },
  });
}

export function useReportMissing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: staffApi.reportMissing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.inventory });
      queryClient.invalidateQueries({ queryKey: staffKeys.dashboard });
    },
  });
}
