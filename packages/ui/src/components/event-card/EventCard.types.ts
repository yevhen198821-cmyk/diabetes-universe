import type { MouseEventHandler, ReactNode } from 'react';

export type EventCardType =
  | 'glucose'
  | 'insulin'
  | 'nutrition'
  | 'activity'
  | 'medication'
  | 'reminder'
  | 'note'
  | 'ai_insight';

export type EventCardVariant = 'compact' | 'standard';

export type EventCardStatus =
  'default' | 'completed' | 'scheduled' | 'missed' | 'error';

export interface EventCardProps {
  readonly ariaLabel?: string;
  readonly type: EventCardType;
  readonly time: string;
  readonly title: string;
  readonly value: string;
  readonly unit: string;
  readonly subtitle?: string;
  readonly context?: string;
  readonly status?: EventCardStatus;
  readonly icon?: ReactNode;
  readonly onClick?: MouseEventHandler<HTMLButtonElement>;
  readonly variant?: EventCardVariant;
}
