import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Umbrella, IndianRupee, CreditCard, Activity } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { QueryGate } from '@/components/ui/States';
import { useAdminAnalytics } from '@/hooks/useAdminQueries';
import { formatPaise } from '@/utils/money';
import { rentalStatusMeta, umbrellaStatusMeta } from '@/utils/statusMeta';
import type { RentalStatus, UmbrellaStatus } from '@/types';

const PIE_COLORS = ['#8EB176', '#B19976', '#A39B90', '#D8CBB6', '#8F7959', '#7A6E5F'];

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useAdminAnalytics();

  return (
    <div>
      <PageHeader title="Dashboard" description="System-wide statistics across all stations." />

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Active rentals" value={data.currentlyActiveRentals} icon={Umbrella} />
              <StatCard label="Verified payments" value={data.verifiedPaymentsCount} icon={CreditCard} />
              <StatCard label="Total revenue" value={formatPaise(data.totalRevenuePaise)} icon={IndianRupee} />
              <StatCard
                label="Rental records"
                value={Object.values(data.rentalsByStatus).reduce((a, b) => a + (b ?? 0), 0)}
                icon={Activity}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rentals by status</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(data.rentalsByStatus).length === 0 ? (
                    <p className="py-8 text-center text-sm text-text-secondary">No rental data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={Object.entries(data.rentalsByStatus).map(([status, count]) => ({
                          status: rentalStatusMeta[status as RentalStatus]?.label ?? status,
                          count,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#D8CBB6" />
                        <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#7A6E5F' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7A6E5F' }} />
                        <Tooltip
                          contentStyle={{
                            background: '#FDF6EC',
                            border: '1px solid #D8CBB6',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="count" fill="#B19976" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Umbrella fleet by status</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(data.umbrellasByStatus).length === 0 ? (
                    <p className="py-8 text-center text-sm text-text-secondary">No umbrella data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={Object.entries(data.umbrellasByStatus).map(([status, count]) => ({
                            name: umbrellaStatusMeta[status as UmbrellaStatus]?.label ?? status,
                            value: count,
                          }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`}
                        >
                          {Object.keys(data.umbrellasByStatus).map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#FDF6EC',
                            border: '1px solid #D8CBB6',
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </QueryGate>
    </div>
  );
}
