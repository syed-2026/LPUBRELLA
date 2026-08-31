import { cn } from '@/lib/cn';
import { toneClasses, type StatusTone } from '@/utils/statusMeta';

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone]
      )}
    >
      {label}
    </span>
  );
}
