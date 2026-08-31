import { NavLink } from 'react-router-dom';
import { Umbrella } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { staffNav, adminNav } from './navItems';

export function Sidebar() {
  const { user } = useAuth();
  const items = user?.role === 'ADMIN' ? adminNav : staffNav;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <Umbrella className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-text-primary">LPU Umbrella</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {user?.role === 'ADMIN' ? 'Admin Portal' : 'Staff Portal'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand/15 text-brand-dark'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
