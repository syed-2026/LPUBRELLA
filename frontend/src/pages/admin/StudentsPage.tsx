import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, QueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminUsers } from '@/hooks/useAdminQueries';
import { useDebounce } from '@/hooks/useDebounce';
import { userStatusMeta } from '@/utils/statusMeta';

const LIMIT = 20;

export default function AdminStudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, error, refetch } = useAdminUsers({ page, limit: LIMIT, role: 'STUDENT' });

  // The backend's user list has no free-text search param, so we filter
  // the current page client-side - acceptable since each page is capped.
  const visible = data?.users.filter((u) => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return true;
    return u.name.toLowerCase().includes(term) || u.lpuId.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  }) ?? [];

  return (
    <div>
      <PageHeader title="Students" description="Student directory." />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          placeholder="Search this page by name, LPU ID, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {visible.length === 0 ? (
              <EmptyState title="No students found" description="Try a different search." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">LPU ID</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((student) => {
                      const meta = userStatusMeta[student.status];
                      return (
                        <tr key={student.id} className="hover:bg-surface-secondary/40">
                          <td className="px-4 py-3">
                            <Link to={`/admin/students/${student.id}`} className="font-medium text-text-primary hover:underline">
                              {student.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{student.lpuId}</td>
                          <td className="px-4 py-3 text-text-secondary">{student.email}</td>
                          <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
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
