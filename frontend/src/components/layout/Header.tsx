import { useState } from 'react';
import { LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MobileNav } from './MobileNav';

export function Header() {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
        <button
          className="rounded-md p-2 text-text-secondary hover:bg-surface-secondary focus-ring md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:block">
          {user?.assignedStationId === null && user?.role === 'STAFF' && (
            <p className="text-sm text-status-unavailable">No station assigned — contact an admin.</p>
          )}
        </div>

        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-secondary focus-ring"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-text-secondary">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none text-text-primary">{user?.name}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{user?.role}</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-border bg-surface p-1 shadow-elevated">
                <div className="px-3 py-2 text-xs text-text-secondary">
                  <p className="truncate font-medium text-text-primary">{user?.email}</p>
                  <p className="mt-0.5">{user?.lpuId}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-secondary"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-text-primary/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface shadow-elevated">
            <div className="flex items-center justify-end p-3">
              <button
                className="rounded-md p-2 text-text-secondary hover:bg-surface-secondary"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <MobileNav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
