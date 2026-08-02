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
  readonly onGlucoseSubmit?: (entry: GlucoseQuickAddEntry) => void;
  readonly onInsulinSubmit?: (entry: InsulinQuickAddEntry) => void;
  readonly onMedicationSubmit?: (entry: MedicationQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
}

export function QuickAddRoot({
  onGlucoseSubmit,
  onInsulinSubmit,
  onMedicationSubmit,
  onNutritionSubmit,
}: QuickAddRootProps) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  return (
    <QuickAddHost
      floatingActionButtonClassName="timeline-fab right-4 sm:right-6"
      floatingActionButtonRef={fabRef}
      onGlucoseSubmit={onGlucoseSubmit}
      onInsulinSubmit={onInsulinSubmit}
      onMedicationSubmit={onMedicationSubmit}
      onNutritionSubmit={onNutritionSubmit}
      onOpenChange={setOpen}
      open={open}
      returnFocusRef={fabRef}
      showFloatingActionButton
    />
  );
}
