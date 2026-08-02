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
import { haptics, QuickAddPanel } from '@diabetes-universe/ui';
import type { ReactNode, RefObject } from 'react';
import { useRef, useState } from 'react';

import { quickAddActions } from '../../lib/quick-add/actions';
import type { QuickAddCloseReason } from '../../lib/quick-add/quick-add-controller-model';
import { ActivityQuickAddForm } from './activity-quick-add-form';
import { GlucoseQuickAddForm } from './glucose-quick-add-form';
import { InsulinQuickAddForm } from './insulin-quick-add-form';
import { MedicationQuickAddForm } from './medication-quick-add-form';
import { NoteQuickAddForm } from './note-quick-add-form';
import { NutritionQuickAddForm } from './nutrition-quick-add-form';
import { FloatingActionButton } from '../timeline/floating-action-button';

export interface QuickAddHostProps {
  readonly floatingActionButtonClassName?: string;
  readonly floatingActionButtonRef?: RefObject<HTMLButtonElement | null>;
  readonly onActivitySubmit?: (entry: ActivityQuickAddEntry) => void;
  readonly onClosed?: (reason: QuickAddCloseReason) => void;
  readonly onGlucoseSubmit?: (entry: GlucoseQuickAddEntry) => void;
  readonly onInsulinSubmit?: (entry: InsulinQuickAddEntry) => void;
  readonly onMedicationSubmit?: (entry: MedicationQuickAddEntry) => void;
  readonly onNoteSubmit?: (entry: NoteQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRequestOpen?: () => void;
  readonly open: boolean;
  readonly openCategory?: QuickAddCategory | null;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly showFloatingActionButton?: boolean;
}

export function QuickAddHost({
  floatingActionButtonClassName,
  floatingActionButtonRef,
  onActivitySubmit,
  onClosed,
  onGlucoseSubmit,
  onInsulinSubmit,
  onMedicationSubmit,
  onNoteSubmit,
  onNutritionSubmit,
  onOpenChange,
  onRequestOpen,
  open,
  openCategory = null,
  returnFocusRef,
  showFloatingActionButton = false,
}: QuickAddHostProps) {
  const [userSelection, setUserSelection] = useState<string | null | undefined>(
    undefined,
  );
  const internalFabRef = useRef<HTMLButtonElement>(null);
  const fabRef = floatingActionButtonRef ?? internalFabRef;
  const selectedActionId = open
    ? userSelection === undefined
      ? openCategory
      : userSelection
    : null;

  const resetSelection = () => {
    setUserSelection(undefined);
  };

  const closeQuickAdd = (reason: QuickAddCloseReason) => {
    onOpenChange(false);
    resetSelection();
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

  const handleActivitySubmit = (entry: ActivityQuickAddEntry) => {
    onActivitySubmit?.(entry);
    haptics.success();
    closeQuickAdd('success');
  };

  const handleNoteSubmit = (entry: NoteQuickAddEntry) => {
    onNoteSubmit?.(entry);
    haptics.success();
    closeQuickAdd('success');
  };

  let selectedContent: ReactNode;

  if (selectedActionId === 'glucose' && onGlucoseSubmit) {
    selectedContent = (
      <GlucoseQuickAddForm
        onCancel={() => setUserSelection(null)}
        onSubmit={handleGlucoseSubmit}
      />
    );
  }

  if (selectedActionId === 'insulin' && onInsulinSubmit) {
    selectedContent = (
      <InsulinQuickAddForm
        onCancel={() => setUserSelection(null)}
        onSubmit={handleInsulinSubmit}
      />
    );
  }

  if (selectedActionId === 'nutrition' && onNutritionSubmit) {
    selectedContent = (
      <NutritionQuickAddForm
        onCancel={() => setUserSelection(null)}
        onSubmit={handleNutritionSubmit}
      />
    );
  }

  if (selectedActionId === 'medication' && onMedicationSubmit) {
    selectedContent = (
      <MedicationQuickAddForm
        onCancel={() => setUserSelection(null)}
        onSubmit={handleMedicationSubmit}
      />
    );
  }

  if (selectedActionId === 'activity' && onActivitySubmit) {
    selectedContent = (
      <ActivityQuickAddForm
        onCancel={() => setUserSelection(null)}
        onSubmit={handleActivitySubmit}
      />
    );
  }

  if (selectedActionId === 'note' && onNoteSubmit) {
    selectedContent = (
      <NoteQuickAddForm
        onCancel={() => setUserSelection(null)}
        onSubmit={handleNoteSubmit}
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
        onBack={() => setUserSelection(null)}
        onClose={() => closeQuickAdd('dismiss')}
        onSelectAction={(actionId) => setUserSelection(actionId)}
        open={open}
        selectedActionId={selectedActionId}
        selectedContent={selectedContent}
      />
    </>
  );
}
