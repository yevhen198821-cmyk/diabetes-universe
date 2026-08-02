'use client';

import type {
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  NutritionQuickAddEntry,
} from '@diabetes-universe/types';
import { useRef, useState } from 'react';

import { QuickAddHost } from '../quick-add/quick-add-host';

interface QuickAddRootProps {
  readonly onOpenChange?: (open: boolean) => void;
  readonly onGlucoseSubmit?: (entry: GlucoseQuickAddEntry) => void;
  readonly onInsulinSubmit?: (entry: InsulinQuickAddEntry) => void;
  readonly onMedicationSubmit?: (entry: MedicationQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
  readonly open?: boolean;
}

export function QuickAddRoot({
  onOpenChange,
  onGlucoseSubmit,
  onInsulinSubmit,
  onMedicationSubmit,
  onNutritionSubmit,
  open,
}: QuickAddRootProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <QuickAddHost
      floatingActionButtonClassName="timeline-fab right-4 sm:right-6"
      floatingActionButtonRef={fabRef}
      onGlucoseSubmit={onGlucoseSubmit}
      onInsulinSubmit={onInsulinSubmit}
      onMedicationSubmit={onMedicationSubmit}
      onNutritionSubmit={onNutritionSubmit}
      onOpenChange={setOpen}
      open={isOpen}
      returnFocusRef={fabRef}
      showFloatingActionButton
    />
  );
}
