'use client';

import { useState } from 'react';

interface TimelineLoadMoreProps {
  readonly addedCount: number;
  readonly ariaControls: string;
  readonly onLoadMore: () => void;
  readonly remainingCount: number;
}

export function TimelineLoadMore({
  addedCount,
  ariaControls,
  onLoadMore,
  remainingCount,
}: TimelineLoadMoreProps) {
  const [announcement, setAnnouncement] = useState('');

  const handleClick = () => {
    onLoadMore();
    setAnnouncement(`Показано ещё ${addedCount} событий`);
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-center">
      <button
        aria-controls={ariaControls}
        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        onClick={handleClick}
        type="button"
      >
        Показать ещё
      </button>
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Осталось: {remainingCount}
      </p>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
