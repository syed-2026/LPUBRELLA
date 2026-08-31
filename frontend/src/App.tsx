import { Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute, RoleRoute } from '@/routes/guards';
import { RoleHomeRedirect } from '@/routes/RoleHomeRedirect';
import LoginPage from '@/pages/auth/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { LoadingState } from '@/components/ui/States';

// Route-level code splitting: each page loads only when its route is
// visited, so e.g. a STAFF user never downloads the admin dashboard's
// Recharts-heavy bundle, and vice versa.

// Staff pages
const StaffDashboardPage = lazy(() => import('@/pages/staff/DashboardPage'));
const InventoryPage = lazy(() => import('@/pages/staff/InventoryPage'));
const ActiveRentalsPage = lazy(() => import('@/pages/staff/ActiveRentalsPage'));
const ReturnUmbrellaPage = lazy(() => import('@/pages/staff/ReturnUmbrellaPage'));
const DamageReportPage = lazy(() => import('@/pages/staff/DamageReportPage'));
const RentalHistoryPage = lazy(() => import('@/pages/staff/RentalHistoryPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminStationsPage = lazy(() => import('@/pages/admin/StationsPage'));
const AdminStationDetailPage = lazy(() => import('@/pages/admin/StationDetailPage'));
const AdminUmbrellasPage = lazy(() => import('@/pages/admin/UmbrellasPage'));
const AdminRentalsPage = lazy(() => import('@/pages/admin/RentalsPage'));
const AdminStudentsPage = lazy(() => import('@/pages/admin/StudentsPage'));
const AdminStudentDetailPage = lazy(() => import('@/pages/admin/StudentDetailPage'));
const AdminStaffPage = lazy(() => import('@/pages/admin/StaffPage'));
const AdminPaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage'));
const AdminIssuesPage = lazy(() => import('@/pages/admin/IssuesPage'));
const AdminRebalancingPage = lazy(() => import('@/pages/admin/RebalancingPage'));
const AdminPricingPage = lazy(() => import('@/pages/admin/PricingPage'));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));

export default function App() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* STAFF */}
            <Route element={<RoleRoute allow={['STAFF']} />}>
              <Route path="/staff" element={<StaffDashboardPage />} />
              <Route path="/staff/inventory" element={<InventoryPage />} />
              <Route path="/staff/rentals" element={<ActiveRentalsPage />} />
              <Route path="/staff/returns" element={<ReturnUmbrellaPage />} />
              <Route path="/staff/damage" element={<DamageReportPage />} />
              <Route path="/staff/history" element={<RentalHistoryPage />} />
            </Route>

            {/* ADMIN */}
            <Route element={<RoleRoute allow={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/stations" element={<AdminStationsPage />} />
              <Route path="/admin/stations/:id" element={<AdminStationDetailPage />} />
              <Route path="/admin/umbrellas" element={<AdminUmbrellasPage />} />
              <Route path="/admin/rentals" element={<AdminRentalsPage />} />
              <Route path="/admin/students" element={<AdminStudentsPage />} />
              <Route path="/admin/students/:id" element={<AdminStudentDetailPage />} />
              <Route path="/admin/staff" element={<AdminStaffPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/admin/issues" element={<AdminIssuesPage />} />
              <Route path="/admin/rebalancing" element={<AdminRebalancingPage />} />
              <Route path="/admin/pricing" element={<AdminPricingPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            <Route path="/" element={<RoleHomeRedirect />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
