import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, InlineError, QueryGate } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import {
  useAdminUmbrellas,
  useCreateUmbrella,
  useUpdateUmbrella,
  useAdminStations,
} from '@/hooks/useAdminQueries';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { umbrellaStatusMeta, umbrellaConditionMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import type { Umbrella, UmbrellaCondition, UmbrellaStatus } from '@/types';

const LIMIT = 20;
const STATUS_OPTIONS: Array<UmbrellaStatus | 'ALL'> = [
  'ALL',
  'AVAILABLE',
  'RENTED',
  'MAINTENANCE',
  'MISSING',
  'LOST',
  'RETIRED',
];

export default function AdminUmbrellasPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<UmbrellaStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Umbrella | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, error, refetch } = useAdminUmbrellas({
    page,
    limit: LIMIT,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  // The backend's umbrella list filters by status/stationId only (no
  // free-text search param), so we filter the current page client-side
  // by publicCode - acceptable since each page is capped at LIMIT rows.
  const visible = useMemo(() => {
    if (!data) return [];
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data.umbrellas;
    return data.umbrellas.filter((u) => u.publicCode.toLowerCase().includes(term));
  }, [data, debouncedSearch]);

  return (
    <div>
      <PageHeader
        title="Umbrellas"
        description="Fleet-wide umbrella inventory."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add umbrella
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search this page by umbrella ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as UmbrellaStatus | 'ALL');
            setPage(1);
          }}
          className="sm:w-48"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All statuses' : umbrellaStatusMeta[s].label}
            </option>
          ))}
        </Select>
      </div>

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {visible.length === 0 ? (
              <EmptyState title="No umbrellas found" description="Try a different search or filter." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Umbrella ID</th>
                      <th className="px-4 py-3 font-medium">Station</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Condition</th>
                      <th className="px-4 py-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((u) => {
                      const meta = umbrellaStatusMeta[u.status];
                      const condMeta = umbrellaConditionMeta[u.condition];
                      return (
                        <tr key={u.id} onClick={() => setSelected(u)} className="cursor-pointer hover:bg-surface-secondary/40">
                          <td className="px-4 py-3 font-medium text-text-primary">{u.publicCode}</td>
                          <td className="px-4 py-3 text-text-secondary">{u.currentStation?.name ?? '—'}</td>
                          <td className="px-4 py-3">
                            <StatusBadge label={meta.label} tone={meta.tone} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge label={condMeta.label} tone={condMeta.tone} />
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(u.updatedAt)}</td>
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

      <CreateUmbrellaModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUmbrellaModal umbrella={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CreateUmbrellaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [publicCode, setPublicCode] = useState('');
  const [qrIdentifier, setQrIdentifier] = useState('');
  const [stationId, setStationId] = useState('');
  const [condition, setCondition] = useState<UmbrellaCondition>('GOOD');
  const { data: stationsData } = useAdminStations({ page: 1, limit: 100 });
  const createUmbrella = useCreateUmbrella();
  const toast = useToast();

  function handleClose() {
    setPublicCode('');
    setQrIdentifier('');
    setStationId('');
    setCondition('GOOD');
    createUmbrella.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createUmbrella.mutate(
      { publicCode: publicCode.trim(), qrIdentifier: qrIdentifier.trim(), currentStationId: stationId, condition },
      { onSuccess: () => { toast.success('Umbrella created.'); handleClose(); } }
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add umbrella">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="publicCode">Umbrella ID (public code)</Label>
          <Input id="publicCode" required placeholder="UMB-0031" value={publicCode} onChange={(e) => setPublicCode(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="qrIdentifier">QR identifier</Label>
          <Input id="qrIdentifier" required placeholder="UMB-0031" value={qrIdentifier} onChange={(e) => setQrIdentifier(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="stationSelect">Station</Label>
          <Select id="stationSelect" required value={stationId} onChange={(e) => setStationId(e.target.value)}>
            <option value="">Select a station…</option>
            {stationsData?.stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="conditionSelect">Condition</Label>
          <Select id="conditionSelect" value={condition} onChange={(e) => setCondition(e.target.value as UmbrellaCondition)}>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="DAMAGED">Damaged</option>
          </Select>
        </div>

        {createUmbrella.error instanceof ApiError && <InlineError message={createUmbrella.error.message} />}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={createUmbrella.isPending}>Create umbrella</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditUmbrellaModal({ umbrella, onClose }: { umbrella: Umbrella | null; onClose: () => void }) {
  const updateUmbrella = useUpdateUmbrella();
  const toast = useToast();
  const [status, setStatus] = useState<UmbrellaStatus | ''>('');
  const [condition, setCondition] = useState<UmbrellaCondition | ''>('');

  useEffect(() => {
    if (umbrella) {
      setStatus(umbrella.status);
      setCondition(umbrella.condition);
    }
  }, [umbrella]);

  function handleClose() {
    setStatus('');
    setCondition('');
    updateUmbrella.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!umbrella) return;
    updateUmbrella.mutate(
      { id: umbrella.id, payload: { status: status || undefined, condition: condition || undefined } },
      { onSuccess: () => { toast.success('Umbrella updated.'); handleClose(); } }
    );
  }

  return (
    <Modal open={!!umbrella} onClose={handleClose} title={umbrella?.publicCode}>
      {umbrella && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="editUmbStatus">Status</Label>
            <Select id="editUmbStatus" value={status} onChange={(e) => setStatus(e.target.value as UmbrellaStatus)}>
              {(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'MISSING', 'LOST', 'RETIRED'] as const).map((s) => (
                <option key={s} value={s}>
                  {umbrellaStatusMeta[s].label}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-text-secondary">
              Only valid transitions are accepted by the backend; invalid changes will show an error below.
            </p>
          </div>
          <div>
            <Label htmlFor="editUmbCondition">Condition</Label>
            <Select id="editUmbCondition" value={condition} onChange={(e) => setCondition(e.target.value as UmbrellaCondition)}>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged</option>
            </Select>
          </div>

          {updateUmbrella.error instanceof ApiError && <InlineError message={updateUmbrella.error.message} />}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button type="submit" isLoading={updateUmbrella.isPending}>Save changes</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
