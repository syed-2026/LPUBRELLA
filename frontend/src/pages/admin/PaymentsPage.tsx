import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, QueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminPayments } from '@/hooks/useAdminQueries';
import { paymentStatusMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import { formatPaise } from '@/utils/money';
import type { PaymentStatus } from '@/types';

const LIMIT = 20;
const STATUS_OPTIONS: Array<PaymentStatus | 'ALL'> = ['ALL', 'CREATED', 'PENDING', 'VERIFIED', 'FAILED', 'REFUNDED'];

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PaymentStatus | 'ALL'>('ALL');

  const { data, isLoading, isError, error, refetch } = useAdminPayments({
    page,
    limit: LIMIT,
    status: status === 'ALL' ? undefined : status,
  });

  return (
    <div>
      <PageHeader title="Payments" description="All payment records across the system." />

      <div className="mb-4">
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value as PaymentStatus | 'ALL'); setPage(1); }}
          className="sm:w-48"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : paymentStatusMeta[s].label}</option>
          ))}
        </Select>
      </div>

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.payments.length === 0 ? (
              <EmptyState title="No payments found" description="Try a different filter." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Provider</th>
                      <th className="px-4 py-3 font-medium">Order ID</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.payments.map((payment) => {
                      const meta = paymentStatusMeta[payment.status];
                      return (
                        <tr key={payment.id} className="hover:bg-surface-secondary/40">
                          <td className="px-4 py-3 text-text-primary">{payment.provider}</td>
                          <td className="px-4 py-3 font-mono text-xs text-text-secondary">{payment.providerOrderId ?? '—'}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatPaise(payment.amountPaise)}</td>
                          <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(payment.createdAt)}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(payment.verifiedAt)}</td>
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
    </div>
  );
}
