'use client';

import { useState } from 'react';

import type { TimelineUiLabels } from './timeline-ui-labels';
import { formatTimelineLoadMoreAnnouncement } from './timeline-ui-labels';

interface TimelineLoadMoreProps {
  readonly addedCount?: number;
  readonly ariaControls: string;
  readonly formatCount: (count: number) => string;
  readonly isLoading?: boolean;
  readonly labels: TimelineUiLabels['loadMore'];
  readonly onLoadMore: () => void;
  readonly remainingCount?: number;
  readonly showRemainingCount?: boolean;
}

export function TimelineLoadMore({
  addedCount = 0,
  ariaControls,
  formatCount,
  isLoading = false,
  labels,
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
      setAnnouncement(
        formatTimelineLoadMoreAnnouncement(
          labels.announced,
          addedCount,
          formatCount,
        ),
      );
    }
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-center">
      <button
        aria-busy={isLoading}
        aria-controls={ariaControls}
        className="focus-visible:outline-interactive-primary min-h-11 w-full rounded-xl border border-white/80 bg-white/75 px-5 py-3 text-sm font-semibold text-[#1e3a5f] shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur transition hover:border-teal-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-white/10 dark:bg-slate-900/75 dark:text-white dark:hover:border-teal-800"
        disabled={isLoading}
        onClick={handleClick}
        type="button"
      >
        {isLoading ? labels.loading : labels.button}
      </button>
      {showRemainingCount && remainingCount !== undefined ? (
        <p className="text-text-secondary text-center text-xs">
          {labels.remaining.replace('{count}', formatCount(remainingCount))}
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
