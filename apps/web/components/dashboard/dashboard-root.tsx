'use client';

import { useMemo, useRef, useState } from 'react';

import {
  applyGlucoseQuickAddEntry,
  applyInsulinQuickAddEntry,
  applyMedicationQuickAddEntry,
  applyNutritionQuickAddEntry,
  deriveDashboardQuickAddBlocks,
  type DashboardDemoState,
} from '../../lib/dashboard/dashboard-quick-add-integration-model';
import {
  nextStep,
  timelineEvents as initialTimelineEvents,
} from '../../lib/mocks/timeline';
import {
  closeQuickAdd,
  createQuickAddOpeningLock,
  releaseQuickAddOpeningLock,
  requestQuickAddOpen,
  type QuickAddOpenTrigger,
} from '../../lib/quick-add/quick-add-controller-model';
import { QuickAddHost } from '../quick-add/quick-add-host';
import { DashboardAiInsight } from './dashboard-ai-insight';
import { DashboardDaySummary } from './dashboard-day-summary';
import { DashboardHeader } from './dashboard-header';
import { createDashboardHeaderDate } from './dashboard-header-model';
import { DashboardLastGlucose } from './dashboard-last-glucose';
import { DashboardNextAction } from './dashboard-next-action';
import { DashboardRecentEvents } from './dashboard-recent-events';
import { DashboardShell } from './dashboard-shell';

const DASHBOARD_LOCALE = 'ru-RU';
const DASHBOARD_TIME_ZONE = 'Europe/Moscow';

const mockAiInsight = {
  displayTime: '10:20',
  generatedAt: '2026-08-02T07:20:00.000Z',
  id: 'insight-demo',
  relatedEventIds: ['glucose-0800', 'meal-0820'],
  summary:
    'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
  title: 'После завтрака',
} as const;

export function DashboardRoot() {
  const [demoState, setDemoState] = useState<DashboardDemoState>({
    events: initialTimelineEvents,
  });
  const [quickAddState, setQuickAddState] = useState({
    isOpen: false,
    isOpeningLocked: false,
    lastOpenTrigger: null as QuickAddOpenTrigger | null,
  });
  const headerActionRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const referenceTime = useMemo(() => new Date(), []);

  const headerDate = useMemo(
    () =>
      createDashboardHeaderDate(
        referenceTime,
        DASHBOARD_LOCALE,
        DASHBOARD_TIME_ZONE,
      ),
    [referenceTime],
  );

  const derivedBlocks = useMemo(
    () =>
      deriveDashboardQuickAddBlocks(demoState, {
        aiInsight: mockAiInsight,
        locale: DASHBOARD_LOCALE,
        referenceTime,
        remindersCompleted: 1,
        remindersTotal: 3,
        timeZone: DASHBOARD_TIME_ZONE,
      }),
    [demoState, referenceTime],
  );

  const returnFocusRef =
    quickAddState.lastOpenTrigger === 'header' ? headerActionRef : fabRef;

  const requestOpen = (trigger: QuickAddOpenTrigger) => {
    setQuickAddState((current) => {
      if (requestQuickAddOpen(current) === 'ignored') {
        return current;
      }

      const nextState = createQuickAddOpeningLock(current);

      if (!nextState) {
        return current;
      }

      return {
        ...nextState,
        lastOpenTrigger: trigger,
      };
    });
  };

  const handleQuickAddOpenChange = (open: boolean) => {
    setQuickAddState((current) => {
      if (open) {
        return {
          ...releaseQuickAddOpeningLock({
            ...current,
            isOpen: true,
          }),
          lastOpenTrigger: current.lastOpenTrigger,
        };
      }

      return {
        ...closeQuickAdd(),
        lastOpenTrigger: current.lastOpenTrigger,
      };
    });
  };

  return (
    <>
      <DashboardShell
        aiInsight={
          derivedBlocks.aiInsight ? (
            <DashboardAiInsight
              insight={derivedBlocks.aiInsight}
              state="ready"
            />
          ) : (
            <DashboardAiInsight state="empty" />
          )
        }
        daySummary={
          derivedBlocks.daySummary ? (
            <DashboardDaySummary
              state="ready"
              summary={derivedBlocks.daySummary}
            />
          ) : (
            <DashboardDaySummary state="empty" />
          )
        }
        header={
          <DashboardHeader
            addEventButtonRef={headerActionRef}
            addEventDisabled={quickAddState.isOpen}
            date={headerDate}
            onAddEvent={() => requestOpen('header')}
            state="ready"
            user={{ displayName: 'Анна Иванова' }}
          />
        }
        lastGlucose={
          derivedBlocks.lastGlucose ? (
            <DashboardLastGlucose
              glucose={derivedBlocks.lastGlucose}
              referenceTime={referenceTime}
              state="ready"
            />
          ) : (
            <DashboardLastGlucose state="empty" />
          )
        }
        nextAction={
          <DashboardNextAction
            action={nextStep}
            actionDisabled={quickAddState.isOpen}
            onAction={() => undefined}
            state="ready"
          />
        }
        recentEvents={
          <DashboardRecentEvents
            events={derivedBlocks.recentEvents}
            state="ready"
            viewAllHref="/"
          />
        }
      />
      <QuickAddHost
        floatingActionButtonClassName="dashboard-fab lg:hidden"
        floatingActionButtonRef={fabRef}
        onGlucoseSubmit={(entry) => {
          setDemoState((current) => applyGlucoseQuickAddEntry(current, entry));
        }}
        onInsulinSubmit={(entry) => {
          setDemoState((current) => applyInsulinQuickAddEntry(current, entry));
        }}
        onMedicationSubmit={(entry) => {
          setDemoState((current) =>
            applyMedicationQuickAddEntry(current, entry),
          );
        }}
        onNutritionSubmit={(entry) => {
          setDemoState((current) =>
            applyNutritionQuickAddEntry(current, entry),
          );
        }}
        onOpenChange={handleQuickAddOpenChange}
        onRequestOpen={() => requestOpen('fab')}
        open={quickAddState.isOpen}
        returnFocusRef={returnFocusRef}
        showFloatingActionButton
      />
    </>
  );
}
