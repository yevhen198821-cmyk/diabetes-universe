import type {
  TimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';
import type { EventCardProps, EventCardType } from '@diabetes-universe/ui';
import { Activity, CookingPot, Droplets, Syringe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

type TimelineEventCardProps = Omit<EventCardProps, 'onClick' | 'variant'>;

interface EventMapping {
  readonly cardType: EventCardType;
  readonly icon: LucideIcon;
  readonly unit: string;
}

const eventMappings: Record<TimelineEventKind, EventMapping> = {
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
  meal: {
    cardType: 'nutrition',
    icon: CookingPot,
    unit: 'г углеводов',
  },
  activity: {
    cardType: 'activity',
    icon: Activity,
    unit: 'минут',
  },
};

function removeUnit(value: string, unit: string): string {
  const suffix = ` ${unit}`;

  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

export function mapTimelineEventToCard(
  event: TimelineEvent,
): TimelineEventCardProps {
  const mapping = eventMappings[event.kind];

  return {
    context: event.context,
    icon: createElement(mapping.icon, {
      'aria-hidden': true,
      size: 15,
    }),
    time: event.time,
    title: event.title,
    type: mapping.cardType,
    unit: mapping.unit,
    value: removeUnit(event.value, mapping.unit),
  };
}
