import { useMemo, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input, Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, StaffQueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { useStaffInventory } from '@/hooks/useStaffQueries';
import { useDebounce } from '@/hooks/useDebounce';
import { umbrellaStatusMeta, umbrellaConditionMeta, rentalStatusMeta } from '@/utils/statusMeta';
import type { Umbrella, UmbrellaStatus } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/utils/date';
import { staffApi } from '@/api/staff';
import { ApiError } from '@/api/client';

const STATUS_FILTERS: Array<UmbrellaStatus | 'ALL'> = [
  'ALL',
  'AVAILABLE',
  'RENTED',
  'MAINTENANCE',
  'MISSING',
  'LOST',
  'RETIRED',
];

export default function InventoryPage() {
  const { data, isLoading, isError, error, refetch } = useStaffInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UmbrellaStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Umbrella | null>(null);
  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = debouncedSearch.trim().toLowerCase();
    return data.umbrellas.filter((u) => {
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchesSearch = !term || u.publicCode.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [data, debouncedSearch, statusFilter]);

  return (
    <div>
      <PageHeader title="Inventory" description="Umbrellas currently at your station." />

      <StaffQueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <Input
                  placeholder="Search by umbrella ID (e.g. UMB-0001)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UmbrellaStatus | 'ALL')}
                className="sm:w-48"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All statuses' : umbrellaStatusMeta[s].label}
                  </option>
                ))}
              </Select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="No umbrellas found"
                description={
                  data.umbrellas.length === 0
                    ? 'No umbrellas are currently assigned to this station.'
                    : 'Try a different search term or status filter.'
                }
              />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Umbrella ID</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Condition</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((umbrella) => {
                      const meta = umbrellaStatusMeta[umbrella.status];
                      const condMeta = umbrellaConditionMeta[umbrella.condition];
                      return (
                        <tr
                          key={umbrella.id}
                          onClick={() => setSelected(umbrella)}
                          className="cursor-pointer hover:bg-surface-secondary/40"
                        >
                          <td className="px-4 py-3 font-medium text-text-primary">{umbrella.publicCode}</td>
                          <td className="px-4 py-3">
                            <StatusBadge label={meta.label} tone={meta.tone} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge label={condMeta.label} tone={condMeta.tone} />
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(umbrella.updatedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}
      </StaffQueryGate>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.publicCode} size="sm">
        {selected && (
          <div className="space-y-3 text-sm">
            <Row label="Status">
              <StatusBadge label={umbrellaStatusMeta[selected.status].label} tone={umbrellaStatusMeta[selected.status].tone} />
            </Row>
            <Row label="Condition">
              <StatusBadge
                label={umbrellaConditionMeta[selected.condition].label}
                tone={umbrellaConditionMeta[selected.condition].tone}
              />
            </Row>
            <Row label="QR identifier">
              <span className="font-mono text-xs text-text-primary">{selected.qrIdentifier}</span>
            </Row>
            <Row label="Last updated">
              <span className="text-text-primary">{formatDateTime(selected.updatedAt)}</span>
            </Row>
            {selected.status === 'RENTED' && <CurrentRentalInfo umbrellaCode={selected.publicCode} />}
          </div>
        )}
      </Modal>
    </div>
  );
}

function CurrentRentalInfo({ umbrellaCode }: { umbrellaCode: string }) {
  const { data: rental, isLoading, error } = useQuery({
    queryKey: ['inventory-rental-lookup', umbrellaCode],
    queryFn: () => staffApi.lookupRentalByUmbrellaCode(umbrellaCode),
    retry: false,
  });

  if (isLoading) {
    return <p className="pt-2 text-xs text-text-secondary">Loading current rental…</p>;
  }
  if (error) {
    // NO_ACTIVE_RENTAL_FOR_UMBRELLA just means the data hasn't caught up
    // yet or the rental completed between page loads - not a real error.
    if (error instanceof ApiError && error.code === 'NO_ACTIVE_RENTAL_FOR_UMBRELLA') return null;
    return null;
  }
  if (!rental) return null;

  const meta = rentalStatusMeta[rental.status];
  return (
    <div className="mt-3 rounded-lg border border-border bg-surface-secondary/40 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Current rental</p>
      <Row label="Student">
        <span className="text-text-primary">
          {rental.student?.name} ({rental.student?.lpuId})
        </span>
      </Row>
      <Row label="Rental status">
        <StatusBadge label={meta.label} tone={meta.tone} />
      </Row>
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
