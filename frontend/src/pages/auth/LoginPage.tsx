import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Umbrella, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Field';
import { InlineError } from '@/components/ui/States';
import { ApiError } from '@/api/client';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated && user) {
    if (user.role === 'STUDENT') {
      // This portal is staff/admin only; a student account should never
      // reach here, but guard against it defensively.
      return (
        <Navigate
          to="/login"
          replace
          state={{ error: 'This portal is for staff and admin accounts only.' }}
        />
      );
    }
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    const home = user.role === 'ADMIN' ? '/admin' : '/staff';
    return <Navigate to={from || home} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'STUDENT') {
        setError('This portal is for staff and admin accounts only.');
        return;
      }
      navigate(loggedInUser.role === 'ADMIN' ? '/admin' : '/staff', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-subtle">
            <Umbrella className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">LPU Umbrella</h1>
          <p className="mt-1 text-sm text-text-secondary">Staff & Admin Portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-border bg-surface p-6 shadow-subtle"
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@lpu.test"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <InlineError message={error} />}

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Log in
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-text-secondary">
          This portal is for LPU Umbrella staff and administrators only.
        </p>
      </div>
    </div>
  );
}
