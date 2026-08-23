import {
  filterChipDefaultClass,
  filterChipSelectedClass,
} from '@diabetes-universe/ui';
import type { TimelineEventFilter } from './timeline-search-filter-model';
import { timelineEventFilterOptions } from './timeline-search-filter-model';

interface TimelineFiltersProps {
  readonly activeFilter: TimelineEventFilter;
  readonly ariaLabel: string;
  readonly filterLabels: Readonly<Record<TimelineEventFilter, string>>;
  readonly onChange: (filter: TimelineEventFilter) => void;
}

export function TimelineFilters({
  activeFilter,
  ariaLabel,
  filterLabels,
  onChange,
}: TimelineFiltersProps) {
  return (
    <div
      aria-label={ariaLabel}
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      role="group"
    >
      <div className="flex min-w-max gap-2 py-1">
        {timelineEventFilterOptions.map((filter) => {
          const selected = activeFilter === filter;

          return (
            <button
              aria-pressed={selected}
              className={`focus-visible:outline-interactive-primary min-h-11 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                selected ? filterChipSelectedClass : filterChipDefaultClass
              }`}
              key={filter}
              onClick={() => onChange(filter)}
              type="button"
            >
              {filterLabels[filter]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
