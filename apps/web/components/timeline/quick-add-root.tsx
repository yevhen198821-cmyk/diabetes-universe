'use client';

import { QuickAddPanel } from '@diabetes-universe/ui';
import { useState } from 'react';

import { quickAddActions } from '../../lib/quick-add/actions';
import { FloatingActionButton } from './floating-action-button';

export function QuickAddRoot() {
  const [open, setOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedActionId(null);
  };

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
      />
    </>
  );
}
