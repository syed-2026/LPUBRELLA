import { useState, type FormEvent } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, InlineError, QueryGate } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminUsers, useCreateStaffOrAdmin, useUpdateUser, useAdminStations } from '@/hooks/useAdminQueries';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { userStatusMeta } from '@/utils/statusMeta';
import type { User, UserStatus } from '@/types';

const LIMIT = 20;

export default function AdminStaffPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const { data: stationsData } = useAdminStations({ page: 1, limit: 100 });

  const { data, isLoading, isError, error, refetch } = useAdminUsers({ page, limit: LIMIT, role: 'STAFF' });

  function stationName(id: string | null) {
    if (!id) return 'Unassigned';
    return stationsData?.stations.find((s) => s.id === id)?.name ?? 'Unknown station';
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage staff accounts and station assignments."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add staff
          </Button>
        }
      />

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.users.length === 0 ? (
              <EmptyState title="No staff yet" description="Add your first staff account to get started." />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Station</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.users.map((staff) => {
                      const meta = userStatusMeta[staff.status];
                      return (
                        <tr key={staff.id} className="hover:bg-surface-secondary/40">
                          <td className="px-4 py-3 font-medium text-text-primary">{staff.name}</td>
                          <td className="px-4 py-3 text-text-secondary">{staff.email}</td>
                          <td className="px-4 py-3 text-text-secondary">{stationName(staff.assignedStationId)}</td>
                          <td className="px-4 py-3"><StatusBadge label={meta.label} tone={meta.tone} /></td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(staff)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </td>
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

      <CreateStaffModal open={createOpen} onClose={() => setCreateOpen(false)} stations={stationsData?.stations ?? []} />
      <EditStaffModal staff={editing} onClose={() => setEditing(null)} stations={stationsData?.stations ?? []} />
    </div>
  );
}

function CreateStaffModal({
  open,
  onClose,
  stations,
}: {
  open: boolean;
  onClose: () => void;
  stations: Array<{ id: string; name: string; code: string }>;
}) {
  const [form, setForm] = useState({ lpuId: '', name: '', email: '', phone: '', password: '', assignedStationId: '' });
  const createStaff = useCreateStaffOrAdmin();
  const toast = useToast();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleClose() {
    setForm({ lpuId: '', name: '', email: '', phone: '', password: '', assignedStationId: '' });
    createStaff.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createStaff.mutate(
      {
        lpuId: form.lpuId.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        role: 'STAFF',
        assignedStationId: form.assignedStationId || undefined,
      },
      { onSuccess: () => { toast.success('Staff account created.'); handleClose(); } }
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add staff account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="staffLpuId">LPU ID</Label>
            <Input id="staffLpuId" required value={form.lpuId} onChange={(e) => update('lpuId', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="staffPhone">Phone</Label>
            <Input id="staffPhone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="staffName">Name</Label>
          <Input id="staffName" required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="staffEmail">Email</Label>
          <Input id="staffEmail" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="staffPassword">Temporary password</Label>
          <Input
            id="staffPassword"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
          />
          <p className="mt-1 text-xs text-text-secondary">At least 8 characters, including a letter and a number.</p>
        </div>
        <div>
          <Label htmlFor="staffStation">Assigned station</Label>
          <Select id="staffStation" value={form.assignedStationId} onChange={(e) => update('assignedStationId', e.target.value)}>
            <option value="">Unassigned</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </Select>
        </div>

        {createStaff.error instanceof ApiError && <InlineError message={createStaff.error.message} />}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={createStaff.isPending}>Create account</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditStaffModal({
  staff,
  onClose,
  stations,
}: {
  staff: User | null;
  onClose: () => void;
  stations: Array<{ id: string; name: string; code: string }>;
}) {
  const updateUser = useUpdateUser();
  const toast = useToast();
  const [assignedStationId, setAssignedStationId] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');

  // Sync local form state whenever a different staff member is selected.
  const [lastId, setLastId] = useState<string | null>(null);
  if (staff && staff.id !== lastId) {
    setLastId(staff.id);
    setAssignedStationId(staff.assignedStationId ?? '');
    setStatus(staff.status);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!staff) return;
    updateUser.mutate(
      { id: staff.id, payload: { assignedStationId: assignedStationId || null, status } },
      { onSuccess: () => { toast.success('Staff account updated.'); onClose(); } }
    );
  }

  return (
    <Modal open={!!staff} onClose={onClose} title={staff?.name}>
      {staff && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="editStaffStation">Assigned station</Label>
            <Select id="editStaffStation" value={assignedStationId} onChange={(e) => setAssignedStationId(e.target.value)}>
              <option value="">Unassigned</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="editStaffStatus">Account status</Label>
            <Select id="editStaffStatus" value={status} onChange={(e) => setStatus(e.target.value as UserStatus)}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive (deactivated)</option>
            </Select>
          </div>

          {updateUser.error instanceof ApiError && <InlineError message={updateUser.error.message} />}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={updateUser.isPending}>Save changes</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
