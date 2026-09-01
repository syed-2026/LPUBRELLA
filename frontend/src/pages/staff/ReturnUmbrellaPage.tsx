import { useEffect, useState, type FormEvent } from 'react';
import { Search, CheckCircle2, RotateCw, X, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input, Label } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { InlineError, NoStationState } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import {
  useLookupRentalByUmbrella,
  useGenerateReturnToken,
  useRentalStatusPoll,
} from '@/hooks/useStaffQueries';
import { useCountdown } from '@/hooks/useCountdown';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { rentalStatusMeta } from '@/utils/statusMeta';
import { formatDateTime } from '@/utils/date';
import { formatPaise } from '@/utils/money';
import type { Rental } from '@/types';

type Stage = 'search' | 'confirm' | 'qr' | 'success' | 'expired';

export default function ReturnUmbrellaPage() {
  const [stage, setStage] = useState<Stage>('search');
  console.log('CURRENT STAGE:', stage);
  const [umbrellaCode, setUmbrellaCode] = useState('');
  const [rental, setRental] = useState<Rental | null>(null);

  const lookup = useLookupRentalByUmbrella();
  const generateToken = useGenerateReturnToken();
  const toast = useToast();

  const [tokenValue, setTokenValue] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const remainingSeconds = useCountdown(stage === 'qr' ? expiresAt : null);

  const pollingEnabled = stage === 'qr';
  const { data: polledRental } = useRentalStatusPoll(rental?.id ?? null, pollingEnabled);

  // Transition out of the QR stage in response to the poll or the
  // countdown, as proper effects rather than logic embedded in render.
  useEffect(() => {
    if (stage === 'qr' && polledRental?.status === 'COMPLETED') {
      setStage('success');
      toast.success('Return confirmed — umbrella is now available.');
    }
  }, [stage, polledRental, toast]);



useEffect(() => {
  if (stage !== 'qr' || !expiresAt) return;

  const expiryTime = new Date(expiresAt).getTime();
  const delay = Math.max(0, expiryTime - Date.now());

  const timer = setTimeout(() => {
    setStage('expired');
  }, delay);

  return () => clearTimeout(timer);
}, [stage, expiresAt]);

  function resetAll() {
    setStage('search');
    setUmbrellaCode('');
    setRental(null);
    setTokenValue(null);
    setExpiresAt(null);
    lookup.reset();
    generateToken.reset();
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const code = umbrellaCode.trim().toUpperCase();
    if (!code) return;
    lookup.mutate(code, {
      onSuccess: (found) => {
        setRental(found);
        setStage('confirm');
      },
      onError: (err) => {
        if (err instanceof ApiError && err.code !== 'STAFF_NO_STATION') {
          toast.error(err.message);
        }
      },
    });
  }

  async function handleGenerateQR() {
    if (!rental) return;
    generateToken.mutate(rental.id, {
      onSuccess: (res) => {
        setTokenValue(res.token);
        setExpiresAt(res.expiresAt);
        setStage('qr');
      },
     
      onError: (err) => {
        if (err instanceof ApiError) toast.error(err.message);
      },
    });
  }

  function handleRegenerate() {
    setTokenValue(null);
    setExpiresAt(null);
    setStage('confirm');
  }

  const lookupError =
    lookup.error instanceof ApiError
      ? lookup.error.code === 'STAFF_NO_STATION'
        ? null
        : lookup.error.message
      : null;

  if (lookup.error instanceof ApiError && lookup.error.code === 'STAFF_NO_STATION') {
    return (
      <div>
        <PageHeader title="Return Umbrella" />
        <NoStationState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Return Umbrella"
        description="Search the umbrella the student physically handed back, then generate a Return QR for them to scan."
      />

      <div className="mx-auto max-w-md">
        {stage === 'search' && (
          <Card>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="umbrellaCode">Umbrella ID</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                    <Input
                      id="umbrellaCode"
                      autoFocus
                      placeholder="UMB-0001"
                      value={umbrellaCode}
                      onChange={(e) => setUmbrellaCode(e.target.value)}
                      className="pl-9 uppercase"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary">
                    Enter the ID printed on the umbrella the student just handed you.
                  </p>
                </div>
                {lookupError && <InlineError message={lookupError} />}
                <Button type="submit" className="w-full" isLoading={lookup.isPending}>
                  Find rental
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {stage === 'confirm' && rental && (
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-secondary">Umbrella</p>
                <p className="text-lg font-semibold text-text-primary">{rental.umbrella?.publicCode}</p>
              </div>
              <div className="space-y-2 rounded-lg border border-border bg-surface-secondary/40 p-3 text-sm">
                <DetailRow label="Student" value={`${rental.student?.name ?? '—'} (${rental.student?.lpuId ?? '—'})`} />
                <DetailRow label="Plan" value={rental.pricingPlan?.name ?? '—'} />
                <DetailRow label="Amount paid" value={formatPaise(rental.priceAtRentalPaise)} />
                <DetailRow label="Rented since" value={formatDateTime(rental.startedAt ?? rental.createdAt)} />
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Rental status</span>
                  <StatusBadge
                    label={rentalStatusMeta[rental.status].label}
                    tone={rentalStatusMeta[rental.status].tone}
                  />
                </div>
              </div>

              {generateToken.error instanceof ApiError && (
                <InlineError message={generateToken.error.message} />
              )}

              <div className="flex gap-2">
                <Button variant="secondary" onClick={resetAll} className="flex-1">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleGenerateQR} isLoading={generateToken.isPending} className="flex-1">
                  Generate Return QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'qr' && tokenValue && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-text-secondary">
                Ask the student to scan this QR in the LPU Umbrella app to confirm the return.
              </p>
              <QRCodeDisplay value={tokenValue} size={260} />
              <div className="flex items-center gap-1.5 text-sm font-medium text-brand-dark">
                <Clock className="h-4 w-4" />
                Expires in {remainingSeconds}s
              </div>
              <p className="text-xs text-text-secondary">Waiting for the student to scan…</p>
              <Button variant="ghost" size="sm" onClick={resetAll}>
                <X className="h-4 w-4" /> Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {stage === 'expired' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-surface-secondary p-3 text-text-secondary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-text-primary">QR code expired</p>
                <p className="mt-1 text-sm text-text-secondary">
                  The student didn't scan it in time. Generate a new one to continue.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={resetAll}>
                  Start over
                </Button>
                <Button onClick={handleRegenerate}>
                  <RotateCw className="h-4 w-4" /> New QR code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'success' && rental && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-status-available/15 p-3 text-status-available">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Return completed</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {rental.umbrella?.publicCode} is now available at this station.
                </p>
              </div>
              <Button onClick={resetAll}>Return another umbrella</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}
