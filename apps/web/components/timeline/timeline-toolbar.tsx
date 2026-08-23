import type {
  TimelineEventFilter,
  TimelineSearchFilterModel,
} from './timeline-search-filter-model';
import type { TimelineUiLabels } from './timeline-ui-labels';
import { formatTimelineToolbarResultLabel } from './timeline-ui-labels';
import { TimelineFilters } from './timeline-filters';
import { TimelineSearch } from './timeline-search';

interface TimelineToolbarProps {
  readonly filterLabels: Readonly<Record<TimelineEventFilter, string>>;
  readonly formatCount: (count: number) => string;
  readonly labels: TimelineUiLabels;
  readonly model: TimelineSearchFilterModel;
  readonly onFilterChange: (filter: TimelineEventFilter) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onReset: () => void;
  readonly query: string;
}

export function TimelineToolbar({
  filterLabels,
  formatCount,
  labels,
  model,
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
      className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="sr-only" id="timeline-toolbar-title">
        {labels.toolbar.title}
      </h2>
      <TimelineSearch
        labels={labels.search}
        onChange={onQueryChange}
        query={query}
      />
      <TimelineFilters
        activeFilter={model.activeFilter}
        ariaLabel={labels.filters.ariaLabel}
        filterLabels={filterLabels}
        onChange={onFilterChange}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-sm text-slate-500">
          {resultLabel}
        </p>
        {model.hasActiveCriteria ? (
          <button
            className="min-h-11 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:self-auto"
            onClick={onReset}
            type="button"
          >
            {labels.toolbar.reset}
          </button>
        ) : null}
      </div>
    </section>
  );
}
