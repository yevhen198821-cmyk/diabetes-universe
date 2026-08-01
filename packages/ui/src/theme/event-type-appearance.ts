import type { EventCardType } from '../components/event-card/EventCard.types';

export interface EventTypeAppearance {
  readonly accent: string;
  readonly fallbackIcon: string;
}

export const eventTypeAppearances: Record<EventCardType, EventTypeAppearance> =
  {
    glucose: {
      accent: 'bg-sky-500/10 text-sky-600',
      fallbackIcon: 'G',
    },
    insulin: {
      accent: 'bg-rose-500/10 text-rose-600',
      fallbackIcon: 'I',
    },
    nutrition: {
      accent: 'bg-amber-500/10 text-amber-600',
      fallbackIcon: 'N',
    },
    activity: {
      accent: 'bg-emerald-500/10 text-emerald-600',
      fallbackIcon: 'A',
    },
    medication: {
      accent: 'bg-violet-500/10 text-violet-600',
      fallbackIcon: 'M',
    },
    reminder: {
      accent: 'bg-orange-500/10 text-orange-600',
      fallbackIcon: 'R',
    },
    note: {
      accent: 'bg-slate-500/10 text-slate-600',
      fallbackIcon: 'N',
    },
    ai_insight: {
      accent: 'bg-teal-500/10 text-teal-700',
      fallbackIcon: 'AI',
    },
  };
