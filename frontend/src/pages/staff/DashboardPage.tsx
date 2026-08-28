import { Umbrella, PackageCheck, Wrench, AlertOctagon, ArrowDownToLine, ArrowUpFromLine, Bell } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, StaffQueryGate } from '@/components/ui/States';
import { useStaffDashboard } from '@/hooks/useStaffQueries';
import { stationStatusMeta, rentalStatusMeta } from '@/utils/statusMeta';
import { formatDateTime, isToday } from '@/utils/date';
import { Link } from 'react-router-dom';

export default function StaffDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useStaffDashboard();

  return (
    <StaffQueryGate
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      loadingLabel="Loading dashboard…"
    >
      {data && <DashboardContent data={data} />}
    </StaffQueryGate>
  );
}

function DashboardContent({ data }: { data: NonNullable<ReturnType<typeof useStaffDashboard>['data']> }) {

  const { station, inventory, recentRentals } = data;
  const stationMeta = stationStatusMeta[station.status];

  const todaysRentals = recentRentals.filter((r) => isToday(r.createdAt));
  const todaysReturns = recentRentals.filter((r) => r.completedAt && isToday(r.completedAt));
  const overdueCount = recentRentals.filter((r) => r.status === 'OVERDUE').length;

  return (
    <div>
      <PageHeader
        title={`${station.name}`}
        description={`Station ${station.code} · ${station.openingTime}–${station.closingTime}`}
        action={<StatusBadge label={stationMeta.label} tone={stationMeta.tone} />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Available" value={inventory.AVAILABLE} icon={PackageCheck} tone="available" />
        <StatCard label="Rented" value={inventory.RENTED} icon={Umbrella} />
        <StatCard label="Maintenance" value={inventory.MAINTENANCE} icon={Wrench} />
        <StatCard label="Missing" value={inventory.MISSING} icon={AlertOctagon} tone="unavailable" />
        <StatCard label="Lost" value={inventory.LOST} icon={AlertOctagon} tone="unavailable" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today's rentals" value={todaysRentals.length} icon={ArrowUpFromLine} />
        <StatCard label="Today's returns" value={todaysReturns.length} icon={ArrowDownToLine} />
        <StatCard
          label="Overdue alerts"
          value={overdueCount}
          icon={Bell}
          tone={overdueCount > 0 ? 'unavailable' : 'default'}
        />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          <Link to="/staff/rentals" className="text-xs font-medium text-brand-dark hover:underline">
            View all active rentals
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentRentals.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Active and overdue rentals at this station will show up here."
            />
          ) : (
            <div className="divide-y divide-border">
              {recentRentals.map((rental) => {
                const meta = rentalStatusMeta[rental.status];
                return (
                  <div key={rental.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {rental.umbrella?.publicCode ?? 'Umbrella'} · {rental.student?.name ?? 'Student'}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {rental.student?.lpuId} · Rented {formatDateTime(rental.createdAt)}
                      </p>
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
  );
}
