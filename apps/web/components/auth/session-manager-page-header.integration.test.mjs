import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { SessionManagerPageHeader } from './session-manager-page-header.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const sessionsPageSource = readFileSync(
  join(currentDirectory, '../../app/account/security/sessions/page.tsx'),
  'utf8',
);
const sessionManagerSource = readFileSync(
  join(currentDirectory, 'session-manager.tsx'),
  'utf8',
);

after(() => {
  teardownIntegrationDom();
});

test('sessions route uses localized Active sessions as the sole page h1 for en-GB', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(SessionManagerPageHeader),
      ),
    );
  });

  try {
    const heading = document.querySelector('h1');
    const backLink = document.querySelector('header a');

    assert.equal(heading?.textContent, 'Active sessions');
    assert.equal(backLink?.textContent, '← Sign-in security');
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.doesNotMatch(sessionsPageSource, /<h1[\s>][^<]*Безопасность входа/);
    assert.doesNotMatch(sessionManagerSource, /<h2[^>]*>\s*\{labels\.title\}/);
    assert.doesNotMatch(heading?.textContent ?? '', /Активные сессии/);
    assert.doesNotMatch(backLink?.textContent ?? '', /Безопасность/);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('SessionManagerPageHeader renders coherent Russian labels for ru-RU without English mix', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
  });

  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(SessionManagerPageHeader),
      ),
    );
  });

  try {
    const heading = document.querySelector('h1');
    const backLink = document.querySelector('header a');

    assert.equal(heading?.textContent, 'Активные сессии');
    assert.equal(backLink?.textContent, '← Безопасность входа');
    assert.doesNotMatch(heading?.textContent ?? '', /Active sessions/);
    assert.doesNotMatch(backLink?.textContent ?? '', /Sign-in security/);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});
