import { useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, QueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { useAdminRentals } from '@/hooks/useAdminQueries';
import { rentalStatusMeta, paymentStatusMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import { formatPaise } from '@/utils/money';
import type { Rental, RentalStatus } from '@/types';

const LIMIT = 20;
const STATUS_OPTIONS: Array<RentalStatus | 'ALL'> = [
  'ALL', 'CREATED', 'PAYMENT_PENDING', 'ACTIVE', 'OVERDUE', 'RETURN_PENDING', 'COMPLETED', 'CANCELLED', 'LOST',
];

export default function AdminRentalsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RentalStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Rental | null>(null);

  const { data, isLoading, isError, error, refetch } = useAdminRentals({
    page,
    limit: LIMIT,
    status: status === 'ALL' ? undefined : status,
  });

  return (
    <div>
      <PageHeader title="Rentals" description="System-wide rental records." />

      <div className="mb-4">
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value as RentalStatus | 'ALL'); setPage(1); }}
          className="sm:w-56"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : rentalStatusMeta[s].label}</option>
          ))}
        </Select>
      </div>

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.rentals.length === 0 ? (
              <EmptyState title="No rentals found" description="Try a different filter." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Umbrella</th>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Station</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.rentals.map((rental) => {
                      const meta = rentalStatusMeta[rental.status];
                      return (
                        <tr key={rental.id} onClick={() => setSelected(rental)} className="cursor-pointer hover:bg-surface-secondary/40">
                          <td className="px-4 py-3 font-medium text-text-primary">{rental.umbrella?.publicCode ?? '—'}</td>
                          <td className="px-4 py-3 text-text-secondary">{rental.student?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-text-secondary">{rental.originStation?.name ?? '—'}</td>
                          <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
                          <td className="px-4 py-3 text-text-secondary">{formatPaise(rental.priceAtRentalPaise)}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(rental.createdAt)}</td>
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
      </QueryGate>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Rental details" size="md">
        {selected && <RentalDetail rental={selected} />}
      </Modal>
    </div>
  );
}

function RentalDetail({ rental }: { rental: Rental }) {
  const meta = rentalStatusMeta[rental.status];
  return (
    <div className="space-y-3 text-sm">
      <Row label="Umbrella"><span className="font-medium text-text-primary">{rental.umbrella?.publicCode}</span></Row>
      <Row label="Student"><span className="text-text-primary">{rental.student?.name} ({rental.student?.lpuId})</span></Row>
      <Row label="Plan"><span className="text-text-primary">{rental.pricingPlan?.name}</span></Row>
      <Row label="Status"><StatusBadge label={meta.label} tone={meta.tone} /></Row>
      <Row label="Amount"><span className="text-text-primary">{formatPaise(rental.priceAtRentalPaise)}</span></Row>
      <Row label="Origin station"><span className="text-text-primary">{rental.originStation?.name ?? '—'}</span></Row>
      <Row label="Return station"><span className="text-text-primary">{rental.returnStation?.name ?? '—'}</span></Row>
      <Row label="Created"><span className="text-text-primary">{formatDateTime(rental.createdAt)}</span></Row>
      <Row label="Started"><span className="text-text-primary">{formatDateTime(rental.startedAt)}</span></Row>
      <Row label="Due"><span className="text-text-primary">{formatDateTime(rental.dueAt)}</span></Row>
      <Row label="Completed"><span className="text-text-primary">{formatDateTime(rental.completedAt)}</span></Row>
      {rental.payment && (
        <Row label="Payment">
          <StatusBadge label={paymentStatusMeta[rental.payment.status].label} tone={paymentStatusMeta[rental.payment.status].tone} />
        </Row>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-text-secondary">{label}</span>
      {children}
    </div>
  );
}
