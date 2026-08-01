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
  readonly onClose: () => void;
  readonly onSelectAction: (actionId: string) => void;
  readonly onBack: () => void;
}
