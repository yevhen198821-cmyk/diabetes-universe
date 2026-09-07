import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { haptics } from '@diabetes-universe/ui';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import { createTestTimelinePresentationDependencies } from '../../lib/timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { TimelineEventDetail } from './timeline-event-detail.tsx';

const detailSource = readFileSync(
  join(dirname(new URL(import.meta.url).pathname), 'timeline-event-detail.tsx'),
  'utf8',
);
const shellSource = readFileSync(
  join(dirname(new URL(import.meta.url).pathname), 'timeline-shell.tsx'),
  'utf8',
);

after(() => {
  teardownIntegrationDom();
});

const glucoseEvent = {
  concentrationMmolPerL: 6.4,
  context: 'before_meal',
  createdAt: '2026-08-02T05:00:00.000Z',
  id: 'glucose-0800-edit-id',
  kind: 'glucose',
  occurredAt: '2026-08-02T05:00:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:00:00.000Z',
};

const insulinEvent = {
  createdAt: '2026-08-02T05:05:00.000Z',
  doseUnits: 4,
  id: 'insulin-0805-edit-id',
  kind: 'insulin',
  occurredAt: '2026-08-02T05:05:00.000Z',
  preparation: 'NovoRapid',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

test('timeline delete always awaits durable deleteEventAsync', () => {
  assert.match(shellSource, /await deleteEventAsync\(eventId\)/);
  assert.doesNotMatch(
    shellSource,
    /deleteEvent\(eventId\);\s*setSelectedEventId\(null\)/,
  );
});

test('timeline event detail awaits onDelete before success haptic or dialog close', () => {
  assert.match(
    detailSource,
    /try \{\s*await onDelete\(event\.id\);\s*setDeleteOpen\(false\);\s*haptics\.success\(\);/,
  );
  assert.match(
    detailSource,
    /setDeleteError\(uiLabels\.detail\.deleteConfirm\.deleteErrorDescription\)/,
  );
});

test('timeline edit save always awaits durable updateEventAsync', () => {
  assert.match(shellSource, /await updateEventAsync\(updatedEvent\)/);
  assert.doesNotMatch(
    shellSource,
    /if \(updatedEvent\.kind === 'nutrition'\)[\s\S]*updateEventAsync[\s\S]*updateEvent\(/,
  );
});

test('timeline event detail awaits onUpdate before success haptic or view mode', () => {
  assert.match(
    detailSource,
    /try \{\s*await onUpdate\(result\.event\);\s*onModeChange\('view'\);\s*haptics\.success\(\);/,
  );
  assert.match(
    detailSource,
    /setSaveError\(uiLabels\.detail\.form\.saveErrorDescription\)/,
  );
  assert.match(detailSource, /role="alert"/);
  assert.match(detailSource, /role="status"/);
});

async function renderDetail({ event, onUpdate }) {
  setupIntegrationDom();

  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });
  const presentationDependencies =
    await createTestTimelinePresentationDependencies({
      request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
    });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let mode = 'edit';
  const updates = [];
  let hapticCount = 0;
  const originalSuccess = haptics.success;
  haptics.success = () => {
    hapticCount += 1;
  };

  const render = async () => {
    await act(async () => {
      root.render(
        createElement(
          TestPlatformProvider,
          { runtime },
          createElement(TimelineEventDetail, {
            event,
            mode,
            onClose: () => {},
            onDelete: () => {},
            onModeChange: (nextMode) => {
              mode = nextMode;
            },
            onUpdate: async (updated) => {
              updates.push(updated);
              await onUpdate(updated);
            },
            presentationDependencies,
          }),
        ),
      );
    });
  };

  await render();

  return {
    get hapticCount() {
      return hapticCount;
    },
    get mode() {
      return mode;
    },
    get updates() {
      return updates;
    },
    async cleanup() {
      haptics.success = originalSuccess;
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
    async rerender() {
      await render();
    },
    async submit() {
      await act(async () => {
        document
          .querySelector('form')
          ?.dispatchEvent(
            new window.Event('submit', { bubbles: true, cancelable: true }),
          );
      });
      await render();
    },
  };
}

test('glucose edit rejection stays in edit mode, preserves fields, and skips success haptic', async () => {
  const view = await renderDetail({
    event: glucoseEvent,
    onUpdate: async () => {
      throw new Error('write failed');
    },
  });

  try {
    const valueBefore = document.getElementById('timeline-edit-value')?.value;

    await view.submit();

    assert.equal(view.mode, 'edit');
    assert.equal(view.hapticCount, 0);
    assert.equal(
      document.getElementById('timeline-edit-value')?.value,
      valueBefore,
    );
    assert.match(document.body.textContent ?? '', /Could not save/);
    assert.match(
      document.body.textContent ?? '',
      /The event was not saved\. Your values are still in the editor/,
    );
    assert.equal(view.updates[0]?.id, glucoseEvent.id);
    assert.equal(view.updates[0]?.createdAt, glucoseEvent.createdAt);
    assert.equal(view.updates[0]?.kind, 'glucose');
  } finally {
    await view.cleanup();
  }
});

test('insulin edit retry uses the same event id and reports success only after persist', async () => {
  let shouldFail = true;
  const view = await renderDetail({
    event: insulinEvent,
    onUpdate: async () => {
      if (shouldFail) {
        shouldFail = false;
        throw new Error('write failed');
      }
    },
  });

  try {
    await view.submit();
    assert.equal(view.mode, 'edit');
    assert.equal(view.hapticCount, 0);
    assert.equal(view.updates[0]?.id, insulinEvent.id);

    await view.submit();
    assert.equal(view.mode, 'view');
    assert.equal(view.hapticCount, 1);
    assert.equal(view.updates[1]?.id, insulinEvent.id);
    assert.equal(view.updates[1]?.createdAt, insulinEvent.createdAt);
    assert.equal(view.updates[1]?.kind, 'insulin');
  } finally {
    await view.cleanup();
  }
});

const noteEventForDelete = {
  body: 'Delete target note',
  createdAt: '2026-08-02T05:10:00.000Z',
  id: 'note-0810-delete-id',
  kind: 'note',
  occurredAt: '2026-08-02T05:10:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  title: 'Morning',
  updatedAt: '2026-08-02T05:10:00.000Z',
};

async function renderDetailForDelete({ event, onDelete }) {
  setupIntegrationDom();

  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });
  const presentationDependencies =
    await createTestTimelinePresentationDependencies({
      request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
    });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let closed = false;
  const deleteCalls = [];
  let hapticCount = 0;
  const originalSuccess = haptics.success;
  haptics.success = () => {
    hapticCount += 1;
  };

  const findDeleteConfirmationDialog = () =>
    Array.from(document.querySelectorAll('[role="dialog"]')).find((dialog) =>
      dialog.textContent?.includes('Delete event?'),
    ) ?? null;

  const render = async () => {
    await act(async () => {
      root.render(
        createElement(
          TestPlatformProvider,
          { runtime },
          createElement(TimelineEventDetail, {
            event,
            mode: 'view',
            onClose: () => {
              closed = true;
            },
            onDelete: async (eventId) => {
              deleteCalls.push(eventId);
              await onDelete(eventId);
            },
            onModeChange: () => {},
            onUpdate: async () => {},
            presentationDependencies,
          }),
        ),
      );
    });
  };

  const flushAsync = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  await render();

  return {
    get closed() {
      return closed;
    },
    get deleteCalls() {
      return deleteCalls;
    },
    findDeleteConfirmationDialog,
    get hapticCount() {
      return hapticCount;
    },
    async cleanup() {
      haptics.success = originalSuccess;
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
    async confirmDelete() {
      const confirmation = findDeleteConfirmationDialog();
      const deleteButton = Array.from(
        confirmation?.querySelectorAll('button') ?? [],
      ).find((button) => button.textContent === 'Delete');

      await act(async () => {
        deleteButton?.click();
      });
      await flushAsync();
    },
    async openDeleteDialog() {
      const detailDialog = Array.from(
        document.querySelectorAll('[role="dialog"]'),
      ).find((dialog) => dialog.textContent?.includes(event.title));
      const deleteButton = Array.from(
        detailDialog?.querySelectorAll('button') ?? [],
      ).find((button) => button.textContent === 'Delete');

      await act(async () => {
        deleteButton?.click();
      });
      await flushAsync();
    },
    async rerender() {
      await render();
    },
  };
}

test('pending delete keeps confirmation open and locks confirm/cancel controls', async () => {
  let releaseDelete = () => {};
  const pendingDelete = new Promise((resolve) => {
    releaseDelete = resolve;
  });
  const view = await renderDetailForDelete({
    event: noteEventForDelete,
    onDelete: async () => {
      await pendingDelete;
    },
  });

  try {
    await view.openDeleteDialog();
    assert.match(document.body.textContent ?? '', /Delete event\?/);

    await view.confirmDelete();

    assert.match(document.body.textContent ?? '', /Deleting…/);
    assert.equal(view.hapticCount, 0);
    assert.equal(view.closed, false);

    const confirmation = view.findDeleteConfirmationDialog();
    const confirmButton = Array.from(
      confirmation?.querySelectorAll('button') ?? [],
    ).find((button) => button.textContent === 'Delete');
    const cancelButton = Array.from(
      confirmation?.querySelectorAll('button') ?? [],
    ).find((button) => button.textContent === 'Cancel');
    assert.equal(confirmButton?.disabled, true);
    assert.equal(cancelButton?.disabled, true);

    releaseDelete();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    assert.equal(view.hapticCount, 1);
    assert.deepEqual(view.deleteCalls, ['note-0810-delete-id']);
  } finally {
    await view.cleanup();
  }
});

test('delete rejection shows error, skips success haptic, and keeps detail open for retry', async () => {
  let shouldFail = true;
  const view = await renderDetailForDelete({
    event: noteEventForDelete,
    onDelete: async () => {
      if (shouldFail) {
        shouldFail = false;
        throw new Error('delete failed');
      }
    },
  });

  try {
    await view.openDeleteDialog();
    await view.confirmDelete();

    assert.equal(view.hapticCount, 0);
    assert.equal(view.closed, false);
    assert.match(document.body.textContent ?? '', /Could not delete/);
    assert.match(
      document.body.textContent ?? '',
      /The event was not deleted\. Try again\./,
    );
    assert.match(document.body.textContent ?? '', /Delete event\?/);

    await view.confirmDelete();

    assert.equal(view.hapticCount, 1);
    assert.deepEqual(view.deleteCalls, [
      'note-0810-delete-id',
      'note-0810-delete-id',
    ]);
  } finally {
    await view.cleanup();
  }
});

test('double delete confirmation while pending issues only one delete call', async () => {
  let releaseDelete = () => {};
  const pendingDelete = new Promise((resolve) => {
    releaseDelete = resolve;
  });
  const view = await renderDetailForDelete({
    event: noteEventForDelete,
    onDelete: async () => {
      await pendingDelete;
    },
  });

  try {
    await view.openDeleteDialog();
    await view.confirmDelete();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await view.confirmDelete();

    assert.equal(view.deleteCalls.length, 1);

    releaseDelete();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  } finally {
    await view.cleanup();
  }
});
