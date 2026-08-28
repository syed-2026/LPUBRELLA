import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Field';
import { EmptyState, QueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminAuditLogs } from '@/hooks/useAdminQueries';
import { formatDateTime } from '@/utils/date';

const LIMIT = 30;

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading, isError, error, refetch } = useAdminAuditLogs({
    page,
    limit: LIMIT,
    action: actionFilter || undefined,
  });

  return (
    <div>
      <PageHeader title="Audit Logs" description="System activity trail." />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Filter by action (e.g. RENTAL_CREATED)"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value.toUpperCase()); setPage(1); }}
        />
      </div>

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.logs.length === 0 ? (
              <EmptyState title="No audit log entries" description="Try a different filter." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Action</th>
                      <th className="px-4 py-3 font-medium">Entity</th>
                      <th className="px-4 py-3 font-medium">Actor</th>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-secondary/40">
                        <td className="px-4 py-3 font-mono text-xs text-text-primary">{log.action}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {log.entity}
                          {log.entityId && <span className="ml-1 font-mono text-xs">#{log.entityId.slice(0, 8)}</span>}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{log.actor?.name ?? 'System'}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatDateTime(log.createdAt)}</td>
                      </tr>
                    ))}
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
