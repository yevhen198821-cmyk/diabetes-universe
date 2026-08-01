import {
  BarChart3,
  BellRing,
  BookOpen,
  CircleHelp,
  CircleUserRound,
  Clock3,
  Info,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Utensils,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface NavigationItem {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly active?: boolean;
}

const primaryItems: readonly NavigationItem[] = [
  { label: 'Timeline', icon: LayoutDashboard, active: true },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Nutrition', icon: Utensils },
  { label: 'Reminders', icon: BellRing },
  { label: 'Энциклопедия диабета', icon: BookOpen },
  { label: 'Marketplace', icon: ShoppingBag },
  { label: 'Profile', icon: CircleUserRound },
];

const secondaryItems: readonly NavigationItem[] = [
  { label: 'Settings', icon: Settings },
  { label: 'Help', icon: CircleHelp },
  { label: 'About Diabetes Universe', icon: Info },
];

function Navigation({ items }: { readonly items: readonly NavigationItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map(({ active, icon: Icon, label }) => (
        <li key={label}>
          <button
            aria-current={active ? 'page' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
              active
                ? 'bg-teal-500/15 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
            type="button"
          >
            <Icon aria-hidden="true" className="shrink-0" size={19} />
            <span>{label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SidebarContent({ onClose }: { readonly onClose?: () => void }) {
  return (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="grid size-10 place-items-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-900/15">
          <Clock3 aria-hidden="true" size={21} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950 dark:text-white">
            Diabetes Universe
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Пространство здоровья
          </p>
        </div>
        {onClose ? (
          <button
            aria-label="Закрыть меню"
            className="ml-auto grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Основная навигация"
        className="flex flex-1 flex-col overflow-y-auto px-4 py-5"
      >
        <Navigation items={primaryItems} />
        <div className="mt-auto border-t border-slate-200 pt-5 dark:border-slate-800">
          <Navigation items={secondaryItems} />
        </div>
      </nav>
    </>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <SidebarContent />
      </aside>

      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Закрыть меню"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
            type="button"
          />
          <aside
            aria-label="Мобильное меню"
            className="relative flex h-full w-[min(20rem,88vw)] flex-col bg-white shadow-2xl dark:bg-slate-900"
          >
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
