'use client';

import { useMemo, useRef, useState } from 'react';

import { deriveDashboardQuickAddBlocks } from '../../lib/dashboard/dashboard-quick-add-integration-model';
import { prepareDashboardAiInsightPresentation } from '../../lib/dashboard/dashboard-ai-insight-presentation';
import { nextStepSource } from '../../lib/mocks/timeline';
import { createActivityTimelineEvent } from '../../lib/quick-add/create-activity-timeline-event';
import { createGlucoseTimelineEvent } from '../../lib/quick-add/create-glucose-timeline-event';
import { createInsulinTimelineEvent } from '../../lib/quick-add/create-insulin-timeline-event';
import { createMedicationTimelineEvent } from '../../lib/quick-add/create-medication-timeline-event';
import { createNoteTimelineEvent } from '../../lib/quick-add/create-note-timeline-event';
import { createNutritionTimelineEvent } from '../../lib/quick-add/create-nutrition-timeline-event';
import {
  closeQuickAddController,
  createInitialQuickAddControllerState,
  createQuickAddOpenRequest,
  releaseQuickAddOpeningLock,
  type QuickAddOpenCategory,
  type QuickAddOpenTrigger,
} from '../../lib/quick-add/quick-add-controller-model';
import { useTimelineStore } from '../../lib/timeline/timeline-store';
import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { QuickAddHost } from '../quick-add/quick-add-host';
import { DashboardAiInsight } from './dashboard-ai-insight';
import { DashboardDaySummary } from './dashboard-day-summary';
import { DashboardHeader } from './dashboard-header';
import { DashboardLastGlucose } from './dashboard-last-glucose';
import { resolveDashboardNextActionDemoStep } from './dashboard-next-action-labels';
import { DashboardNextAction } from './dashboard-next-action';
import { DashboardRecentEvents } from './dashboard-recent-events';
import { resolveDashboardAiInsightLabels } from './dashboard-ai-insight-labels';
import { DashboardShell } from './dashboard-shell';

const DASHBOARD_LOCALE = 'ru-RU';

const mockAiInsight = {
  generatedAt: '2026-08-02T07:20:00.000Z',
  id: 'insight-demo',
  relatedEventIds: ['glucose-0800', 'nutrition-0820'],
  summary:
    'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
  title: 'После завтрака',
} as const;

export function DashboardRoot() {
  const localization = useLocalization();
  const formatter = useFormatter();
  const { addEvent, events } = useTimelineStore();
  const [quickAddState, setQuickAddState] = useState(
    createInitialQuickAddControllerState,
  );
  const headerActionRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const nextActionRef = useRef<HTMLButtonElement>(null);
  const referenceTime = useMemo(() => new Date(), []);
  const localizedNextStep = useMemo(
    () => resolveDashboardNextActionDemoStep(localization, nextStepSource),
    [localization],
  );
  const dashboardTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const formatLastGlucoseDisplayTime = useMemo(
    () => (dateTime: string) =>
      formatter.formatTime(dateTime, { timeStyle: 'short' }),
    [formatter],
  );
  const formatDaySummaryDisplayDate = useMemo(
    () => (date: Date) => formatter.formatDate(date, { dateStyle: 'full' }),
    [formatter],
  );
  const formatRecentEventDisplayTime = useMemo(
    () => (dateTime: string) =>
      formatter.formatTime(dateTime, { timeStyle: 'short' }),
    [formatter],
  );
  const aiInsightPresentationLabels = useMemo(
    () => resolveDashboardAiInsightLabels(localization),
    [localization],
  );
  const formatAiInsightDisplayTime = useMemo(
    () => (generatedAt: string) =>
      formatter.formatTime(generatedAt, { timeStyle: 'short' }),
    [formatter],
  );
  const formatAiInsightRelatedEventsCount = useMemo(
    () => (count: number) => formatter.formatNumber(count),
    [formatter],
  );

  const derivedBlocks = useMemo(
    () =>
      deriveDashboardQuickAddBlocks(
        { events },
        {
          aiInsight: mockAiInsight,
          formatDaySummaryDisplayDate,
          formatLastGlucoseDisplayTime,
          formatRecentEventDisplayTime,
          locale: DASHBOARD_LOCALE,
          referenceTime,
          remindersCompleted: 1,
          remindersTotal: 3,
          timeZone: dashboardTimeZone,
        },
      ),
    [
      dashboardTimeZone,
      events,
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime,
      formatRecentEventDisplayTime,
      referenceTime,
    ],
  );

  const presentedAiInsight = useMemo(() => {
    if (!derivedBlocks.aiInsight) {
      return null;
    }

    return prepareDashboardAiInsightPresentation(derivedBlocks.aiInsight, {
      formatDisplayTime: formatAiInsightDisplayTime,
      formatRelatedEventsCount: formatAiInsightRelatedEventsCount,
      relatedEventsLabel: aiInsightPresentationLabels.relatedEventsLabel,
      relatedEventsNone: aiInsightPresentationLabels.relatedEventsNone,
    });
  }, [
    aiInsightPresentationLabels.relatedEventsLabel,
    aiInsightPresentationLabels.relatedEventsNone,
    derivedBlocks.aiInsight,
    formatAiInsightDisplayTime,
    formatAiInsightRelatedEventsCount,
  ]);

  const returnFocusRef =
    quickAddState.lastOpenTrigger === 'header'
      ? headerActionRef
      : quickAddState.lastOpenTrigger === 'next-action'
        ? nextActionRef
        : fabRef;

  const requestOpen = (
    trigger: QuickAddOpenTrigger,
    category: QuickAddOpenCategory | null = null,
  ) => {
    setQuickAddState((current) => {
      const nextState = createQuickAddOpenRequest(current, trigger, category);

      return nextState ?? current;
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
          openCategory: current.openCategory,
        };
      }

      return closeQuickAddController(current);
    });
  };

  return (
    <>
      <DashboardShell
        aiInsight={
          presentedAiInsight ? (
            <DashboardAiInsight insight={presentedAiInsight} state="ready" />
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
            onAddEvent={() => requestOpen('header')}
            referenceTime={referenceTime}
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
            action={localizedNextStep}
            actionButtonRef={nextActionRef}
            actionDisabled={quickAddState.isOpen}
            onAction={() => requestOpen('next-action', 'insulin')}
            state="ready"
          />
        }
        recentEvents={
          <DashboardRecentEvents
            events={derivedBlocks.recentEvents}
            state="ready"
            viewAllHref="/timeline"
          />
        }
      />
      <QuickAddHost
        floatingActionButtonClassName="dashboard-fab lg:hidden"
        floatingActionButtonRef={fabRef}
        onActivitySubmit={(entry) => {
          addEvent(createActivityTimelineEvent(entry));
        }}
        onGlucoseSubmit={(entry) => {
          addEvent(createGlucoseTimelineEvent(entry));
        }}
        onInsulinSubmit={(entry) => {
          addEvent(createInsulinTimelineEvent(entry));
        }}
        onMedicationSubmit={(entry) => {
          addEvent(createMedicationTimelineEvent(entry));
        }}
        onNoteSubmit={(entry) => {
          addEvent(createNoteTimelineEvent(entry));
        }}
        onNutritionSubmit={(entry) => {
          addEvent(createNutritionTimelineEvent(entry));
        }}
        onOpenChange={handleQuickAddOpenChange}
        onRequestOpen={() => requestOpen('fab')}
        open={quickAddState.isOpen}
        openCategory={quickAddState.openCategory}
        returnFocusRef={returnFocusRef}
        showFloatingActionButton
      />
    </>
  );
}
