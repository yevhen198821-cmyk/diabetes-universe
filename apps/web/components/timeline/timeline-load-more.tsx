'use client';

import { useState } from 'react';

interface TimelineLoadMoreProps {
  readonly addedCount?: number;
  readonly ariaControls: string;
  readonly isLoading?: boolean;
  readonly onLoadMore: () => void;
  readonly remainingCount?: number;
  readonly showRemainingCount?: boolean;
}

export function TimelineLoadMore({
  addedCount = 0,
  ariaControls,
  isLoading = false,
  onLoadMore,
  remainingCount,
  showRemainingCount = true,
}: TimelineLoadMoreProps) {
  const [announcement, setAnnouncement] = useState('');

  const handleClick = () => {
    if (isLoading) {
      return;
    }

    onLoadMore();

    if (addedCount > 0) {
      setAnnouncement(`Показано ещё ${addedCount} событий`);
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-center">
      <button
        aria-busy={isLoading}
        aria-controls={ariaControls}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        disabled={isLoading}
        onClick={handleClick}
        type="button"
      >
        {isLoading ? 'Загрузка…' : 'Показать ещё'}
      </button>
      {showRemainingCount && remainingCount !== undefined ? (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Осталось: {remainingCount}
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
