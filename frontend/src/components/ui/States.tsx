import { AlertTriangle, Inbox, Loader2, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { ApiError } from '@/api/client';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-text-secondary">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-surface-secondary p-3 text-text-secondary">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const isNetwork = error instanceof ApiError && error.code === 'NETWORK_ERROR';
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-red-50 p-3 text-red-500">
        {isNetwork ? <WifiOff className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
      </div>
      <div>
        <p className="font-medium text-text-primary">{isNetwork ? 'Connection problem' : 'Something went wrong'}</p>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/** Renders the right state (error / children) for a generic query result. */
export function QueryGate({
  isLoading,
  isError,
  error,
  onRetry,
  loadingLabel,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  loadingLabel?: string;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingState label={loadingLabel} />;
  if (isError) return <ErrorState error={error} onRetry={onRetry} />;
  return <>{children}</>;
}
export function NoStationState() {
  return (
    <EmptyState
      icon={<WifiOff className="h-6 w-6" />}
      title="No station assigned"
      description="You haven't been assigned to a station yet. Contact an administrator to get set up."
    />
  );
}

/** Renders the right state (no-station / error / children) for a staff query result. */
export function StaffQueryGate({
  isLoading,
  isError,
  error,
  onRetry,
  loadingLabel,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  loadingLabel?: string;
  children: ReactNode;
}) {
  if (isLoading) return <LoadingState label={loadingLabel} />;
  if (isError) {
    if (error instanceof ApiError && error.code === 'STAFF_NO_STATION') {
      return <NoStationState />;
    }
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  return <>{children}</>;
}
