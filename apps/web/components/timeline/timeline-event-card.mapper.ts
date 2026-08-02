import type {
  TimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';
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

import { formatTimelineDisplayTime } from '../../lib/timeline/timeline-date-time';

type TimelineEventCardProps = Omit<EventCardProps, 'onClick' | 'variant'>;

interface EventMapping {
  readonly cardType: EventCardType;
  readonly icon: LucideIcon;
  readonly unit: string;
}

const eventMappings: Record<TimelineEventKind, EventMapping> = {
  activity: {
    cardType: 'activity',
    icon: Activity,
    unit: 'минут',
  },
  glucose: {
    cardType: 'glucose',
    icon: Droplets,
    unit: 'ммоль/л',
  },
  insulin: {
    cardType: 'insulin',
    icon: Syringe,
    unit: 'ЕД',
  },
  medication: {
    cardType: 'medication',
    icon: Pill,
    unit: '',
  },
  note: {
    cardType: 'note',
    icon: StickyNote,
    unit: '',
  },
  nutrition: {
    cardType: 'nutrition',
    icon: CookingPot,
    unit: 'г углеводов',
  },
};

function removeUnit(value: string, unit: string): string {
  if (unit.length === 0) {
    return value;
  }

  const suffix = ` ${unit}`;

  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

export function mapTimelineEventToCard(
  event: TimelineEvent,
): TimelineEventCardProps {
  const mapping = eventMappings[event.kind];
  const unit = event.unit ?? mapping.unit;

  return {
    context: event.context,
    icon: createElement(mapping.icon, {
      'aria-hidden': true,
      size: 15,
    }),
    time: formatTimelineDisplayTime(event.dateTime),
    title: event.title,
    type: mapping.cardType,
    unit,
    value: removeUnit(event.value, unit),
  };
}
