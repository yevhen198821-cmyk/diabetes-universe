'use client';

import type { GlucoseQuickAddEntry } from '@diabetes-universe/types';
import { QuickAddPanel } from '@diabetes-universe/ui';
import { useState } from 'react';

import { GlucoseQuickAddForm } from '../quick-add/glucose-quick-add-form';
import { quickAddActions } from '../../lib/quick-add/actions';
import { FloatingActionButton } from './floating-action-button';

interface QuickAddRootProps {
  readonly onGlucoseSubmit?: (entry: GlucoseQuickAddEntry) => void;
}

export function QuickAddRoot({ onGlucoseSubmit }: QuickAddRootProps) {
  const [open, setOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

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

  const selectedContent =
    selectedActionId === 'glucose' && onGlucoseSubmit ? (
      <GlucoseQuickAddForm onSubmit={handleGlucoseSubmit} />
    ) : undefined;

  return (
    <>
      {!open ? <FloatingActionButton onClick={handleOpen} /> : null}
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
