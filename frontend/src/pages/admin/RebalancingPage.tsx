import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, InlineError, QueryGate } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminRebalancingTasks, useCreateRebalancingTask, useAdminStations, useAdminUsers } from '@/hooks/useAdminQueries';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { rebalancingStatusMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';

const LIMIT = 20;

export default function AdminRebalancingPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: stationsData } = useAdminStations({ page: 1, limit: 100 });

  const { data, isLoading, isError, error, refetch } = useAdminRebalancingTasks({ page, limit: LIMIT });

  function stationName(id: string) {
    return stationsData?.stations.find((s) => s.id === id)?.name ?? '—';
  }

  return (
    <div>
      <PageHeader
        title="Rebalancing"
        description="Coordinate moving umbrellas between stations to balance supply."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        }
      />

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.tasks.length === 0 ? (
              <EmptyState title="No rebalancing tasks" description="Create a task to move umbrellas between stations." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">From</th>
                      <th className="px-4 py-3 font-medium">To</th>
                      <th className="px-4 py-3 font-medium">Umbrellas</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.tasks.map((task) => {
                      const meta = rebalancingStatusMeta[task.status];
                      return (
                        <tr key={task.id} className="hover:bg-surface-secondary/40">
                          <td className="px-4 py-3 text-text-primary">{stationName(task.fromStationId)}</td>
                          <td className="px-4 py-3 text-text-primary">{stationName(task.toStationId)}</td>
                          <td className="px-4 py-3 text-text-secondary">{task.umbrellaCount}</td>
                          <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
                          <td className="px-4 py-3 text-text-secondary">{formatDateTime(task.createdAt)}</td>
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

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fromStationId, setFromStationId] = useState('');
  const [toStationId, setToStationId] = useState('');
  const [umbrellaCount, setUmbrellaCount] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: stationsData } = useAdminStations({ page: 1, limit: 100 });
  const { data: staffData } = useAdminUsers({ page: 1, limit: 100, role: 'STAFF' });
  const createTask = useCreateRebalancingTask();
  const toast = useToast();

  function handleClose() {
    setFromStationId('');
    setToStationId('');
    setUmbrellaCount('');
    setAssignedStaffId('');
    setNotes('');
    createTask.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createTask.mutate(
      {
        fromStationId,
        toStationId,
        umbrellaCount: Number(umbrellaCount),
        assignedStaffId: assignedStaffId || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: () => { toast.success('Rebalancing task created.'); handleClose(); } }
    );
  }

  const stations = stationsData?.stations ?? [];

  return (
    <Modal open={open} onClose={handleClose} title="New rebalancing task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fromStation">From station</Label>
            <Select id="fromStation" required value={fromStationId} onChange={(e) => setFromStationId(e.target.value)}>
              <option value="">Select…</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="toStation">To station</Label>
            <Select id="toStation" required value={toStationId} onChange={(e) => setToStationId(e.target.value)}>
              <option value="">Select…</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="umbrellaCount">Number of umbrellas</Label>
          <Input id="umbrellaCount" type="number" min={1} required value={umbrellaCount} onChange={(e) => setUmbrellaCount(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="assignedStaff">Assign to staff (optional)</Label>
          <Select id="assignedStaff" value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)}>
            <option value="">Unassigned</option>
            {staffData?.users.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {createTask.error instanceof ApiError && <InlineError message={createTask.error.message} />}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={createTask.isPending}>Create task</Button>
        </div>
      </form>
    </Modal>
  );
}
