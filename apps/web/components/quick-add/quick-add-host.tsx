'use client';

import type {
  ActivityQuickAddEntry,
  MedicationQuickAddEntry,
  NoteQuickAddEntry,
  NutritionQuickAddEntry,
  QuickAddCategory,
} from '@diabetes-universe/types';
import { haptics, QuickAddPanel } from '@diabetes-universe/ui';
import type { ReactNode, RefObject } from 'react';
import { useRef, useState } from 'react';

import { quickAddActions } from '../../lib/quick-add/actions';
import type { GlucoseQuickAddSubmitRequest } from '../../lib/quick-add/glucose-quick-add-submit';
import { canDismissQuickAddWhileSubmitPending } from '../../lib/quick-add/quick-add-submit-identity-model';
import type { InsulinQuickAddSubmitRequest } from '../../lib/quick-add/insulin-quick-add-submit';
import type { QuickAddCloseReason } from '../../lib/quick-add/quick-add-controller-model';
import {
  finalizeGlucoseQuickAddSubmit,
  finalizeQuickAddSubmit,
  shouldCloseQuickAddOnFormCancel,
} from '../../lib/quick-add/quick-add-host-model';
import {
  resolveQuickAddReturnFocusTarget,
  scheduleQuickAddReturnFocus,
  type QuickAddReturnFocusContext,
} from '../../lib/quick-add/resolve-quick-add-return-focus-target';
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
  readonly onGlucoseSubmit?: (
    request: GlucoseQuickAddSubmitRequest,
  ) => Promise<void>;
  readonly onInsulinSubmit?: (
    request: InsulinQuickAddSubmitRequest,
  ) => Promise<void>;
  readonly onMedicationSubmit?: (entry: MedicationQuickAddEntry) => void;
  readonly onNoteSubmit?: (entry: NoteQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRequestOpen?: () => void;
  readonly open: boolean;
  readonly openCategory?: QuickAddCategory | null;
  readonly resolveReturnFocusContext?: (
    reason: QuickAddCloseReason,
  ) => QuickAddReturnFocusContext;
  readonly returnFocusRef?: RefObject<HTMLElement | null>;
  readonly showFloatingActionButton?: boolean;
}

function shouldCloseOnFormCancel(
  openCategory: QuickAddCategory | null | undefined,
  userSelection: string | null | undefined,
): boolean {
  return shouldCloseQuickAddOnFormCancel(openCategory, userSelection);
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
  resolveReturnFocusContext,
  returnFocusRef,
  showFloatingActionButton = false,
}: QuickAddHostProps) {
  const [userSelection, setUserSelection] = useState<string | null | undefined>(
    undefined,
  );
  const internalFabRef = useRef<HTMLButtonElement>(null);
  const glucoseValueInputRef = useRef<HTMLInputElement>(null);
  const asyncSubmitPendingRef = useRef(false);
  const [isAsyncSubmitPending, setIsAsyncSubmitPending] = useState(false);
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
    if (!canDismissQuickAddWhileSubmitPending(asyncSubmitPendingRef.current)) {
      return;
    }

    onOpenChange(false);
    resetSelection();
    onClosed?.(reason);

    scheduleQuickAddReturnFocus(
      () => {
        if (resolveReturnFocusContext) {
          return resolveQuickAddReturnFocusTarget(
            resolveReturnFocusContext(reason),
          );
        }

        if (returnFocusRef?.current?.isConnected) {
          return returnFocusRef.current;
        }

        if (fabRef.current?.isConnected) {
          return fabRef.current;
        }

        return null;
      },
      resolveReturnFocusContext ? 8 : 3,
    );
  };

  const handleFormCancel = () => {
    if (!canDismissQuickAddWhileSubmitPending(asyncSubmitPendingRef.current)) {
      return;
    }

    if (shouldCloseOnFormCancel(openCategory, userSelection)) {
      closeQuickAdd('cancel');
      return;
    }

    setUserSelection(null);
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

  const releaseAsyncSubmitPending = () => {
    asyncSubmitPendingRef.current = false;
    setIsAsyncSubmitPending(false);
  };

  const handleAsyncSubmittingChange = (pending: boolean) => {
    asyncSubmitPendingRef.current = pending;
    setIsAsyncSubmitPending(pending);
  };

  const handleGlucoseSubmit = async (request: GlucoseQuickAddSubmitRequest) => {
    const didPersist = await finalizeGlucoseQuickAddSubmit(
      onGlucoseSubmit,
      request,
    );

    if (!didPersist) {
      return;
    }

    releaseAsyncSubmitPending();
    haptics.success();
    closeQuickAdd('success');
  };

  const handleInsulinSubmit = async (request: InsulinQuickAddSubmitRequest) => {
    const didPersist = await finalizeQuickAddSubmit(onInsulinSubmit, request);

    if (!didPersist) {
      return;
    }

    releaseAsyncSubmitPending();
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
  let initialFocusRef: RefObject<HTMLElement | null> | undefined;

  if (selectedActionId === 'glucose' && onGlucoseSubmit) {
    initialFocusRef = glucoseValueInputRef;
    selectedContent = (
      <GlucoseQuickAddForm
        initialFocusRef={glucoseValueInputRef}
        onCancel={handleFormCancel}
        onSubmit={handleGlucoseSubmit}
        onSubmittingChange={handleAsyncSubmittingChange}
      />
    );
  }

  if (selectedActionId === 'insulin' && onInsulinSubmit) {
    selectedContent = (
      <InsulinQuickAddForm
        onCancel={handleFormCancel}
        onSubmit={handleInsulinSubmit}
        onSubmittingChange={handleAsyncSubmittingChange}
      />
    );
  }

  if (selectedActionId === 'nutrition' && onNutritionSubmit) {
    selectedContent = (
      <NutritionQuickAddForm
        onCancel={handleFormCancel}
        onSubmit={handleNutritionSubmit}
      />
    );
  }

  if (selectedActionId === 'medication' && onMedicationSubmit) {
    selectedContent = (
      <MedicationQuickAddForm
        onCancel={handleFormCancel}
        onSubmit={handleMedicationSubmit}
      />
    );
  }

  if (selectedActionId === 'activity' && onActivitySubmit) {
    selectedContent = (
      <ActivityQuickAddForm
        onCancel={handleFormCancel}
        onSubmit={handleActivitySubmit}
      />
    );
  }

  if (selectedActionId === 'note' && onNoteSubmit) {
    selectedContent = (
      <NoteQuickAddForm
        onCancel={handleFormCancel}
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
        dismissDisabled={isAsyncSubmitPending}
        initialFocusRef={initialFocusRef}
        onBack={handleFormCancel}
        onClose={() => closeQuickAdd('dismiss')}
        onSelectAction={(actionId) => setUserSelection(actionId)}
        open={open}
        selectedActionId={selectedActionId}
        selectedContent={selectedContent}
      />
    </>
  );
}
