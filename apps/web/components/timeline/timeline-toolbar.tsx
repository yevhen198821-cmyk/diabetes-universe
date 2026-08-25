import type {
  TimelineEventFilter,
  TimelineSearchFilterModel,
} from './timeline-search-filter-model';
import type { TimelineDateFilterSelection } from './timeline-date-filter-model';
import type { TimelineUiLabels } from './timeline-ui-labels';
import { formatTimelineToolbarResultLabel } from './timeline-ui-labels';
import { TimelineDateFilterControl } from './timeline-date-filter-control';
import { TimelineFilters } from './timeline-filters';
import { TimelineSearch } from './timeline-search';
import { frostedPanelClassName } from '../shared/app-page-background';

interface TimelineToolbarProps {
  readonly dateFilter: TimelineDateFilterSelection;
  readonly dateFilterLabel: string;
  readonly filterLabels: Readonly<Record<TimelineEventFilter, string>>;
  readonly formatCount: (count: number) => string;
  readonly labels: TimelineUiLabels;
  readonly model: TimelineSearchFilterModel;
  readonly onDateFilterChange: (selection: TimelineDateFilterSelection) => void;
  readonly onFilterChange: (filter: TimelineEventFilter) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onReset: () => void;
  readonly query: string;
}

export function TimelineToolbar({
  dateFilter,
  dateFilterLabel,
  filterLabels,
  formatCount,
  labels,
  model,
  onDateFilterChange,
  onFilterChange,
  onQueryChange,
  onReset,
  query,
}: TimelineToolbarProps) {
  const resultLabel = formatTimelineToolbarResultLabel(
    labels.toolbar,
    model,
    formatCount,
  );

  return (
    <section
      aria-labelledby="timeline-toolbar-title"
      className={`relative overflow-hidden ${frostedPanelClassName} space-y-3 p-4 sm:p-5`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(167,139,250,0.12),transparent_34%),radial-gradient(circle_at_88%_22%,rgba(251,146,60,0.12),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(45,212,191,0.10),transparent_40%)]"
      />
      <h2 className="sr-only" id="timeline-toolbar-title">
        {labels.toolbar.title}
      </h2>
      <div className="relative space-y-3">
        <TimelineSearch
          labels={labels.search}
          onChange={onQueryChange}
          query={query}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TimelineDateFilterControl
            activeLabel={dateFilterLabel}
            ariaLabel={labels.dateFilter.ariaLabel}
            labels={labels.dateFilter}
            onChange={onDateFilterChange}
            selection={dateFilter}
          />
          <p
            aria-live="polite"
            className="text-text-secondary text-sm sm:text-right"
          >
            {resultLabel}
          </p>
        </div>
        <TimelineFilters
          activeFilter={model.activeFilter}
          ariaLabel={labels.filters.ariaLabel}
          filterLabels={filterLabels}
          onChange={onFilterChange}
        />
        {model.hasActiveSearchOrCategoryCriteria ? (
          <div className="flex justify-start">
            <button
              className="focus-visible:outline-interactive-primary min-h-11 rounded-xl border border-white/80 bg-white/70 px-4 text-sm font-semibold text-[#1e3a5f] shadow-sm backdrop-blur transition hover:border-teal-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:hover:border-teal-800"
              onClick={onReset}
              type="button"
            >
              {labels.toolbar.reset}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
