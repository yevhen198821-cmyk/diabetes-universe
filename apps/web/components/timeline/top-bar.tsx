import { Bell, Menu, Search } from 'lucide-react';

import { ThemeToggle } from './theme-toggle';

interface TopBarProps {
  readonly isDark: boolean;
  readonly onMenuOpen: () => void;
  readonly onThemeToggle: () => void;
}

const currentDate = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

export function TopBar({ isDark, onMenuOpen, onThemeToggle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3">
        <button
          aria-label="Открыть меню"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          onClick={onMenuOpen}
          type="button"
        >
          <Menu aria-hidden="true" size={20} />
        </button>

        <div className="min-w-0 shrink-0">
          <h1 className="truncate text-lg font-bold text-slate-950 sm:text-xl dark:text-white">
            Timeline
          </h1>
          <p className="hidden text-xs text-slate-500 capitalize sm:block dark:text-slate-400">
            {currentDate}
          </p>
        </div>

        <label className="relative ml-auto hidden w-full max-w-sm sm:block">
          <span className="sr-only">Поиск по Timeline</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Поиск событий"
            type="search"
          />
        </label>

        <button
          aria-label="Поиск"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          type="button"
        >
          <Search aria-hidden="true" size={18} />
        </button>

        <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />

        <button
          aria-label="Уведомления"
          className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          type="button"
        >
          <Bell aria-hidden="true" size={18} />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        <button
          aria-label="Открыть профиль"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-700 text-sm font-bold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          type="button"
        >
          DU
        </button>
      </div>
    </header>
  );
}
