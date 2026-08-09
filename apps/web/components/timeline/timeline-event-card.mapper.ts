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
  getSemanticEventCardContext,
  getSemanticEventCardTitle,
  getSemanticEventCardUnit,
  getSemanticEventCardValue,
  getSemanticEventOccurredAt,
} from '../../lib/timeline/semantic-event-fields';
import { formatTimelineDisplayTime } from '../../lib/timeline/timeline-date-time';

type TimelineEventCardProps = Omit<EventCardProps, 'onClick' | 'variant'>;

interface EventMapping {
  readonly cardType: EventCardType;
  readonly icon: LucideIcon;
}

const eventMappings = {
  activity: {
    cardType: 'activity',
    icon: Activity,
  },
  glucose: {
    cardType: 'glucose',
    icon: Droplets,
  },
  insulin: {
    cardType: 'insulin',
    icon: Syringe,
  },
  medication: {
    cardType: 'medication',
    icon: Pill,
  },
  note: {
    cardType: 'note',
    icon: StickyNote,
  },
  nutrition: {
    cardType: 'nutrition',
    icon: CookingPot,
  },
} as const satisfies Record<SemanticTimelineEvent['kind'], EventMapping>;

export function mapTimelineEventToCard(
  event: SemanticTimelineEvent,
): TimelineEventCardProps {
  const mapping = eventMappings[event.kind];

  return {
    context: getSemanticEventCardContext(event),
    icon: createElement(mapping.icon, {
      'aria-hidden': true,
      size: 15,
    }),
    time: formatTimelineDisplayTime(getSemanticEventOccurredAt(event)),
    title: getSemanticEventCardTitle(event),
    type: mapping.cardType,
    unit: getSemanticEventCardUnit(event) ?? '',
    value: getSemanticEventCardValue(event),
  };
}
