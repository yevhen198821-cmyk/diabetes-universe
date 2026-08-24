'use client';

import type {
  ActivityQuickAddEntry,
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  NoteQuickAddEntry,
  NutritionQuickAddEntry,
  SemanticTimelineEvent,
} from '@diabetes-universe/types';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  createSemanticActivityTimelineEvent,
  createSemanticGlucoseTimelineEvent,
  createSemanticInsulinTimelineEvent,
  createSemanticMedicationTimelineEvent,
  createSemanticNoteTimelineEvent,
  createSemanticNutritionTimelineEvent,
} from '../../lib/timeline/semantic-creators';
import { compareSemanticTimelineEventsDescending } from '../../lib/timeline/semantic-timeline-ordering';
import { useTimelinePresentationDependencies } from '../../lib/timeline/react/use-timeline-presentation-dependencies';
import { resolveTimelinePresentationLocale } from '../../lib/timeline/presentation';
import { useTimelineStore } from '../../lib/timeline/timeline-store';
import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { createTimelineListModel } from './timeline-list-model';
import { resolveTimelineUiLabels } from './timeline-ui-labels';
import { QuickAddRoot } from './quick-add-root';
import { TimelineList } from './timeline-list';
import {
  TimelineEventDetail,
  type TimelineEventDetailMode,
} from './timeline-event-detail';
import { TimelineLoadMore } from './timeline-load-more';
import { createTimelinePaginationModel } from './timeline-pagination-model';
import {
  createTimelineSearchFilterModel,
  type TimelineEventFilter,
} from './timeline-search-filter-model';
import { TimelineToolbar } from './timeline-toolbar';
import { TopBar } from './top-bar';
import { DashboardMobileNav } from '../dashboard/dashboard-mobile-nav';
import {
  AppPageBackground,
  appPageShellClassName,
} from '../shared/app-page-background';

const TIMELINE_PAGE_SIZE = 20;

function sortTimelineEventsNewestFirst(
  events: readonly SemanticTimelineEvent[],
): readonly SemanticTimelineEvent[] {
  return [...events].sort(compareSemanticTimelineEventsDescending);
}

export function TimelineShell() {
  const localization = useLocalization();
  const formatter = useFormatter();
  const uiLabels = useMemo(
    () => resolveTimelineUiLabels(localization),
    [localization],
  );
  const formatCount = useMemo(
    () => (count: number) => formatter.formatNumber(count),
    [formatter],
  );
  const {
    addEvent,
    deleteEvent,
    error,
    events,
    hasMoreHistory,
    historyLoadErrorCode,
    historyLoadStatus,
    loadMoreHistory,
    status,
    updateEvent,
  } = useTimelineStore();
  const presentationDependencies = useTimelinePresentationDependencies();
  const presentationLocale = resolveTimelinePresentationLocale(
    presentationDependencies,
  );
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TimelineEventFilter>('all');
  const [visibleCount, setVisibleCount] = useState(TIMELINE_PAGE_SIZE);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<TimelineEventDetailMode>('view');
  const [returnFocusElement, setReturnFocusElement] =
    useState<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pendingSearchFocusRef = useRef(false);
  const referenceDate = useMemo(() => new Date(), []);
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const displayOrderedEvents = useMemo(
    () => sortTimelineEventsNewestFirst(events),
    [events],
  );
  const searchFilterModel = useMemo(
    () =>
      createTimelineSearchFilterModel(
        displayOrderedEvents,
        {
          filter: activeFilter,
          query,
        },
        presentationDependencies,
      ),
    [activeFilter, displayOrderedEvents, presentationDependencies, query],
  );

  useLayoutEffect(() => {
    if (!pendingSearchFocusRef.current || selectedEventId !== null) {
      return;
    }

    pendingSearchFocusRef.current = false;
    const searchInput = document.getElementById('timeline-search');

    if (searchInput instanceof HTMLElement) {
      searchInput.focus();
      return;
    }

    headingRef.current?.focus();
  }, [selectedEventId]);
  const paginationModel = useMemo(
    () =>
      createTimelinePaginationModel({
        events: searchFilterModel.filteredEvents,
        pageSize: TIMELINE_PAGE_SIZE,
        visibleCount,
      }),
    [searchFilterModel.filteredEvents, visibleCount],
  );
  const listModel = useMemo(
    () =>
      createTimelineListModel({
        defaultErrorMessage: uiLabels.error.default,
        error,
        events: paginationModel.visibleEvents,
        hasActiveCriteria: searchFilterModel.hasActiveCriteria,
        locale: presentationLocale,
        groupLabels: presentationDependencies.labels.groups,
        referenceDate,
        status,
        timeZone,
        totalSourceEventCount: events.length,
        unknownDateLabel: uiLabels.group.unknownDate,
      }),
    [
      error,
      events.length,
      paginationModel.visibleEvents,
      presentationDependencies.labels.groups,
      presentationLocale,
      referenceDate,
      searchFilterModel.hasActiveCriteria,
      status,
      timeZone,
      uiLabels.error.default,
      uiLabels.group.unknownDate,
    ],
  );
  const showToolbar = status === 'ready';
  const selectedEvent =
    selectedEventId !== null
      ? events.find((event) => event.id === selectedEventId)
      : undefined;

  const resetCriteria = () => {
    setQuery('');
    setActiveFilter('all');
    setVisibleCount(TIMELINE_PAGE_SIZE);
  };

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setVisibleCount(TIMELINE_PAGE_SIZE);
  };

  const handleFilterChange = (nextFilter: TimelineEventFilter) => {
    setActiveFilter(nextFilter);
    setVisibleCount(TIMELINE_PAGE_SIZE);
  };

  const handleLoadMore = () => {
    if (paginationModel.hasMore) {
      setVisibleCount(paginationModel.nextVisibleCount);
      return;
    }

    if (hasMoreHistory) {
      loadMoreHistory();
    }
  };

  const showLoadMore =
    status === 'ready' &&
    (paginationModel.hasMore ||
      hasMoreHistory ||
      historyLoadStatus === 'loading');
  const isLoadingRepositoryHistory = historyLoadStatus === 'loading';

  const focusTimelineHeading = () => {
    requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  };

  const closeDetails = () => {
    setSelectedEventId(null);
    setDetailMode('view');

    requestAnimationFrame(() => {
      if (returnFocusElement && document.contains(returnFocusElement)) {
        returnFocusElement.focus();
        return;
      }

      headingRef.current?.focus();
    });
  };

  const handleOpenEvent = (eventId: string, trigger: HTMLElement) => {
    setReturnFocusElement(trigger);
    setSelectedEventId(eventId);
    setDetailMode('view');
  };

  const handleUpdateEvent = (updatedEvent: SemanticTimelineEvent) => {
    updateEvent(updatedEvent);

    const nextEvents = sortTimelineEventsNewestFirst(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
    const nextSearchFilterModel = createTimelineSearchFilterModel(
      nextEvents,
      {
        filter: activeFilter,
        query,
      },
      presentationDependencies,
    );
    const isStillVisible = nextSearchFilterModel.filteredEvents.some(
      (visibleEvent) => visibleEvent.id === updatedEvent.id,
    );

    if (!isStillVisible) {
      pendingSearchFocusRef.current = true;
      setSelectedEventId(null);
      setDetailMode('view');
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    setSelectedEventId(null);
    setDetailMode('view');
    focusTimelineHeading();
  };

  const handleGlucoseSubmit = (entry: GlucoseQuickAddEntry) => {
    addEvent(createSemanticGlucoseTimelineEvent(entry));
  };

  const handleInsulinSubmit = (entry: InsulinQuickAddEntry) => {
    addEvent(createSemanticInsulinTimelineEvent(entry));
  };

  const handleNutritionSubmit = (entry: NutritionQuickAddEntry) => {
    addEvent(createSemanticNutritionTimelineEvent(entry));
  };

  const handleMedicationSubmit = (entry: MedicationQuickAddEntry) => {
    addEvent(createSemanticMedicationTimelineEvent(entry));
  };

  const handleActivitySubmit = (entry: ActivityQuickAddEntry) => {
    addEvent(createSemanticActivityTimelineEvent(entry));
  };

  const handleNoteSubmit = (entry: NoteQuickAddEntry) => {
    addEvent(createSemanticNoteTimelineEvent(entry));
  };

  return (
    <div className={appPageShellClassName}>
      <AppPageBackground />
      <TopBar />

      <main
        className="relative mx-auto max-w-6xl space-y-5 px-[max(1rem,env(safe-area-inset-right))] pt-2 pb-[calc(4.75rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:space-y-6 sm:px-[max(1.5rem,env(safe-area-inset-right))] sm:pt-4 sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:pb-10"
        id="main-content"
      >
        <div>
          <p className="text-sm font-semibold text-teal-600/85 dark:text-teal-300/85">
            {uiLabels.shell.eyebrow}
          </p>
          <h1
            className="mt-1 text-[1.75rem] font-extrabold tracking-tight text-[#1e3a5f] focus:outline-none sm:text-[2rem] dark:text-white"
            ref={headingRef}
            tabIndex={-1}
          >
            {uiLabels.header.title}
          </h1>
        </div>

        {showToolbar ? (
          <TimelineToolbar
            filterLabels={presentationDependencies.labels.filters}
            formatCount={formatCount}
            labels={uiLabels}
            model={searchFilterModel}
            onFilterChange={handleFilterChange}
            onQueryChange={handleQueryChange}
            onReset={resetCriteria}
            query={query}
          />
        ) : null}

        <TimelineList
          labels={uiLabels}
          model={listModel}
          onAddEvent={() => setQuickAddOpen(true)}
          onOpenEvent={handleOpenEvent}
          onResetCriteria={resetCriteria}
          presentationDependencies={presentationDependencies}
        />

        {showLoadMore ? (
          <TimelineLoadMore
            addedCount={
              paginationModel.hasMore
                ? paginationModel.nextVisibleCount -
                  paginationModel.visibleCount
                : 0
            }
            ariaControls="timeline-events-list"
            formatCount={formatCount}
            isLoading={isLoadingRepositoryHistory}
            labels={uiLabels.loadMore}
            onLoadMore={handleLoadMore}
            remainingCount={
              paginationModel.hasMore
                ? paginationModel.remainingCount
                : undefined
            }
            showRemainingCount={paginationModel.hasMore}
          />
        ) : null}

        {historyLoadErrorCode ? (
          <p className="text-center text-sm text-red-600" role="status">
            {uiLabels.historyLoad.error}
          </p>
        ) : null}
      </main>

      <QuickAddRoot
        onActivitySubmit={handleActivitySubmit}
        onOpenChange={setQuickAddOpen}
        onGlucoseSubmit={handleGlucoseSubmit}
        onInsulinSubmit={handleInsulinSubmit}
        onMedicationSubmit={handleMedicationSubmit}
        onNoteSubmit={handleNoteSubmit}
        onNutritionSubmit={handleNutritionSubmit}
        open={quickAddOpen}
        floatingActionButtonClassName="timeline-fab right-[max(1rem,env(safe-area-inset-right))] hidden lg:grid sm:right-[max(1.5rem,env(safe-area-inset-right))]"
      />

      <DashboardMobileNav
        activeTab="timeline"
        onQuickAdd={() => setQuickAddOpen(true)}
        showQuickAddFab
      />

      {selectedEvent ? (
        <TimelineEventDetail
          event={selectedEvent}
          key={selectedEvent.id}
          mode={detailMode}
          onClose={closeDetails}
          onDelete={handleDeleteEvent}
          onModeChange={setDetailMode}
          onUpdate={handleUpdateEvent}
          presentationDependencies={presentationDependencies}
        />
      ) : null}
    </div>
  );
}
