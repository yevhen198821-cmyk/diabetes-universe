'use client';

import type { TimelineEventKind } from '@diabetes-universe/types';
import { useEffect, useState } from 'react';

import {
  getTimelineCurrentTimePositionPercent,
  type TimelineDayMapClusterMarker,
  TimelineDayMapModel,
  TimelineDayMapRenderableMarker,
  TimelineDayMapSingleMarker,
} from './timeline-day-map-model';
import { frostedPanelClassName } from '../shared/app-page-background';
import {
  Activity,
  CookingPot,
  Droplets,
  Pill,
  StickyNote,
  Syringe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useRef } from 'react';

const MARKER_ACCENT_BY_KIND: Record<TimelineEventKind, string> = {
  activity: 'bg-blue-500 ring-blue-300/70',
  glucose: 'bg-teal-500 ring-teal-300/70',
  insulin: 'bg-violet-500 ring-violet-300/70',
  medication: 'bg-rose-500 ring-rose-300/70',
  note: 'bg-emerald-500 ring-emerald-300/70',
  nutrition: 'bg-orange-500 ring-orange-300/70',
};

const ICON_BY_KIND: Record<TimelineEventKind, LucideIcon> = {
  activity: Activity,
  glucose: Droplets,
  insulin: Syringe,
  medication: Pill,
  note: StickyNote,
  nutrition: CookingPot,
};

const TIMELINE_HOUR_LABELS = ['00', '06', '12', '18', '24'] as const;

interface TimelineEventsOfDayMapLabels {
  readonly ariaLabel: string;
  readonly clusterAriaLabel: (count: number) => string;
  readonly currentTimeLabel: string;
  readonly helper: string;
  readonly title: string;
}

interface TimelineEventsOfDayMapProps {
  readonly labels: TimelineEventsOfDayMapLabels;
  readonly model: TimelineDayMapModel;
  readonly onSelectEvent: (eventId: string, trigger: HTMLElement) => void;
  readonly selectedEventId?: string | null;
  readonly timeZone?: string;
}

function TimelineMapMarkerIcon({
  category,
}: {
  readonly category: TimelineEventKind;
}) {
  const Icon = ICON_BY_KIND[category];

  return <Icon aria-hidden="true" size={12} strokeWidth={2.4} />;
}

function TimelineMapSingleMarkerButton({
  marker,
  onSelectEvent,
  selectedEventId,
}: {
  readonly marker: TimelineDayMapSingleMarker;
  readonly onSelectEvent: (eventId: string, trigger: HTMLElement) => void;
  readonly selectedEventId?: string | null;
}) {
  const isSelected = selectedEventId === marker.eventId;

  return (
    <button
      aria-label={marker.marker.ariaLabel}
      aria-pressed={isSelected}
      className={`focus-visible:outline-interactive-primary absolute top-1/2 z-20 grid size-11 min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 ${
        isSelected ? 'scale-110' : ''
      }`}
      onClick={(event) => {
        onSelectEvent(marker.eventId, event.currentTarget);
      }}
      style={{ left: `${marker.positionPercent}%` }}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`grid size-7 place-items-center rounded-full text-white ring-2 ${MARKER_ACCENT_BY_KIND[marker.marker.category]}`}
      >
        <TimelineMapMarkerIcon category={marker.marker.category} />
      </span>
    </button>
  );
}

function TimelineMapClusterMarkerButton({
  cluster,
  onSelectEvent,
  selectedEventId,
}: {
  readonly cluster: TimelineDayMapClusterMarker;
  readonly onSelectEvent: (eventId: string, trigger: HTMLElement) => void;
  readonly selectedEventId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isSelected = cluster.eventIds.includes(selectedEventId ?? '');

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  return (
    <div
      className="absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      ref={popoverRef}
      style={{ left: `${cluster.positionPercent}%` }}
    >
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={cluster.ariaLabel}
        aria-pressed={isSelected}
        className={`focus-visible:outline-interactive-primary grid size-11 min-h-11 min-w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isSelected ? 'scale-110' : ''
        }`}
        onClick={() => {
          setOpen((current) => !current);
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full bg-slate-700 text-xs font-bold text-white ring-2 ring-slate-400/70"
        >
          {cluster.markers.length}
        </span>
      </button>

      {open ? (
        <div
          className="absolute bottom-[calc(100%+0.5rem)] left-1/2 z-30 w-56 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-white/70 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-950/95"
          role="dialog"
        >
          <ul className="space-y-1">
            {cluster.markers.map((marker) => (
              <li key={marker.eventId}>
                <button
                  className="focus-visible:outline-interactive-primary flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-teal-950/40"
                  onClick={(event) => {
                    setOpen(false);
                    onSelectEvent(marker.eventId, event.currentTarget);
                  }}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-white ${MARKER_ACCENT_BY_KIND[marker.category]}`}
                  >
                    <TimelineMapMarkerIcon category={marker.category} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-500 tabular-nums">
                      {marker.timeLabel}
                    </span>
                    <span className="block truncate text-sm font-semibold text-[#1e3a5f] dark:text-white">
                      {marker.title}
                      {marker.primaryValue ? ` · ${marker.primaryValue}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function renderTimelineMapMarker(
  marker: TimelineDayMapRenderableMarker,
  labels: TimelineEventsOfDayMapLabels,
  onSelectEvent: (eventId: string, trigger: HTMLElement) => void,
  selectedEventId?: string | null,
) {
  if (marker.kind === 'single') {
    return (
      <TimelineMapSingleMarkerButton
        key={marker.eventId}
        marker={marker}
        onSelectEvent={onSelectEvent}
        selectedEventId={selectedEventId}
      />
    );
  }

  return (
    <TimelineMapClusterMarkerButton
      cluster={marker}
      key={marker.eventIds.join('-')}
      onSelectEvent={onSelectEvent}
      selectedEventId={selectedEventId}
    />
  );
}

export function TimelineEventsOfDayMap({
  labels,
  model,
  onSelectEvent,
  selectedEventId,
  timeZone,
}: TimelineEventsOfDayMapProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (model.currentTimePercent === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [model.currentTimePercent]);

  const currentTimePercent =
    model.currentTimePercent === null
      ? null
      : getTimelineCurrentTimePositionPercent(now, timeZone);

  const showTrack = useMemo(
    () => model.hasEvents || model.currentTimePercent !== null,
    [model.currentTimePercent, model.hasEvents],
  );

  return (
    <section
      aria-label={labels.ariaLabel}
      className={`${frostedPanelClassName} space-y-3 p-4 sm:p-5`}
    >
      <div>
        <h2 className="text-sm font-extrabold tracking-wide text-[#1e3a5f]/85 uppercase dark:text-slate-200">
          {labels.title}
        </h2>
        <p className="text-text-secondary mt-1 text-xs">{labels.helper}</p>
      </div>

      <div className="relative min-w-0 pt-1 pb-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[calc(50%+0.25rem)] h-px bg-slate-300/80 dark:bg-slate-600/80"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[calc(100%-1rem)] flex justify-between px-0.5 text-[10px] font-semibold text-slate-400 tabular-nums"
        >
          {TIMELINE_HOUR_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        {showTrack ? (
          <div className="relative h-16">
            {currentTimePercent !== null ? (
              <>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 bottom-4 z-10 w-px -translate-x-1/2 bg-teal-400/80"
                  style={{ left: `${currentTimePercent}%` }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 text-[10px] font-semibold text-teal-500/90"
                  style={{ left: `${currentTimePercent}%` }}
                >
                  {labels.currentTimeLabel}
                </span>
              </>
            ) : null}

            {model.markers.map((marker) =>
              renderTimelineMapMarker(
                marker,
                labels,
                onSelectEvent,
                selectedEventId,
              ),
            )}
          </div>
        ) : (
          <div aria-hidden="true" className="relative h-10 opacity-60" />
        )}
      </div>
    </section>
  );
}
