import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import * as React from 'react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import test from 'node:test';

import { prepareDashboardAiInsightPresentation } from '../../lib/dashboard/dashboard-ai-insight-presentation.ts';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { DashboardAiInsight } from './dashboard-ai-insight.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const migratedAiInsightSources = [
  'dashboard-ai-insight-model.ts',
  'dashboard-ai-insight.tsx',
  'dashboard-ai-insight-labels.ts',
  '../../lib/dashboard/dashboard-ai-insight-presentation.ts',
];

const sourceInsight = {
  generatedAt: '2026-08-02T07:15:00.000Z',
  id: 'insight-1015',
  relatedEventIds: ['glucose-0800', 'meal-0820'],
  summary:
    'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
  title: 'После завтрака',
};

after(() => {
  teardownIntegrationDom();
});

test('dashboard ai insight renders localized English copy inside platform provider', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const insight = prepareDashboardAiInsightPresentation(sourceInsight, {
    formatDisplayTime: () => '10:15',
    formatRelatedEventsCount: (count) => String(count),
    relatedEventsLabel: 'Related records',
    relatedEventsNone: 'Related records: no confirmed records',
  });

  globalThis.React = React;

  try {
    const html = renderToString(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(DashboardAiInsight, {
          insight,
          state: 'ready',
        }),
      ),
    );

    assert.match(html, /AI insight/);
    assert.match(html, /Automatic explanation/);
    assert.match(html, /Not a diagnosis or treatment prescription\./);
    assert.match(html, /Related records: 2/);
    assert.match(html, /После завтрака/);
    assert.match(html, /10:15/);
    assert.equal(html.includes('ИИ-объяснение'), false);
  } finally {
    delete globalThis.React;
  }
});

test('dashboard ai insight loading state announces localized status', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  globalThis.React = React;

  try {
    const html = renderToString(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(DashboardAiInsight, { state: 'loading' }),
      ),
    );

    assert.match(html, /Loading AI insight/);
    assert.equal(html.includes('Загрузка ИИ-объяснения'), false);
  } finally {
    delete globalThis.React;
  }
});

test('dashboard ai insight empty state uses localized unavailable copy for forbidden content', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const insight = prepareDashboardAiInsightPresentation(
    {
      ...sourceInsight,
      summary: 'Прогноз на завтра выглядит нестабильно.',
    },
    {
      formatDisplayTime: () => '10:15',
      formatRelatedEventsCount: (count) => String(count),
      relatedEventsLabel: 'Related records',
      relatedEventsNone: 'Related records: no confirmed records',
    },
  );

  globalThis.React = React;

  try {
    const html = renderToString(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(DashboardAiInsight, {
          insight,
          state: 'ready',
        }),
      ),
    );

    assert.match(html, /AI insight unavailable\./);
    assert.equal(html.includes('Прогноз на завтра'), false);
  } finally {
    delete globalThis.React;
  }
});

test('migrated dashboard ai insight sources do not import Intl directly', () => {
  setupIntegrationDom();

  for (const relativePath of migratedAiInsightSources) {
    const source = readFileSync(join(currentDirectory, relativePath), 'utf8');

    assert.equal(source.includes('Intl.'), false, relativePath);
  }
});

test('dashboard ai insight view does not call useFormatter', () => {
  const source = readFileSync(
    join(currentDirectory, 'dashboard-ai-insight.tsx'),
    'utf8',
  );

  assert.equal(source.includes('useFormatter'), false);
});
