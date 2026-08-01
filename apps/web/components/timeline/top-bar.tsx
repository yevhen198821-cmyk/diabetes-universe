import { Bell, Search } from 'lucide-react';

import { iconButton } from './ui-styles';

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-700 text-sm font-bold text-white"
        >
          DU
        </div>

        <h1 className="text-lg font-bold text-slate-950 sm:text-xl">
          Timeline
        </h1>

        <label className="relative ml-auto hidden w-full max-w-sm sm:block">
          <span className="sr-only">Поиск</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-10 text-sm text-slate-900 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
            placeholder="Поиск событий"
            type="search"
          />
        </label>

        <button
          aria-label="Поиск"
          className={`${iconButton} ml-auto sm:hidden`}
          type="button"
        >
          <Search aria-hidden="true" size={18} />
        </button>

        <button
          aria-label="Уведомления"
          className={`${iconButton} relative`}
          type="button"
        >
          <Bell aria-hidden="true" size={18} />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <button
          aria-label="Профиль"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          type="button"
        >
          DU
        </button>
      </div>
    </header>
  );
}
