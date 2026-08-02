import type { EventCardProps } from '@diabetes-universe/ui';
import { Activity, CookingPot, Pill, Syringe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

import type { DashboardRecentEventCard } from './dashboard-recent-events-model';

type DashboardRecentEventCardProps = Omit<EventCardProps, 'onClick' | 'variant'>;

const categoryIcons: Record<DashboardRecentEventCard['category'], LucideIcon> = {
  activity: Activity,
  insulin: Syringe,
  medication: Pill,
  nutrition: CookingPot,
};

export function mapDashboardRecentEventToCard(
  event: DashboardRecentEventCard,
): DashboardRecentEventCardProps {
  const Icon = categoryIcons[event.category];

  return {
    context: event.context,
    icon: createElement(Icon, {
      'aria-hidden': true,
      size: 15,
    }),
    subtitle: event.categoryLabel,
    time: event.displayTime,
    title: event.title,
    type: event.cardType,
    unit: event.unit,
    value: event.value,
  };
}
