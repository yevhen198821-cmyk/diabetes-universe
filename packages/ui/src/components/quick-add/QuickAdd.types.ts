import type { ReactNode, RefObject } from 'react';

import type { EventCardType } from '../event-card/EventCard.types';

export interface QuickAddActionItem {
  readonly id: string;
  readonly category: EventCardType;
  readonly label: string;
  readonly addTitle: string;
  readonly description: string;
  readonly icon: ReactNode;
}

export interface QuickAddPanelProps {
  readonly open: boolean;
  readonly actions: readonly QuickAddActionItem[];
  readonly selectedActionId: string | null;
  readonly selectedContent?: ReactNode;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly onSelectAction: (actionId: string) => void;
  readonly onBack: () => void;
}

export interface QuickAddOptionItem<TValue extends string = string> {
  readonly value: TValue;
  readonly label: string;
  readonly description?: string;
}

export type QuickAddOption<TValue extends string = string> =
  TValue | QuickAddOptionItem<TValue>;

export interface QuickAddOptionGroup<TValue extends string = string> {
  readonly label?: string;
  readonly options: readonly QuickAddOption<TValue>[];
}

export interface QuickAddOptionSheetProps<TValue extends string = string> {
  readonly groups?: readonly QuickAddOptionGroup<TValue>[];
  readonly onClose: () => void;
  readonly onSelect: (value: TValue) => void;
  readonly options?: readonly QuickAddOption<TValue>[];
  readonly selectedValue?: TValue;
  readonly title: string;
}
