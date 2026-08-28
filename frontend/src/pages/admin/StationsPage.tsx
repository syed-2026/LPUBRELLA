import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, InlineError, QueryGate } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { useAdminStations, useCreateStation } from '@/hooks/useAdminQueries';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { stationStatusMeta } from '@/utils/statusMeta';

const LIMIT = 20;

export default function AdminStationsPage() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useAdminStations({ page, limit: LIMIT });

  return (
    <div>
      <PageHeader
        title="Stations"
        description="All campus umbrella stations."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add station
          </Button>
        }
      />

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            {data.stations.length === 0 ? (
              <EmptyState title="No stations yet" description="Add your first station to get started." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.stations.map((station) => {
                  const meta = stationStatusMeta[station.status];
                  return (
                    <Link key={station.id} to={`/admin/stations/${station.id}`}>
                      <Card className="h-full p-4 transition-shadow hover:shadow-elevated">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-text-primary">{station.name}</p>
                            <p className="text-xs text-text-secondary">{station.code}</p>
                          </div>
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </div>
                        <p className="mt-3 text-xs text-text-secondary">
                          {station.openingTime} – {station.closingTime} · Capacity {station.capacity}
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
            <Pagination page={data.page} limit={data.limit} total={data.total} onPageChange={setPage} />
          </>
        )}
      </QueryGate>

      <CreateStationModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateStationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    capacity: '',
    openingTime: '06:00',
    closingTime: '22:00',
  });
  const createStation = useCreateStation();
  const toast = useToast();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleClose() {
    setForm({
      code: '',
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      capacity: '',
      openingTime: '06:00',
      closingTime: '22:00',
    });
    createStation.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createStation.mutate(
      {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        capacity: Number(form.capacity),
        openingTime: form.openingTime,
        closingTime: form.closingTime,
      },
      {
        onSuccess: () => {
          toast.success('Station created.');
          handleClose();
        },
      }
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add station" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="code">Station code</Label>
            <Input id="code" required value={form.code} onChange={(e) => update('code', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              required
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              required
              value={form.latitude}
              onChange={(e) => update('latitude', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              required
              value={form.longitude}
              onChange={(e) => update('longitude', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="openingTime">Opening time</Label>
            <Input
              id="openingTime"
              type="time"
              required
              value={form.openingTime}
              onChange={(e) => update('openingTime', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="closingTime">Closing time</Label>
            <Input
              id="closingTime"
              type="time"
              required
              value={form.closingTime}
              onChange={(e) => update('closingTime', e.target.value)}
            />
          </div>
        </div>

        {createStation.error instanceof ApiError && <InlineError message={createStation.error.message} />}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createStation.isPending}>
            Create station
          </Button>
        </div>
      </form>
    </Modal>
  );
}
