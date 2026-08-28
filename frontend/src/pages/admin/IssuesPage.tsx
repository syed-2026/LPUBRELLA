import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, QueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminDamageReports } from '@/hooks/useAdminQueries';
import { damageReportStatusMeta, damageSeverityMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import type { DamageReportStatus } from '@/types';

const LIMIT = 20;
const STATUS_OPTIONS: Array<DamageReportStatus | 'ALL'> = ['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED'];

export default function AdminIssuesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<DamageReportStatus | 'ALL'>('ALL');

  const { data, isLoading, isError, error, refetch } = useAdminDamageReports({
    page,
    limit: LIMIT,
    status: status === 'ALL' ? undefined : status,
  });

  return (
    <div>
      <PageHeader title="Damage & Issues" description="Umbrella damage and missing reports filed by staff." />

      <div className="mb-4">
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value as DamageReportStatus | 'ALL'); setPage(1); }}
          className="sm:w-48"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : damageReportStatusMeta[s].label}</option>
          ))}
        </Select>
      </div>

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.reports.length === 0 ? (
              <EmptyState title="No issues found" description="Damage and missing reports will appear here." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Umbrella</th>
                      <th className="px-4 py-3 font-medium">Reported by</th>
                      <th className="px-4 py-3 font-medium">Severity</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.reports.map((report) => {
                      const statusMeta = damageReportStatusMeta[report.status];
                      const sevMeta = damageSeverityMeta[report.severity];
                      return (
                        <tr key={report.id} className="hover:bg-surface-secondary/40">
                          <td className="px-4 py-3 font-medium text-text-primary">{report.umbrella?.publicCode ?? '—'}</td>
                          <td className="px-4 py-3 text-text-secondary">{report.reportedBy?.name ?? '—'}</td>
                          <td className="px-4 py-3"><StatusBadge label={sevMeta.label} tone={sevMeta.tone} /></td>
                          <td className="px-4 py-3"><StatusBadge label={statusMeta.label} tone={statusMeta.tone} /></td>
                          <td className="max-w-xs truncate px-4 py-3 text-text-secondary">{report.description}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(report.createdAt)}</td>
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
