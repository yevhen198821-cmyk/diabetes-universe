import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import type { EventCardProps, EventCardType } from '@diabetes-universe/ui';
import {
  Activity,
  CookingPot,
  Droplets,
  Pill,
  StickyNote,
  Syringe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

import {
  mapTimelineEventCardPresentation,
  type TimelinePresentationDependencies,
} from '../../lib/timeline/presentation';

type TimelineEventCardProps = Omit<EventCardProps, 'onClick' | 'variant'>;

type TimelineEventCardKind = Extract<
  EventCardType,
  'activity' | 'glucose' | 'insulin' | 'medication' | 'note' | 'nutrition'
>;

const ICON_BY_CARD_TYPE = {
  activity: Activity,
  glucose: Droplets,
  insulin: Syringe,
  medication: Pill,
  note: StickyNote,
  nutrition: CookingPot,
} as const satisfies Record<TimelineEventCardKind, LucideIcon>;

export function mapTimelineEventToCard(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): TimelineEventCardProps {
  const time = dependencies.formatter.formatTime(event.occurredAt, {
    timeStyle: 'short',
  });
  const presentation = mapTimelineEventCardPresentation(
    event,
    dependencies,
    time,
  );
  const icon =
    ICON_BY_CARD_TYPE[presentation.cardType as TimelineEventCardKind];

  return {
    ariaLabel: presentation.ariaLabel,
    context: presentation.context,
    dateTime: presentation.occurredAt,
    icon: createElement(icon, {
      'aria-hidden': true,
      size: 15,
    }),
    statusLines: presentation.statusLines,
    metadataLines: presentation.metadataLines,
    time: presentation.time,
    title: presentation.title,
    type: presentation.cardType,
    unit: presentation.unit,
    value: presentation.value,
  };
}
