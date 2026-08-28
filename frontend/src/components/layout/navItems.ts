import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Package,
  Umbrella,
  RotateCcw,
  AlertTriangle,
  History,
  MapPin,
  Users,
  UserCog,
  Receipt,
  ArrowLeftRight,
  Tag,
  ScrollText,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

export const staffNav: NavItem[] = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/inventory', label: 'Inventory', icon: Package },
  { to: '/staff/rentals', label: 'Active Rentals', icon: Umbrella },
  { to: '/staff/returns', label: 'Return Umbrella', icon: RotateCcw },
  { to: '/staff/damage', label: 'Report Issue', icon: AlertTriangle },
  { to: '/staff/history', label: 'Rental History', icon: History },
];

export const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/stations', label: 'Stations', icon: MapPin },
  { to: '/admin/umbrellas', label: 'Umbrellas', icon: Umbrella },
  { to: '/admin/rentals', label: 'Rentals', icon: History },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/staff', label: 'Staff', icon: UserCog },
  { to: '/admin/payments', label: 'Payments', icon: Receipt },
  { to: '/admin/issues', label: 'Damage & Issues', icon: AlertTriangle },
  { to: '/admin/rebalancing', label: 'Rebalancing', icon: ArrowLeftRight },
  { to: '/admin/pricing', label: 'Pricing', icon: Tag },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];
