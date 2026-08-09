'use client';

import type {
  ActivityQuickAddEntry,
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  NoteQuickAddEntry,
  NutritionQuickAddEntry,
  SemanticTimelineEvent,
  TimelineEvent,
} from '@diabetes-universe/types';
import { useMemo, useRef, useState } from 'react';

import { createActivityTimelineEvent } from '../../lib/quick-add/create-activity-timeline-event';
import { createGlucoseTimelineEvent } from '../../lib/quick-add/create-glucose-timeline-event';
import { createInsulinTimelineEvent } from '../../lib/quick-add/create-insulin-timeline-event';
import { createMedicationTimelineEvent } from '../../lib/quick-add/create-medication-timeline-event';
import { createNoteTimelineEvent } from '../../lib/quick-add/create-note-timeline-event';
import { createNutritionTimelineEvent } from '../../lib/quick-add/create-nutrition-timeline-event';
import { liftRepositorySnapshot } from '../../lib/timeline/migration/lift-repository-snapshot';
import { compareSemanticTimelineEventsDescending } from '../../lib/timeline/semantic-timeline-ordering';
import { useTimelineStore } from '../../lib/timeline/timeline-store';
import { createTimelineListModel } from './timeline-list-model';
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

const TIMELINE_PAGE_SIZE = 20;

function sortTimelineEventsNewestFirst(
  events: readonly SemanticTimelineEvent[],
): readonly SemanticTimelineEvent[] {
  return [...events].sort(compareSemanticTimelineEventsDescending);
}

export function TimelineShell() {
  const { addEvent, deleteEvent, error, events, status, updateEvent } =
    useTimelineStore();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<TimelineEventFilter>('all');
  const [visibleCount, setVisibleCount] = useState(TIMELINE_PAGE_SIZE);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<TimelineEventDetailMode>('view');
  const [returnFocusElement, setReturnFocusElement] =
    useState<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
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
      createTimelineSearchFilterModel(displayOrderedEvents, {
        filter: activeFilter,
        query,
      }),
    [activeFilter, displayOrderedEvents, query],
  );
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
        error,
        events: paginationModel.visibleEvents,
        hasActiveCriteria: searchFilterModel.hasActiveCriteria,
        referenceDate,
        status,
        timeZone,
        totalSourceEventCount: events.length,
      }),
    [
      error,
      events.length,
      paginationModel.visibleEvents,
      referenceDate,
      searchFilterModel.hasActiveCriteria,
      status,
      timeZone,
    ],
  );
  const showToolbar = status === 'ready' && events.length > 0;
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
    setVisibleCount(paginationModel.nextVisibleCount);
  };

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

  const handleUpdateEvent = (legacyEvent: TimelineEvent) => {
    updateEvent(legacyEvent);

    const liftedUpdate = liftRepositorySnapshot([legacyEvent], {
      migratedAt: new Date().toISOString(),
    });
    const updatedEvent = liftedUpdate.events[0];
    const nextEvents =
      updatedEvent !== undefined
        ? sortTimelineEventsNewestFirst(
            events.map((event) =>
              event.id === updatedEvent.id ? updatedEvent : event,
            ),
          )
        : sortTimelineEventsNewestFirst(events);
    const nextSearchFilterModel = createTimelineSearchFilterModel(nextEvents, {
      filter: activeFilter,
      query,
    });
    const isStillVisible = nextSearchFilterModel.filteredEvents.some(
      (visibleEvent) => visibleEvent.id === legacyEvent.id,
    );

    if (!isStillVisible) {
      setSelectedEventId(null);
      setDetailMode('view');
      requestAnimationFrame(() => {
        const searchInput = document.getElementById('timeline-search');

        if (searchInput instanceof HTMLElement) {
          searchInput.focus();
          return;
        }

        headingRef.current?.focus();
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    setSelectedEventId(null);
    setDetailMode('view');
    focusTimelineHeading();
  };

  const handleGlucoseSubmit = (entry: GlucoseQuickAddEntry) => {
    addEvent(createGlucoseTimelineEvent(entry));
  };

  const handleInsulinSubmit = (entry: InsulinQuickAddEntry) => {
    addEvent(createInsulinTimelineEvent(entry));
  };

  const handleNutritionSubmit = (entry: NutritionQuickAddEntry) => {
    addEvent(createNutritionTimelineEvent(entry));
  };

  const handleMedicationSubmit = (entry: MedicationQuickAddEntry) => {
    addEvent(createMedicationTimelineEvent(entry));
  };

  const handleActivitySubmit = (entry: ActivityQuickAddEntry) => {
    addEvent(createActivityTimelineEvent(entry));
  };

  const handleNoteSubmit = (entry: NoteQuickAddEntry) => {
    addEvent(createNoteTimelineEvent(entry));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <TopBar />

      <main className="timeline-content mx-auto max-w-3xl space-y-6 px-4 pt-6 pb-24 sm:px-6 lg:pt-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Журнал событий</p>
          <h1
            className="mt-1 text-2xl font-bold text-slate-950 focus:outline-none"
            ref={headingRef}
            tabIndex={-1}
          >
            Timeline
          </h1>
        </div>

        {showToolbar ? (
          <TimelineToolbar
            model={searchFilterModel}
            onFilterChange={handleFilterChange}
            onQueryChange={handleQueryChange}
            onReset={resetCriteria}
            query={query}
          />
        ) : null}

        <TimelineList
          model={listModel}
          onAddEvent={() => setQuickAddOpen(true)}
          onOpenEvent={handleOpenEvent}
          onResetCriteria={resetCriteria}
        />

        {status === 'ready' && paginationModel.hasMore ? (
          <TimelineLoadMore
            addedCount={
              paginationModel.nextVisibleCount - paginationModel.visibleCount
            }
            ariaControls="timeline-events-list"
            onLoadMore={handleLoadMore}
            remainingCount={paginationModel.remainingCount}
          />
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
        />
      ) : null}
    </div>
  );
}
