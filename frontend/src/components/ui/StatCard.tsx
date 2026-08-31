import type { ComponentType } from 'react';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
  tone?: 'default' | 'available' | 'unavailable';
  hint?: string;
}

const toneText: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'text-text-primary',
  available: 'text-status-available',
  unavailable: 'text-status-unavailable',
};

export function StatCard({ label, value, icon: Icon, tone = 'default', hint }: StatCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-subtle">
      <div className="flex items-start justify-between">
        <p className="text-sm text-text-secondary">{label}</p>
        {Icon && (
          <div className="rounded-md bg-surface-secondary p-1.5 text-text-secondary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold', toneText[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}
