'use client';

import type {
  ActivityQuickAddEntry,
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  NoteQuickAddEntry,
  NutritionQuickAddEntry,
  QuickAddCategory,
} from '@diabetes-universe/types';
import { useRef, useState } from 'react';

import { QuickAddHost } from '../quick-add/quick-add-host';

interface QuickAddRootProps {
  readonly onOpenChange?: (open: boolean) => void;
  readonly onActivitySubmit?: (entry: ActivityQuickAddEntry) => void;
  readonly onGlucoseSubmit?: (entry: GlucoseQuickAddEntry) => void;
  readonly onInsulinSubmit?: (entry: InsulinQuickAddEntry) => void;
  readonly onMedicationSubmit?: (entry: MedicationQuickAddEntry) => void;
  readonly onNoteSubmit?: (entry: NoteQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
  readonly open?: boolean;
  readonly openCategory?: QuickAddCategory | null;
}

export function QuickAddRoot({
  onOpenChange,
  onActivitySubmit,
  onGlucoseSubmit,
  onInsulinSubmit,
  onMedicationSubmit,
  onNoteSubmit,
  onNutritionSubmit,
  open,
  openCategory,
}: QuickAddRootProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <QuickAddHost
      floatingActionButtonClassName="timeline-fab right-4 sm:right-6"
      floatingActionButtonRef={fabRef}
      onActivitySubmit={onActivitySubmit}
      onGlucoseSubmit={onGlucoseSubmit}
      onInsulinSubmit={onInsulinSubmit}
      onMedicationSubmit={onMedicationSubmit}
      onNoteSubmit={onNoteSubmit}
      onNutritionSubmit={onNutritionSubmit}
      onOpenChange={setOpen}
      open={isOpen}
      openCategory={openCategory}
      returnFocusRef={fabRef}
      showFloatingActionButton
    />
  );
}
