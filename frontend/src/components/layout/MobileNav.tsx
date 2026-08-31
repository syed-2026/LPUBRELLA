import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { staffNav, adminNav } from './navItems';

export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useAuth();
  const items = user?.role === 'ADMIN' ? adminNav : staffNav;

  return (
    <nav className="space-y-0.5 px-3 pb-4">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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
  );
}
