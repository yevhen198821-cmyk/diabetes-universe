import assert from 'node:assert/strict';
import test from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import {
  DiabetesSettingsProvider,
  useDiabetesSettings,
} from './diabetes-settings-provider.tsx';

const initial = {
  configured: true,
  settingsId: 'settings-a',
  subjectId: 'subject-a',
  glucoseDisplayUnit: 'mmol_per_l',
  diabetesType: { category: 'unknown', source: 'self_reported' },
  createdAt: null,
  updatedAt: null,
  revision: 'revision-1',
};

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function withProvider(fetchImpl, run) {
  setupIntegrationDom();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let value;
  function Probe() {
    value = useDiabetesSettings();
    return null;
  }
  try {
    await act(async () => {
      root.render(
        createElement(DiabetesSettingsProvider, null, createElement(Probe)),
      );
    });
    assert.equal(value.loadState, 'ready');
    await run(() => value);
  } finally {
    await act(async () => root.unmount());
    globalThis.fetch = originalFetch;
    teardownIntegrationDom();
  }
}

function server() {
  let resource = { ...initial };
  const patches = [];
  return {
    get resource() {
      return resource;
    },
    set resource(next) {
      resource = next;
    },
    patches,
    async fetch(_url, options) {
      if (options.method === 'GET') return Response.json(resource);
      patches.push(options);
      if (options.headers['If-Match'] !== resource.revision) {
        return Response.json(
          { error: { code: 'REVISION_CONFLICT' } },
          { status: 412 },
        );
      }
      resource = {
        ...resource,
        ...JSON.parse(options.body),
        revision: `revision-${patches.length + 1}`,
      };
      return Response.json(resource);
    },
  };
}

test('same-tick unit and type edits use consecutive server revisions', async () => {
  const api = server();
  const firstWrite = deferred();
  await withProvider(
    async (url, options) => {
      if (options.method === 'PATCH' && api.patches.length === 0)
        await firstWrite.promise;
      return api.fetch(url, options);
    },
    async (read) => {
      await act(async () => {
        const unit = read().patchGlucoseDisplayUnit('mg_per_dl');
        const type = read().patchSettings({
          diabetesType: { category: 'type_2', source: 'self_reported' },
        });
        await Promise.resolve();
        assert.equal(api.patches.length, 0);
        firstWrite.resolve();
        await Promise.all([unit, type]);
      });
      assert.deepEqual(
        api.patches.map((request) => request.headers['If-Match']),
        ['revision-1', 'revision-2'],
      );
      assert.equal(read().settings.glucoseDisplayUnit, 'mg_per_dl');
      assert.equal(read().settings.diabetesType.category, 'type_2');
      assert.equal(read().settings.revision, 'revision-3');
    },
  );
});

test('a delayed pre-mutation refresh cannot restore an obsolete revision', async () => {
  const api = server();
  const oldRead = deferred();
  let gets = 0;
  await withProvider(
    (url, options) => {
      if (options.method === 'GET' && ++gets === 2) return oldRead.promise;
      return api.fetch(url, options);
    },
    async (read) => {
      let refresh;
      await act(async () => {
        refresh = read().refresh();
      });
      await act(async () => {
        await read().patchGlucoseDisplayUnit('mg_per_dl');
      });
      await act(async () => {
        oldRead.resolve(Response.json(initial));
        await refresh;
      });
      assert.equal(read().settings.revision, 'revision-2');
      assert.equal(read().settings.glucoseDisplayUnit, 'mg_per_dl');
      assert.equal(read().loadState, 'ready');
    },
  );
});

test('remote conflicts are not retried and the queue works after explicit refresh', async () => {
  const api = server();
  await withProvider(api.fetch, async (read) => {
    api.resource = {
      ...initial,
      diabetesType: { category: 'type_2', source: 'self_reported' },
      revision: 'remote-revision',
    };
    await act(async () => {
      await assert.rejects(read().patchGlucoseDisplayUnit('mg_per_dl'), {
        kind: 'revision_conflict',
      });
    });
    assert.equal(api.patches.length, 1);
    assert.equal(api.resource.glucoseDisplayUnit, 'mmol_per_l');
    await act(async () => {
      await read().refresh();
    });
    await act(async () => {
      await read().patchGlucoseDisplayUnit('mg_per_dl');
    });
    assert.equal(api.patches[1].headers['If-Match'], 'remote-revision');
    assert.equal(read().settings.diabetesType.category, 'type_2');
  });
});

test('queued edits cannot move to a different loaded subject', async () => {
  const api = server();
  await withProvider(api.fetch, async (read) => {
    await act(async () => {
      const pending = read().patchGlucoseDisplayUnit('mg_per_dl');
      read().updateSettingsFromMutation({ ...initial, subjectId: 'subject-b' });
      await assert.rejects(pending, { kind: 'unauthorized' });
    });
    assert.equal(api.patches.length, 0);
    assert.equal(read().settings.subjectId, 'subject-b');
  });
});
