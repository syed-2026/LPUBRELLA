import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminUsers, useAdminRentals } from '@/hooks/useAdminQueries';
import { userStatusMeta, rentalStatusMeta, paymentStatusMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import { formatPaise } from '@/utils/money';

const RENTALS_LIMIT = 10;

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);

  // The backend has no GET /admin/users/:id - only a filtered list. We
  // fetch a generously-sized STUDENT page and find the match client-side.
  // See README "Known limitations" for the suggested backend addition.
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersIsError,
    error: usersError,
    refetch: refetchUsers,
  } = useAdminUsers({ page: 1, limit: 500, role: 'STUDENT' });
  const student = usersData?.users.find((u) => u.id === id);

  const {
    data: rentalsData,
    isLoading: rentalsLoading,
    isError: rentalsIsError,
    error: rentalsError,
    refetch: refetchRentals,
  } = useAdminRentals({ page, limit: RENTALS_LIMIT, studentId: id });

  if (usersLoading) return <LoadingState label="Loading student…" />;
  if (usersIsError) return <ErrorState error={usersError} onRetry={refetchUsers} />;

  return (
    <div>
      <Link to="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>

      {!student ? (
        <EmptyState title="Student not found" description="This student may have been removed or the link is out of date." />
      ) : (
        <>
          <PageHeader
            title={student.name}
            description={`${student.lpuId} · ${student.email}`}
            action={<StatusBadge label={userStatusMeta[student.status].label} tone={userStatusMeta[student.status].tone} />}
          />

          <Card className="mb-6">
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label="Phone" value={student.phone ?? '—'} />
              <InfoItem label="LPU ID" value={student.lpuId} />
              <InfoItem label="Joined" value={formatDateTime(student.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rental & payment history</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rentalsLoading ? (
                <LoadingState />
              ) : rentalsIsError ? (
                <ErrorState error={rentalsError} onRetry={refetchRentals} />
              ) : !rentalsData || rentalsData.rentals.length === 0 ? (
                <EmptyState title="No rentals yet" description="This student hasn't rented an umbrella." />
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                        <th className="px-5 py-3 font-medium">Umbrella</th>
                        <th className="px-5 py-3 font-medium">Rental status</th>
                        <th className="px-5 py-3 font-medium">Payment</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rentalsData.rentals.map((rental) => {
                        const rMeta = rentalStatusMeta[rental.status];
                        const pMeta = rental.payment ? paymentStatusMeta[rental.payment.status] : null;
                        return (
                          <tr key={rental.id}>
                            <td className="px-5 py-3 font-medium text-text-primary">{rental.umbrella?.publicCode}</td>
                            <td className="px-5 py-3"><StatusBadge label={rMeta.label} tone={rMeta.tone} /></td>
                            <td className="px-5 py-3">
                              {pMeta ? <StatusBadge label={pMeta.label} tone={pMeta.tone} /> : <span className="text-text-secondary">—</span>}
                            </td>
                            <td className="px-5 py-3 text-text-secondary">{formatPaise(rental.priceAtRentalPaise)}</td>
                            <td className="px-5 py-3 text-text-secondary">{formatDateTime(rental.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-5 pb-4">
                    <Pagination page={rentalsData.page} limit={rentalsData.limit} total={rentalsData.total} onPageChange={setPage} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}
