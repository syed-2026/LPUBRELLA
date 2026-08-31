import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { InlineError, StaffQueryGate } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useStaffInventory, useReportDamage, useReportMissing } from '@/hooks/useStaffQueries';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { umbrellaStatusMeta } from '@/utils/statusMeta';
import type { DamageSeverity, Umbrella } from '@/types';

type IssueType = 'DAMAGE' | 'MISSING';

export default function DamageReportPage() {
  const { data, isLoading, isError, error, refetch } = useStaffInventory();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [selected, setSelected] = useState<Umbrella | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data.umbrellas.slice(0, 8);
    return data.umbrellas.filter((u) => u.publicCode.toLowerCase().includes(term));
  }, [data, debouncedSearch]);

  return (
    <div>
      <PageHeader title="Report Issue" description="Report a damaged or missing umbrella." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Label htmlFor="issue-search">Find umbrella</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              id="issue-search"
              placeholder="Search umbrella ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <StaffQueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="mt-3 max-h-96 space-y-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-secondary">No umbrellas found.</p>
              ) : (
                filtered.map((u) => {
                  const meta = umbrellaStatusMeta[u.status];
                  const isSelected = selected?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'border-brand bg-brand/10'
                          : 'border-border bg-surface hover:bg-surface-secondary/40'
                      }`}
                    >
                      <span className="font-medium text-text-primary">{u.publicCode}</span>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </button>
                  );
                })
              )}
            </div>
          </StaffQueryGate>
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <IssueForm umbrella={selected} onDone={() => setSelected(null)} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-text-secondary">
                <AlertTriangle className="h-6 w-6" />
                <p className="text-sm">Select an umbrella to report an issue.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueForm({ umbrella, onDone }: { umbrella: Umbrella; onDone: () => void }) {
  const [issueType, setIssueType] = useState<IssueType>('DAMAGE');
  const [severity, setSeverity] = useState<DamageSeverity>('MINOR');
  const [description, setDescription] = useState('');

  const reportDamage = useReportDamage();
  const reportMissing = useReportMissing();
  const toast = useToast();

  const isSubmitting = reportDamage.isPending || reportMissing.isPending;
  const submitError =
    reportDamage.error instanceof ApiError
      ? reportDamage.error.message
      : reportMissing.error instanceof ApiError
        ? reportMissing.error.message
        : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (issueType === 'DAMAGE') {
      if (description.trim().length < 3) return;
      reportDamage.mutate(
        { umbrellaId: umbrella.id, severity, description: description.trim() },
        {
          onSuccess: () => {
            toast.success(`Damage report filed for ${umbrella.publicCode}.`);
            setDescription('');
            onDone();
          },
        }
      );
    } else {
      reportMissing.mutate(
        { umbrellaId: umbrella.id, description: description.trim() || undefined },
        {
          onSuccess: () => {
            toast.success(`${umbrella.publicCode} marked as missing.`);
            setDescription('');
            onDone();
          },
        }
      );
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-text-secondary">Reporting for</p>
          <p className="text-lg font-semibold text-text-primary">{umbrella.publicCode}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="issueType">Issue type</Label>
            <Select id="issueType" value={issueType} onChange={(e) => setIssueType(e.target.value as IssueType)}>
              <option value="DAMAGE">Damage (needs maintenance)</option>
              <option value="MISSING">Missing</option>
            </Select>
          </div>

          {issueType === 'DAMAGE' && (
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select id="severity" value={severity} onChange={(e) => setSeverity(e.target.value as DamageSeverity)}>
                <option value="MINOR">Minor</option>
                <option value="MAJOR">Major</option>
                <option value="UNUSABLE">Unusable</option>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">
              Description {issueType === 'MISSING' && <span className="text-text-secondary">(optional)</span>}
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required={issueType === 'DAMAGE'}
              minLength={issueType === 'DAMAGE' ? 3 : undefined}
              rows={4}
              placeholder={
                issueType === 'DAMAGE'
                  ? 'Describe the damage (e.g. broken rib, torn canopy)…'
                  : 'Any additional details…'
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus-ring"
            />
          </div>

          {submitError && <InlineError message={submitError} />}

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {issueType === 'DAMAGE' ? 'Submit damage report' : 'Mark as missing'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
