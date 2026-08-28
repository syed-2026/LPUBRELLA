import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QueryGate, InlineError, EmptyState } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { Input, Label, Select } from '@/components/ui/Field';
import { useStation, useUpdateStation, useAdminUsers, useAdminRentals } from '@/hooks/useAdminQueries';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { stationStatusMeta, rentalStatusMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import type { StationStatus } from '@/types';

export default function AdminStationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: station, isLoading, isError, error, refetch } = useStation(id);
  const [editOpen, setEditOpen] = useState(false);

  // Staff assigned to this station: filter the admin users list client-side.
  // There's no dedicated "staff at station X" endpoint, so we fetch STAFF
  // role users at a generous page size and filter - station rosters are
  // small in practice.
  const { data: staffData } = useAdminUsers({ page: 1, limit: 100, role: 'STAFF' });
  const assignedStaff = staffData?.users.filter((u) => u.assignedStationId === id) ?? [];

  const { data: rentalsData } = useAdminRentals({ page: 1, limit: 10 });
  const stationActivity = rentalsData?.rentals.filter((r) => r.originStationId === id) ?? [];

  return (
    <div>
      <Link to="/admin/stations" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to stations
      </Link>

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {station && (
          <>
            <PageHeader
              title={station.name}
              description={`${station.code} · ${station.openingTime} – ${station.closingTime}`}
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge label={stationStatusMeta[station.status].label} tone={stationStatusMeta[station.status].tone} />
                  <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                </div>
              }
            />

            {station.description && <p className="mb-6 text-sm text-text-secondary">{station.description}</p>}

            {station.inventory && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'MISSING', 'LOST', 'RETIRED'] as const).map((key) => (
                  <Card key={key} className="p-4">
                    <p className="text-xs text-text-secondary">{key}</p>
                    <p className="mt-1 text-xl font-semibold text-text-primary">{station.inventory![key]}</p>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Assigned staff</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {assignedStaff.length === 0 ? (
                    <EmptyState title="No staff assigned" description="Assign staff to this station from the Staff page." />
                  ) : (
                    <div className="divide-y divide-border">
                      {assignedStaff.map((s) => (
                        <div key={s.id} className="px-5 py-3">
                          <p className="text-sm font-medium text-text-primary">{s.name}</p>
                          <p className="text-xs text-text-secondary">{s.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {stationActivity.length === 0 ? (
                    <EmptyState title="No recent rentals" description="Rentals originating from this station will show here." />
                  ) : (
                    <div className="divide-y divide-border">
                      {stationActivity.map((r) => {
                        const meta = rentalStatusMeta[r.status];
                        return (
                          <div key={r.id} className="flex items-center justify-between px-5 py-3">
                            <div>
                              <p className="text-sm text-text-primary">{r.umbrella?.publicCode}</p>
                              <p className="text-xs text-text-secondary">{formatDateTime(r.createdAt)}</p>
                            </div>
                            <StatusBadge label={meta.label} tone={meta.tone} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <EditStationModal open={editOpen} onClose={() => setEditOpen(false)} station={station} />
          </>
        )}
      </QueryGate>
    </div>
  );
}

function EditStationModal({
  open,
  onClose,
  station,
}: {
  open: boolean;
  onClose: () => void;
  station: NonNullable<ReturnType<typeof useStation>['data']>;
}) {
  const [form, setForm] = useState({
    name: station.name,
    description: station.description ?? '',
    capacity: String(station.capacity),
    openingTime: station.openingTime,
    closingTime: station.closingTime,
    status: station.status,
  });
  const updateStation = useUpdateStation();
  const toast = useToast();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateStation.mutate(
      {
        id: station.id,
        payload: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          capacity: Number(form.capacity),
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          status: form.status as StationStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success('Station updated.');
          onClose();
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit station" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="editName">Name</Label>
          <Input id="editName" required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="editDescription">Description</Label>
          <Input id="editDescription" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="editCapacity">Capacity</Label>
            <Input
              id="editCapacity"
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="editOpening">Opens</Label>
            <Input
              id="editOpening"
              type="time"
              required
              value={form.openingTime}
              onChange={(e) => update('openingTime', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="editClosing">Closes</Label>
            <Input
              id="editClosing"
              type="time"
              required
              value={form.closingTime}
              onChange={(e) => update('closingTime', e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="editStatus">Status</Label>
          <Select id="editStatus" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAINTENANCE">Maintenance</option>
          </Select>
        </div>

        {updateStation.error instanceof ApiError && <InlineError message={updateStation.error.message} />}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateStation.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
