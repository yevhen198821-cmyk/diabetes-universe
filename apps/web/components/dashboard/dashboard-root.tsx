'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { TranslationKey } from '@diabetes-universe/i18n';

import { deriveDashboardQuickAddBlocks } from '../../lib/dashboard/dashboard-quick-add-integration-model';
import { formatDashboardGlucoseDisplayTime } from '../../lib/dashboard/format-dashboard-glucose-display-time';
import { formatDashboardRecentEventDisplayTime } from '../../lib/dashboard/dashboard-recent-events-display-time';
import {
  createSemanticActivityTimelineEvent,
  createSemanticGlucoseTimelineEvent,
  createSemanticInsulinTimelineEvent,
  createSemanticMedicationTimelineEvent,
  createSemanticNoteTimelineEvent,
  createSemanticNutritionTimelineEvent,
} from '../../lib/timeline/semantic-creators';
import {
  closeQuickAddController,
  createInitialQuickAddControllerState,
  createQuickAddOpenRequest,
  releaseQuickAddOpeningLock,
  type QuickAddCloseReason,
  type QuickAddOpenCategory,
  type QuickAddOpenTrigger,
} from '../../lib/quick-add/quick-add-controller-model';
import type { QuickAddReturnFocusContext } from '../../lib/quick-add/resolve-quick-add-return-focus-target';
import { useTimelineStore } from '../../lib/timeline/timeline-store';
import { useGlucosePresentationDependencies } from '../../lib/medical/glucose';
import { composeTimelinePresentationDependencies } from '../../lib/timeline/react/use-timeline-presentation-dependencies';
import { useFormatter } from '../../lib/platform/react/use-formatter';
import { useLocalization } from '../../lib/platform/react/use-localization';
import { QuickAddHost } from '../quick-add/quick-add-host';
import { DashboardDaySummary } from './dashboard-day-summary';
import { DashboardGreeting } from './dashboard-greeting';
import { DashboardHeader } from './dashboard-header';
import { DashboardLastGlucose } from './dashboard-last-glucose';
import { DashboardMobileNav } from './dashboard-mobile-nav';
import { DashboardQuickActions } from './dashboard-quick-actions';
import { DashboardRecentEvents } from './dashboard-recent-events';
import { resolveDashboardLastGlucoseTimeLabels } from './dashboard-last-glucose-labels';
import { DashboardShell } from './dashboard-shell';

export function DashboardRoot() {
  const router = useRouter();
  const localization = useLocalization();
  const formatter = useFormatter();
  const quickAddOpenerRef = useRef<HTMLElement | null>(null);
  const openedFromEmptyGlucoseCtaRef = useRef(false);
  const pendingEmptyGlucoseSuccessFocusRef = useRef(false);
  const lastGlucoseReadyFocusRef = useRef<HTMLHeadingElement | null>(null);
  const referenceTime = useMemo(() => new Date(), []);
  const glucosePresentation = useGlucosePresentationDependencies();
  const presentationDependencies = useMemo(
    () =>
      composeTimelinePresentationDependencies(
        glucosePresentation,
        referenceTime,
      ),
    [glucosePresentation, referenceTime],
  );
  const {
    addEvent,
    addEventAsync,
    events,
    status: timelineStatus,
  } = useTimelineStore();
  const [quickAddState, setQuickAddState] = useState(
    createInitialQuickAddControllerState,
  );
  const isTimelineHydrating = timelineStatus === 'loading';
  const isTimelineError = timelineStatus === 'error';
  const dashboardTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const yesterdayLabel = useMemo(
    () =>
      localization.translate({
        key: 'timeline.group.yesterday' as TranslationKey,
      }).value,
    [localization],
  );
  const lastGlucoseTimeLabels = useMemo(
    () => resolveDashboardLastGlucoseTimeLabels(localization),
    [localization],
  );
  const formatLastGlucoseDisplayTime = useMemo(
    () => (dateTime: string) =>
      formatDashboardGlucoseDisplayTime({
        formatter,
        labels: lastGlucoseTimeLabels,
        measuredAt: dateTime,
        referenceTime,
        timeZone: dashboardTimeZone,
      }),
    [dashboardTimeZone, formatter, lastGlucoseTimeLabels, referenceTime],
  );
  const formatDaySummaryDisplayDate = useMemo(
    () => (date: Date) => formatter.formatDate(date, { dateStyle: 'full' }),
    [formatter],
  );
  const formatRecentEventDisplayTime = useMemo(
    () => (dateTime: string) =>
      formatDashboardRecentEventDisplayTime(
        dateTime,
        referenceTime,
        localization.localeContext.locale,
        yesterdayLabel,
        dashboardTimeZone,
      ),
    [
      dashboardTimeZone,
      localization.localeContext.locale,
      referenceTime,
      yesterdayLabel,
    ],
  );

  const derivedBlocks = useMemo(
    () =>
      isTimelineHydrating
        ? null
        : deriveDashboardQuickAddBlocks(
            { events },
            {
              formatDaySummaryDisplayDate,
              formatLastGlucoseDisplayTime,
              formatRecentEventDisplayTime,
              locale: localization.localeContext.locale,
              presentationDependencies,
              referenceTime,
              timeZone: dashboardTimeZone,
            },
          ),
    [
      dashboardTimeZone,
      events,
      formatDaySummaryDisplayDate,
      formatLastGlucoseDisplayTime,
      formatRecentEventDisplayTime,
      isTimelineHydrating,
      localization.localeContext.locale,
      presentationDependencies,
      referenceTime,
    ],
  );

  const requestOpen = (
    trigger: QuickAddOpenTrigger,
    category: QuickAddOpenCategory | null = null,
    opener: HTMLElement | null = null,
    fromEmptyGlucoseCta = false,
  ) => {
    quickAddOpenerRef.current = opener;
    openedFromEmptyGlucoseCtaRef.current = fromEmptyGlucoseCta;

    setQuickAddState((current) => {
      const nextState = createQuickAddOpenRequest(current, trigger, category);

      return nextState ?? current;
    });
  };

  const handleQuickAddClosed = (reason: QuickAddCloseReason) => {
    if (reason === 'success' && openedFromEmptyGlucoseCtaRef.current) {
      pendingEmptyGlucoseSuccessFocusRef.current = true;
      openedFromEmptyGlucoseCtaRef.current = false;
    }
  };

  useEffect(() => {
    if (
      !pendingEmptyGlucoseSuccessFocusRef.current ||
      isTimelineHydrating ||
      !derivedBlocks?.lastGlucose
    ) {
      return;
    }

    pendingEmptyGlucoseSuccessFocusRef.current = false;

    requestAnimationFrame(() => {
      lastGlucoseReadyFocusRef.current?.focus({ preventScroll: true });
    });
  }, [derivedBlocks?.lastGlucose, isTimelineHydrating]);

  const resolveQuickAddReturnFocusContext = (
    reason: QuickAddCloseReason,
  ): QuickAddReturnFocusContext => ({
    fallback:
      reason === 'success' && pendingEmptyGlucoseSuccessFocusRef.current
        ? lastGlucoseReadyFocusRef.current
        : null,
    opener: quickAddOpenerRef.current,
  });

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
        daySummary={
          isTimelineHydrating ? (
            <DashboardDaySummary state="loading" />
          ) : isTimelineError ? (
            <DashboardDaySummary state="error" />
          ) : derivedBlocks?.daySummary ? (
            <DashboardDaySummary
              state="ready"
              summary={derivedBlocks.daySummary}
            />
          ) : (
            <DashboardDaySummary state="empty" />
          )
        }
        greeting={
          <DashboardGreeting
            referenceTime={referenceTime}
            state={isTimelineHydrating ? 'loading' : 'ready'}
          />
        }
        header={
          <DashboardHeader
            onAvatarClick={() => router.push('/account')}
            referenceTime={referenceTime}
            state={isTimelineHydrating ? 'loading' : 'ready'}
            user={null}
          />
        }
        lastGlucose={
          isTimelineHydrating ? (
            <DashboardLastGlucose state="loading" />
          ) : isTimelineError ? (
            <DashboardLastGlucose state="error" />
          ) : derivedBlocks?.lastGlucose ? (
            <DashboardLastGlucose
              glucose={{
                displayTime: derivedBlocks.lastGlucose.displayTime,
                event: derivedBlocks.lastGlucose.event,
              }}
              glucosePresentation={glucosePresentation}
              readyFocusTargetRef={lastGlucoseReadyFocusRef}
              referenceTime={referenceTime}
              state="ready"
            />
          ) : (
            <DashboardLastGlucose
              onAddGlucose={(opener) =>
                requestOpen('fab', 'glucose', opener, true)
              }
              state="empty"
            />
          )
        }
        mobileNav={<DashboardMobileNav />}
        quickActions={
          <DashboardQuickActions
            disabled={quickAddState.isOpen || isTimelineHydrating}
            onOpenCategory={(category, opener) =>
              requestOpen('fab', category, opener)
            }
            presentationDependencies={presentationDependencies}
          />
        }
        recentEvents={
          isTimelineHydrating ? (
            <DashboardRecentEvents state="loading" />
          ) : isTimelineError ? (
            <DashboardRecentEvents state="error" />
          ) : (
            <DashboardRecentEvents
              events={derivedBlocks?.recentEvents ?? []}
              state="ready"
              viewAllHref="/timeline"
            />
          )
        }
      />
      <QuickAddHost
        onActivitySubmit={(entry) => {
          addEvent(createSemanticActivityTimelineEvent(entry));
        }}
        onGlucoseSubmit={async ({ entry, eventId }) => {
          await addEventAsync(
            createSemanticGlucoseTimelineEvent(entry, { id: eventId }),
          );
        }}
        onInsulinSubmit={(entry) => {
          addEvent(createSemanticInsulinTimelineEvent(entry));
        }}
        onMedicationSubmit={(entry) => {
          addEvent(createSemanticMedicationTimelineEvent(entry));
        }}
        onNoteSubmit={(entry) => {
          addEvent(createSemanticNoteTimelineEvent(entry));
        }}
        onNutritionSubmit={(entry) => {
          addEvent(createSemanticNutritionTimelineEvent(entry));
        }}
        onOpenChange={handleQuickAddOpenChange}
        onClosed={handleQuickAddClosed}
        onRequestOpen={() => requestOpen('fab')}
        open={quickAddState.isOpen}
        openCategory={quickAddState.openCategory}
        resolveReturnFocusContext={resolveQuickAddReturnFocusContext}
        showFloatingActionButton={false}
      />
    </>
  );
}
