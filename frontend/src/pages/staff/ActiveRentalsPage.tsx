import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, StaffQueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useStaffRentals } from '@/hooks/useStaffQueries';
import { useDebounce } from '@/hooks/useDebounce';
import { rentalStatusMeta } from '@/utils/statusMeta';
import { formatRelativeTime } from '@/utils/date';
import { formatPaise } from '@/utils/money';

const LIMIT = 20;

export default function ActiveRentalsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading, isError, error, refetch } = useStaffRentals({
    page,
    limit: LIMIT,
    status: 'ACTIVE,OVERDUE',
    search: debouncedSearch || undefined,
  });

  return (
    <div>
      <PageHeader
        title="Active Rentals"
        description="Rentals currently out from this station."
        action={
          <Link to="/staff/returns">
            <Button variant="secondary" size="sm">
              Return an umbrella <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          placeholder="Search by umbrella ID, student name/LPU ID, or rental ID"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <StaffQueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.rentals.length === 0 ? (
              <EmptyState
                title="No active rentals"
                description={
                  search ? 'No rentals matched your search.' : 'No umbrellas are currently rented out from this station.'
                }
              />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Umbrella</th>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Due</th>
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
                          <td className="px-4 py-3 text-text-secondary">
                            {rental.dueAt ? formatRelativeTime(rental.dueAt) : '—'}
                          </td>
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
