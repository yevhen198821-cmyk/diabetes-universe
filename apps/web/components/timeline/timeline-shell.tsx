import {
  daySummary,
  lastGlucose,
  nextStep,
  timelineEvents,
} from '../../lib/mocks/timeline';
import { DaySummaryPanel } from './day-summary-panel';
import { FloatingActionButton } from './floating-action-button';
import { LastGlucoseCard } from './last-glucose-card';
import { NextStepPanel } from './next-step-panel';
import { TimelineList } from './timeline-list';
import { TopBar } from './top-bar';

export function TimelineShell() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
      <TopBar />

      <main className="timeline-content mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 lg:py-8">
        <NextStepPanel nextStep={nextStep} />
        <LastGlucoseCard glucose={lastGlucose} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
          <TimelineList events={timelineEvents} />
          <div className="lg:sticky lg:top-24">
            <DaySummaryPanel summary={daySummary} />
          </div>
        </div>
      </main>

      <FloatingActionButton />
    </div>
  );
}
