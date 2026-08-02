import type { TimelineEventFilter } from './timeline-search-filter-model';
import {
  timelineEventFilterLabels,
  timelineEventFilterOptions,
} from './timeline-search-filter-model';

interface TimelineFiltersProps {
  readonly activeFilter: TimelineEventFilter;
  readonly onChange: (filter: TimelineEventFilter) => void;
}

export function TimelineFilters({
  activeFilter,
  onChange,
}: TimelineFiltersProps) {
  return (
    <div
      aria-label="Фильтр событий"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      role="group"
    >
      <div className="flex min-w-max gap-2 py-1">
        {timelineEventFilterOptions.map((filter) => {
          const selected = activeFilter === filter;

          return (
            <button
              aria-pressed={selected}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                selected
                  ? 'border-teal-700 bg-teal-700 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
              key={filter}
              onClick={() => onChange(filter)}
              type="button"
            >
              {timelineEventFilterLabels[filter]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
