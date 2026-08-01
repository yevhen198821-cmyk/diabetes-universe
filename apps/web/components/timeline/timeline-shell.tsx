'use client';

import type {
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  LastGlucose,
  TimelineEvent,
} from '@diabetes-universe/types';
import { useState } from 'react';

import {
  daySummary,
  lastGlucose as initialLastGlucose,
  nextStep,
  timelineEvents as initialTimelineEvents,
} from '../../lib/mocks/timeline';
import {
  createGlucoseTimelineEvent,
  sortTimelineEvents,
} from '../../lib/quick-add/create-glucose-timeline-event';
import { createInsulinTimelineEvent } from '../../lib/quick-add/create-insulin-timeline-event';
import { formatGlucoseValue } from '../../lib/quick-add/format-glucose';
import { DaySummaryPanel } from './day-summary-panel';
import { LastGlucoseCard } from './last-glucose-card';
import { NextStepPanel } from './next-step-panel';
import { QuickAddRoot } from './quick-add-root';
import { TimelineList } from './timeline-list';
import { TopBar } from './top-bar';

export function TimelineShell() {
  const [events, setEvents] = useState<readonly TimelineEvent[]>(
    initialTimelineEvents,
  );
  const [lastGlucose, setLastGlucose] =
    useState<LastGlucose>(initialLastGlucose);

  const handleGlucoseSubmit = (entry: GlucoseQuickAddEntry) => {
    const newEvent = createGlucoseTimelineEvent(entry);

    setEvents((currentEvents) =>
      sortTimelineEvents([...currentEvents, newEvent]),
    );
    setLastGlucose({
      time: entry.time,
      value: formatGlucoseValue(entry.valueMmol),
    });
  };

  const handleInsulinSubmit = (entry: InsulinQuickAddEntry) => {
    const newEvent = createInsulinTimelineEvent(entry);

    setEvents((currentEvents) =>
      sortTimelineEvents([...currentEvents, newEvent]),
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <TopBar />

      <main className="timeline-content mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
        <NextStepPanel nextStep={nextStep} />
        <LastGlucoseCard glucose={lastGlucose} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <TimelineList events={events} />
          <div className="lg:sticky lg:top-24">
            <DaySummaryPanel summary={daySummary} />
          </div>
        </div>
      </main>

      <QuickAddRoot
        onGlucoseSubmit={handleGlucoseSubmit}
        onInsulinSubmit={handleInsulinSubmit}
      />
    </div>
  );
}
