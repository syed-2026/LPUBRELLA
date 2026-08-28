import { useState, type FormEvent } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, InlineError, QueryGate } from '@/components/ui/States';
import { useAdminPricingPlans, useCreatePricingPlan, useUpdatePricingPlan } from '@/hooks/useAdminQueries';
import { useToast } from '@/hooks/useToast';
import { ApiError } from '@/api/client';
import { formatPaise } from '@/utils/money';
import type { PricingPlan } from '@/types';

export default function AdminPricingPage() {
  const { data: plans, isLoading, isError, error, refetch } = useAdminPricingPlans();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PricingPlan | null>(null);

  return (
    <div>
      <PageHeader
        title="Pricing"
        description="Rental plans and pricing."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add plan
          </Button>
        }
      />

      <QueryGate isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {plans && (
          plans.length === 0 ? (
            <EmptyState title="No pricing plans" description="Add a plan to start renting umbrellas." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{plan.name}</p>
                      <p className="text-xs text-text-secondary">
                        {plan.durationMinutes < 60
                          ? `${plan.durationMinutes} min`
                          : `${(plan.durationMinutes / 60).toFixed(plan.durationMinutes % 60 === 0 ? 0 : 1)} hr`}
                      </p>
                    </div>
                    <button onClick={() => setEditing(plan)} className="text-text-secondary hover:text-text-primary">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-brand-dark">{formatPaise(plan.pricePaise)}</p>
                  <p className={`mt-1 text-xs ${plan.active ? 'text-status-available' : 'text-text-secondary'}`}>
                    {plan.active ? 'Active' : 'Inactive'}
                  </p>
                </Card>
              ))}
            </div>
          )
        )}
      </QueryGate>

      <CreatePlanModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditPlanModal plan={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function CreatePlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const createPlan = useCreatePricingPlan();
  const toast = useToast();

  function handleClose() {
    setName('');
    setDurationMinutes('');
    setPriceRupees('');
    createPlan.reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createPlan.mutate(
      {
        name: name.trim(),
        durationMinutes: Number(durationMinutes),
        pricePaise: Math.round(Number(priceRupees) * 100),
        active: true,
      },
      { onSuccess: () => { toast.success('Pricing plan created.'); handleClose(); } }
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add pricing plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="planName">Plan name</Label>
          <Input id="planName" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="planDuration">Duration (minutes)</Label>
          <Input id="planDuration" type="number" min={1} required value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="planPrice">Price (₹)</Label>
          <Input id="planPrice" type="number" min={0} step="0.01" required value={priceRupees} onChange={(e) => setPriceRupees(e.target.value)} />
        </div>

        {createPlan.error instanceof ApiError && <InlineError message={createPlan.error.message} />}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={createPlan.isPending}>Create plan</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditPlanModal({ plan, onClose }: { plan: PricingPlan | null; onClose: () => void }) {
  const updatePlan = useUpdatePricingPlan();
  const toast = useToast();
  const [priceRupees, setPriceRupees] = useState('');
  const [active, setActive] = useState(true);
  const [lastId, setLastId] = useState<string | null>(null);

  if (plan && plan.id !== lastId) {
    setLastId(plan.id);
    setPriceRupees((plan.pricePaise / 100).toString());
    setActive(plan.active);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!plan) return;
    updatePlan.mutate(
      { id: plan.id, payload: { pricePaise: Math.round(Number(priceRupees) * 100), active } },
      { onSuccess: () => { toast.success('Pricing plan updated.'); onClose(); } }
    );
  }

  return (
    <Modal open={!!plan} onClose={onClose} title={plan?.name}>
      {plan && (
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="editPlanPrice">Price (₹)</Label>
              <Input id="editPlanPrice" type="number" min={0} step="0.01" required value={priceRupees} onChange={(e) => setPriceRupees(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-border" />
              Plan is active (visible to students)
            </label>

            {updatePlan.error instanceof ApiError && <InlineError message={updatePlan.error.message} />}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" isLoading={updatePlan.isPending}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      )}
    </Modal>
  );
}
