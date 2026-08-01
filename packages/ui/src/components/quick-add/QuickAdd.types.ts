import type { ReactNode } from 'react';

import type { EventCardType } from '../event-card/EventCard.types';

export interface QuickAddActionItem {
  readonly id: string;
  readonly category: EventCardType;
  readonly label: string;
  readonly description: string;
  readonly icon: ReactNode;
}

export interface QuickAddPanelProps {
  readonly open: boolean;
  readonly actions: readonly QuickAddActionItem[];
  readonly selectedActionId: string | null;
  readonly selectedContent?: ReactNode;
  readonly onClose: () => void;
  readonly onSelectAction: (actionId: string) => void;
  readonly onBack: () => void;
}

export interface QuickAddOptionGroup<TValue extends string = string> {
  readonly label?: string;
  readonly options: readonly TValue[];
}

export interface QuickAddOptionSheetProps<TValue extends string = string> {
  readonly groups?: readonly QuickAddOptionGroup<TValue>[];
  readonly onClose: () => void;
  readonly onSelect: (value: TValue) => void;
  readonly options?: readonly TValue[];
  readonly selectedValue?: TValue;
  readonly title: string;
}
