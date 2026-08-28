import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input, Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, StaffQueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useStaffRentals } from '@/hooks/useStaffQueries';
import { useDebounce } from '@/hooks/useDebounce';
import { rentalStatusMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import { formatPaise } from '@/utils/money';
import type { RentalStatus } from '@/types';

const LIMIT = 20;
const STATUS_OPTIONS: Array<RentalStatus | 'ALL'> = [
  'ALL',
  'COMPLETED',
  'CANCELLED',
  'LOST',
  'ACTIVE',
  'OVERDUE',
  'RETURN_PENDING',
];

export default function RentalHistoryPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RentalStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isError, error, refetch } = useStaffRentals({
    page,
    limit: LIMIT,
    status: status === 'ALL' ? undefined : status,
    search: debouncedSearch || undefined,
  });

  return (
    <div>
      <PageHeader title="Rental History" description="All rentals originating from this station." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search by umbrella ID, student, or rental ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RentalStatus | 'ALL');
            setPage(1);
          }}
          className="sm:w-48"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All statuses' : rentalStatusMeta[s].label}
            </option>
          ))}
        </Select>
      </div>

      <StaffQueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.rentals.length === 0 ? (
              <EmptyState title="No rentals found" description="Try a different search or filter." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Umbrella</th>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Rented</th>
                      <th className="px-4 py-3 font-medium">Returned</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.rentals.map((rental) => {
                      const meta = rentalStatusMeta[rental.status];
                      return (
                        <tr key={rental.id} className="hover:bg-surface-secondary/40">
                          <td className="px-4 py-3 font-medium text-text-primary">
                            {rental.umbrella?.publicCode ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-text-primary">{rental.student?.name}</p>
                            <p className="text-xs text-text-secondary">{rental.student?.lpuId}</p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge label={meta.label} tone={meta.tone} />
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(rental.createdAt)}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(rental.completedAt)}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatPaise(rental.priceAtRentalPaise)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </>
        )}
      </StaffQueryGate>
    </div>
  );
}
