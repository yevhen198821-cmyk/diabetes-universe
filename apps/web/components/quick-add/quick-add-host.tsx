'use client';

import type {
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  NutritionQuickAddEntry,
} from '@diabetes-universe/types';
import { haptics, QuickAddPanel } from '@diabetes-universe/ui';
import type { ReactNode, RefObject } from 'react';
import { useRef, useState } from 'react';

import { quickAddActions } from '../../lib/quick-add/actions';
import type { QuickAddCloseReason } from '../../lib/quick-add/quick-add-controller-model';
import { GlucoseQuickAddForm } from './glucose-quick-add-form';
import { InsulinQuickAddForm } from './insulin-quick-add-form';
import { MedicationQuickAddForm } from './medication-quick-add-form';
import { NutritionQuickAddForm } from './nutrition-quick-add-form';
import { FloatingActionButton } from '../timeline/floating-action-button';

export interface QuickAddHostProps {
  readonly floatingActionButtonClassName?: string;
  readonly floatingActionButtonRef?: RefObject<HTMLButtonElement | null>;
  readonly onClosed?: (reason: QuickAddCloseReason) => void;
  readonly onGlucoseSubmit?: (entry: GlucoseQuickAddEntry) => void;
  readonly onInsulinSubmit?: (entry: InsulinQuickAddEntry) => void;
  readonly onMedicationSubmit?: (entry: MedicationQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRequestOpen?: () => void;
  readonly open: boolean;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly showFloatingActionButton?: boolean;
}

export function QuickAddHost({
  floatingActionButtonClassName,
  floatingActionButtonRef,
  onClosed,
  onGlucoseSubmit,
  onInsulinSubmit,
  onMedicationSubmit,
  onNutritionSubmit,
  onOpenChange,
  onRequestOpen,
  open,
  returnFocusRef,
  showFloatingActionButton = false,
}: QuickAddHostProps) {
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const internalFabRef = useRef<HTMLButtonElement>(null);
  const fabRef = floatingActionButtonRef ?? internalFabRef;

  const closeQuickAdd = (reason: QuickAddCloseReason) => {
    onOpenChange(false);
    setSelectedActionId(null);
    onClosed?.(reason);

    const focusTarget = returnFocusRef?.current ?? fabRef.current;

    if (focusTarget) {
      requestAnimationFrame(() => {
        focusTarget.focus();
      });
    }
  };

  const handleOpen = () => {
    if (onRequestOpen) {
      onRequestOpen();
      return;
    }

    if (!open) {
      onOpenChange(true);
    }
  };

  const handleGlucoseSubmit = (entry: GlucoseQuickAddEntry) => {
    onGlucoseSubmit?.(entry);
    closeQuickAdd('success');
  };

  const handleInsulinSubmit = (entry: InsulinQuickAddEntry) => {
    onInsulinSubmit?.(entry);
    haptics.success();
    closeQuickAdd('success');
  };

  const handleNutritionSubmit = (entry: NutritionQuickAddEntry) => {
    onNutritionSubmit?.(entry);
    haptics.success();
    closeQuickAdd('success');
  };

  const handleMedicationSubmit = (entry: MedicationQuickAddEntry) => {
    onMedicationSubmit?.(entry);
    haptics.success();
    closeQuickAdd('success');
  };

  let selectedContent: ReactNode;

  if (selectedActionId === 'glucose' && onGlucoseSubmit) {
    selectedContent = (
      <GlucoseQuickAddForm
        onCancel={() => setSelectedActionId(null)}
        onSubmit={handleGlucoseSubmit}
      />
    );
  }

  if (selectedActionId === 'insulin' && onInsulinSubmit) {
    selectedContent = (
      <InsulinQuickAddForm
        onCancel={() => setSelectedActionId(null)}
        onSubmit={handleInsulinSubmit}
      />
    );
  }

  if (selectedActionId === 'nutrition' && onNutritionSubmit) {
    selectedContent = (
      <NutritionQuickAddForm
        onCancel={() => setSelectedActionId(null)}
        onSubmit={handleNutritionSubmit}
      />
    );
  }

  if (selectedActionId === 'medication' && onMedicationSubmit) {
    selectedContent = (
      <MedicationQuickAddForm
        onCancel={() => setSelectedActionId(null)}
        onSubmit={handleMedicationSubmit}
      />
    );
  }

  return (
    <>
      {showFloatingActionButton && !open ? (
        <FloatingActionButton
          className={floatingActionButtonClassName}
          onClick={handleOpen}
          ref={fabRef}
        />
      ) : null}
      <QuickAddPanel
        actions={quickAddActions}
        onBack={() => setSelectedActionId(null)}
        onClose={() => closeQuickAdd('dismiss')}
        onSelectAction={setSelectedActionId}
        open={open}
        selectedActionId={selectedActionId}
        selectedContent={selectedContent}
      />
    </>
  );
}
