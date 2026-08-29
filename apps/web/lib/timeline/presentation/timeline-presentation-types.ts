import type { EventCardType } from '@diabetes-universe/ui';
import type { TimelineEventKind } from '@diabetes-universe/types';

export interface TimelineEventCardPresentation {
  readonly ariaLabel: string;
  readonly cardType: EventCardType;
  readonly context?: string;
  readonly mapAriaLabel: string;
  readonly occurredAt: string;
  readonly statusLines?: readonly string[];
  readonly time: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export interface TimelineEventDetailPresentation {
  readonly context: string | null;
  readonly kindLabel: string;
  readonly note: string | null;
  readonly primaryText: string;
  readonly title: string;
}

export interface TimelineSearchPresentation {
  readonly localizedLabels: readonly string[];
  readonly userContent: readonly string[];
}

export interface TimelineMeasurementPresentation {
  readonly display: string;
  readonly unit: string;
  readonly value: string;
}

export interface TimelineKindPresentation {
  readonly cardType: EventCardType;
  readonly context: string | undefined;
  readonly kindLabel: string;
  readonly measurement: TimelineMeasurementPresentation;
  readonly note?: string | null;
  readonly rangeLabel?: string | null;
  readonly search: {
    readonly localizedLabels: readonly string[];
    readonly userContent: readonly string[];
  };
  readonly timestampUncertaintyLabel?: string | null;
  readonly title: string;
}

export type TimelineEventKindLabelKey =
  `timeline.eventKind.${TimelineEventKind}`;

export type TimelineFilterLabelKey =
  'timeline.filter.all' | `timeline.filter.${TimelineEventKind}`;
