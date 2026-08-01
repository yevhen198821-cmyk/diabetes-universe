'use client';

import type {
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  NutritionQuickAddEntry,
} from '@diabetes-universe/types';
import { haptics, QuickAddPanel } from '@diabetes-universe/ui';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import { GlucoseQuickAddForm } from '../quick-add/glucose-quick-add-form';
import { InsulinQuickAddForm } from '../quick-add/insulin-quick-add-form';
import { NutritionQuickAddForm } from '../quick-add/nutrition-quick-add-form';
import { quickAddActions } from '../../lib/quick-add/actions';
import { FloatingActionButton } from './floating-action-button';

interface QuickAddRootProps {
  readonly onGlucoseSubmit?: (entry: GlucoseQuickAddEntry) => void;
  readonly onInsulinSubmit?: (entry: InsulinQuickAddEntry) => void;
  readonly onNutritionSubmit?: (entry: NutritionQuickAddEntry) => void;
}

export function QuickAddRoot({
  onGlucoseSubmit,
  onInsulinSubmit,
  onNutritionSubmit,
}: QuickAddRootProps) {
  const [open, setOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedActionId(null);
  };

  const handleGlucoseSubmit = (entry: GlucoseQuickAddEntry) => {
    onGlucoseSubmit?.(entry);
    handleClose();
  };

  const handleGlucoseCancel = () => {
    setSelectedActionId(null);
  };

  const handleInsulinSubmit = (entry: InsulinQuickAddEntry) => {
    onInsulinSubmit?.(entry);
    haptics.success();
    handleClose();
    requestAnimationFrame(() => {
      fabRef.current?.focus();
    });
  };

  const handleInsulinCancel = () => {
    setSelectedActionId(null);
  };

  const handleNutritionSubmit = (entry: NutritionQuickAddEntry) => {
    onNutritionSubmit?.(entry);
    haptics.success();
    handleClose();
    requestAnimationFrame(() => {
      fabRef.current?.focus();
    });
  };

  const handleNutritionCancel = () => {
    setSelectedActionId(null);
  };

  let selectedContent: ReactNode;

  if (selectedActionId === 'glucose' && onGlucoseSubmit) {
    selectedContent = (
      <GlucoseQuickAddForm
        onCancel={handleGlucoseCancel}
        onSubmit={handleGlucoseSubmit}
      />
    );
  }

  if (selectedActionId === 'insulin' && onInsulinSubmit) {
    selectedContent = (
      <InsulinQuickAddForm
        onCancel={handleInsulinCancel}
        onSubmit={handleInsulinSubmit}
      />
    );
  }

  if (selectedActionId === 'nutrition' && onNutritionSubmit) {
    selectedContent = (
      <NutritionQuickAddForm
        onCancel={handleNutritionCancel}
        onSubmit={handleNutritionSubmit}
      />
    );
  }

  return (
    <>
      {!open ? (
        <FloatingActionButton onClick={handleOpen} ref={fabRef} />
      ) : null}
      <QuickAddPanel
        actions={quickAddActions}
        onBack={() => setSelectedActionId(null)}
        onClose={handleClose}
        onSelectAction={setSelectedActionId}
        open={open}
        selectedActionId={selectedActionId}
        selectedContent={selectedContent}
      />
    </>
  );
}
