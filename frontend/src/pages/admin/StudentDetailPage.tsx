// import { useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { ArrowLeft } from 'lucide-react';
// import { PageHeader } from '@/components/layout/PageHeader';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
// import { StatusBadge } from '@/components/ui/StatusBadge';
// import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
// import { Pagination } from '@/components/ui/Pagination';
// import { useAdminUsers, useAdminRentals } from '@/hooks/useAdminQueries';
// import { userStatusMeta, rentalStatusMeta, paymentStatusMeta } from '@/utils/statusMeta';
// import { formatDateTime } from '@/utils/date';
// import { formatPaise } from '@/utils/money';

// const RENTALS_LIMIT = 10;

// export default function AdminStudentDetailPage() {
//   const { id } = useParams<{ id: string }>();
//   const [page, setPage] = useState(1);

//   // The backend has no GET /admin/users/:id - only a filtered list. We
//   // fetch a generously-sized STUDENT page and find the match client-side.
//   // See README "Known limitations" for the suggested backend addition.
//   const {
//     data: usersData,
//     isLoading: usersLoading,
//     isError: usersIsError,
//     error: usersError,
//     refetch: refetchUsers,
//   } = useAdminUsers({ page: 1, limit: 100, role: 'STUDENT' });
//   const student = usersData?.users.find((u) => u.id === id);

//   const {
//     data: rentalsData,
//     isLoading: rentalsLoading,
//     isError: rentalsIsError,
//     error: rentalsError,
//     refetch: refetchRentals,
//   } = useAdminRentals({ page, limit: RENTALS_LIMIT, studentId: id });

//   if (usersLoading) return <LoadingState label="Loading student…" />;
//   if (usersIsError) return <ErrorState error={usersError} onRetry={refetchUsers} />;

//   return (
//     <div>
//       <Link to="/admin/students" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
//         <ArrowLeft className="h-4 w-4" /> Back to students
//       </Link>

//       {!student ? (
//         <EmptyState title="Student not found" description="This student may have been removed or the link is out of date." />
//       ) : (
//         <>
//           <PageHeader
//             title={student.name}
//             description={`${student.lpuId} · ${student.email}`}
//             action={<StatusBadge label={userStatusMeta[student.status].label} tone={userStatusMeta[student.status].tone} />}
//           />

//           <Card className="mb-6">
//             <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
//               <InfoItem label="Phone" value={student.phone ?? '—'} />
//               <InfoItem label="LPU ID" value={student.lpuId} />
//               <InfoItem label="Joined" value={formatDateTime(student.createdAt)} />
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Rental & payment history</CardTitle>
//             </CardHeader>
//             <CardContent className="p-0">
//               {rentalsLoading ? (
//                 <LoadingState />
//               ) : rentalsIsError ? (
//                 <ErrorState error={rentalsError} onRetry={refetchRentals} />
//               ) : !rentalsData || rentalsData.rentals.length === 0 ? (
//                 <EmptyState title="No rentals yet" description="This student hasn't rented an umbrella." />
//               ) : (
//                 <>
//                   <table className="w-full text-sm">
//                     <thead>
//                       <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
//                         <th className="px-5 py-3 font-medium">Umbrella</th>
//                         <th className="px-5 py-3 font-medium">Rental status</th>
//                         <th className="px-5 py-3 font-medium">Payment</th>
//                         <th className="px-5 py-3 font-medium">Amount</th>
//                         <th className="px-5 py-3 font-medium">Date</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-border">
//                       {rentalsData.rentals.map((rental) => {
//                         const rMeta = rentalStatusMeta[rental.status];
//                         const pMeta = rental.payment ? paymentStatusMeta[rental.payment.status] : null;
//                         return (
//                           <tr key={rental.id}>
//                             <td className="px-5 py-3 font-medium text-text-primary">{rental.umbrella?.publicCode}</td>
//                             <td className="px-5 py-3"><StatusBadge label={rMeta.label} tone={rMeta.tone} /></td>
//                             <td className="px-5 py-3">
//                               {pMeta ? <StatusBadge label={pMeta.label} tone={pMeta.tone} /> : <span className="text-text-secondary">—</span>}
//                             </td>
//                             <td className="px-5 py-3 text-text-secondary">{formatPaise(rental.priceAtRentalPaise)}</td>
//                             <td className="px-5 py-3 text-text-secondary">{formatDateTime(rental.createdAt)}</td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                   <div className="px-5 pb-4">
//                     <Pagination page={rentalsData.page} limit={rentalsData.limit} total={rentalsData.total} onPageChange={setPage} />
//                   </div>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//         </>
//       )}
//     </div>
//   );
// }

// function InfoItem({ label, value }: { label: string; value: string }) {
//   return (
//     <div>
//       <p className="text-xs text-text-secondary">{label}</p>
//       <p className="mt-0.5 text-sm font-medium text-text-primary">{value}</p>
//     </div>
//   );
// }


import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Power } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState, InlineError, QueryGate } from '@/components/ui/States';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import {
  useAdminUsers,
  useUpdateUser,
} from '@/hooks/useAdminQueries';

import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';

import { userStatusMeta } from '@/utils/statusMeta';

import type { User } from '@/types';

const LIMIT = 20;

export default function AdminStudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Student selected for activation/deactivation confirmation
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsers({
    page,
    limit: LIMIT,
    role: 'STUDENT',
  });

  const updateUser = useUpdateUser();
  const toast = useToast();

  // ------------------------------------------------------------
  // Search current page
  // ------------------------------------------------------------

  const visible =
    data?.users.filter((u) => {
      const term = debouncedSearch.trim().toLowerCase();

      if (!term) return true;

      return (
        u.name.toLowerCase().includes(term) ||
        u.lpuId.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }) ?? [];

  // ------------------------------------------------------------
  // Open confirmation modal
  // ------------------------------------------------------------

  function handleStatusClick(student: User) {
    setSelectedStudent(student);
    updateUser.reset();
  }

  // ------------------------------------------------------------
  // Close confirmation modal
  // ------------------------------------------------------------

  function handleCloseModal() {
    if (updateUser.isPending) return;

    setSelectedStudent(null);
    updateUser.reset();
  }

  // ------------------------------------------------------------
  // Activate / deactivate student
  // ------------------------------------------------------------

  function handleStatusChange() {
    if (!selectedStudent) return;

    const newStatus =
      selectedStudent.status === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';

    updateUser.mutate(
      {
        id: selectedStudent.id,
        payload: {
          status: newStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            newStatus === 'INACTIVE'
              ? 'Student deactivated.'
              : 'Student activated.'
          );

          setSelectedStudent(null);
          updateUser.reset();

          // Reload the student list so the status badge updates.
          refetch();
        },
      }
    );
  }

  return (
    <div>
      <PageHeader
        title="Students"
        description="Student directory."
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

        <Input
          placeholder="Search this page by name, LPU ID, or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Students */}
      <QueryGate
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
      >
        {data && (
          <>
            {visible.length === 0 ? (
              <EmptyState
                title="No students found"
                description="Try a different search."
              />
            ) : (
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-secondary/50 text-left text-xs uppercase tracking-wide text-text-secondary">
                      <th className="px-4 py-3 font-medium">
                        Name
                      </th>

                      <th className="px-4 py-3 font-medium">
                        LPU ID
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Email
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Status
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {visible.map((student) => {
                      const meta =
                        userStatusMeta[student.status];

                      const isActive =
                        student.status === 'ACTIVE';

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-surface-secondary/40"
                        >
                          {/* Name */}
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/students/${student.id}`}
                              className="font-medium text-text-primary hover:underline"
                            >
                              {student.name}
                            </Link>
                          </td>

                          {/* LPU ID */}
                          <td className="px-4 py-3 text-text-secondary">
                            {student.lpuId}
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3 text-text-secondary">
                            {student.email}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <StatusBadge
                              label={meta.label}
                              tone={meta.tone}
                            />
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleStatusClick(student)
                              }
                            >
                              <Power className="h-3.5 w-3.5" />

                              {isActive
                                ? 'Deactivate'
                                : 'Activate'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            )}

            <Pagination
              page={data.page}
              limit={data.limit}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </QueryGate>

      {/* Confirmation Modal */}
      <Modal
        open={!!selectedStudent}
        onClose={handleCloseModal}
        title={
          selectedStudent?.status === 'ACTIVE'
            ? 'Deactivate student'
            : 'Activate student'
        }
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-secondary/40 p-4">
              <p className="font-medium text-text-primary">
                {selectedStudent.name}
              </p>

              <p className="mt-1 text-sm text-text-secondary">
                {selectedStudent.lpuId}
              </p>

              <p className="text-sm text-text-secondary">
                {selectedStudent.email}
              </p>
            </div>

            <p className="text-sm text-text-secondary">
              {selectedStudent.status === 'ACTIVE'
                ? 'Are you sure you want to deactivate this student? They will no longer be able to use the system.'
                : 'Do you want to reactivate this student? They will be able to use the system again.'}
            </p>

            {updateUser.error instanceof ApiError && (
              <InlineError
                message={updateUser.error.message}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={updateUser.isPending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleStatusChange}
                isLoading={updateUser.isPending}
              >
                {selectedStudent.status === 'ACTIVE'
                  ? 'Deactivate'
                  : 'Activate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}