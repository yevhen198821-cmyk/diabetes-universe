'use client';

import type {
  ActivityQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  NoteQuickAddEntry,
  NutritionQuickAddEntry,
  QuickAddCategory,
} from '@diabetes-universe/types';
import { useRef, useState, type RefObject } from 'react';

import type { GlucoseQuickAddSubmitRequest } from '../../lib/quick-add/glucose-quick-add-submit';
import { QuickAddHost } from '../quick-add/quick-add-host';

interface QuickAddRootProps {
  readonly floatingActionButtonClassName?: string;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onActivitySubmit?: (entry: ActivityQuickAddEntry) => void;
  readonly onGlucoseSubmit?: (
    request: GlucoseQuickAddSubmitRequest,
  ) => Promise<void>;
  readonly onInsulinSubmit?: (entry: InsulinQuickAddEntry) => void;
  readonly onMedicationSubmit?: (entry: MedicationQuickAddEntry) => void;
  readonly onNoteSubmit?: (entry: NoteQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
  readonly open?: boolean;
  readonly openCategory?: QuickAddCategory | null;
  readonly returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

export function QuickAddRoot({
  floatingActionButtonClassName = 'timeline-fab right-[max(1rem,env(safe-area-inset-right))] hidden lg:grid sm:right-[max(1.5rem,env(safe-area-inset-right))]',
  onOpenChange,
  onActivitySubmit,
  onGlucoseSubmit,
  onInsulinSubmit,
  onMedicationSubmit,
  onNoteSubmit,
  onNutritionSubmit,
  open,
  openCategory,
  returnFocusRef: returnFocusRefProp,
}: QuickAddRootProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const desktopFabRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = returnFocusRefProp ?? desktopFabRef;
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <QuickAddHost
      floatingActionButtonClassName={floatingActionButtonClassName}
      floatingActionButtonRef={desktopFabRef}
      onActivitySubmit={onActivitySubmit}
      onGlucoseSubmit={onGlucoseSubmit}
      onInsulinSubmit={onInsulinSubmit}
      onMedicationSubmit={onMedicationSubmit}
      onNoteSubmit={onNoteSubmit}
      onNutritionSubmit={onNutritionSubmit}
      onOpenChange={setOpen}
      open={isOpen}
      openCategory={openCategory}
      returnFocusRef={returnFocusRef}
      showFloatingActionButton
    />
  );
}
