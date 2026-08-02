import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBrowserTimeZone } from '../resolve-browser-time-zone.ts';

function withMockedWindow(run, options) {
  const originalWindow = globalThis.window;
  const originalIntl = globalThis.Intl;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });

  if ('intl' in options) {
    if (options.intl === undefined) {
      delete globalThis.Intl;
    } else {
      Object.defineProperty(globalThis, 'Intl', {
        configurable: true,
        value: options.intl,
      });
    }
  }

  try {
    return run();
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }

    Object.defineProperty(globalThis, 'Intl', {
      configurable: true,
      value: originalIntl,
    });
  }
}

test('resolveBrowserTimeZone returns resolved for a valid browser IANA zone', () => {
  withMockedWindow(
    () => {
      const result = resolveBrowserTimeZone();

      assert.deepEqual(result, {
        status: 'resolved',
        timeZone: 'America/Los_Angeles',
      });
    },
    {
      intl: {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: 'America/Los_Angeles' }),
        }),
      },
    },
  );
});

test('resolveBrowserTimeZone returns unavailable when Intl is missing', () => {
  withMockedWindow(
    () => {
      assert.deepEqual(resolveBrowserTimeZone(), { status: 'unavailable' });
    },
    { intl: undefined },
  );
});

test('resolveBrowserTimeZone returns unavailable for an empty time zone', () => {
  withMockedWindow(
    () => {
      assert.deepEqual(resolveBrowserTimeZone(), { status: 'unavailable' });
    },
    {
      intl: {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: '' }),
        }),
      },
    },
  );
});

test('resolveBrowserTimeZone returns unavailable for an invalid IANA zone', () => {
  withMockedWindow(
    () => {
      assert.deepEqual(resolveBrowserTimeZone(), { status: 'unavailable' });
    },
    {
      intl: {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: 'Invalid/Zone' }),
        }),
      },
    },
  );
});

test('resolveBrowserTimeZone returns unavailable when Intl throws', () => {
  withMockedWindow(
    () => {
      assert.deepEqual(resolveBrowserTimeZone(), { status: 'unavailable' });
    },
    {
      intl: {
        DateTimeFormat: () => {
          throw new Error('Intl failure');
        },
      },
    },
  );
});

test('resolveBrowserTimeZone does not derive time zone from locale', () => {
  withMockedWindow(
    () => {
      const result = resolveBrowserTimeZone();

      assert.equal(result.status, 'resolved');
      assert.notEqual(result.timeZone, 'en-GB');
    },
    {
      intl: {
        DateTimeFormat: () => ({
          resolvedOptions: () => ({ timeZone: 'Asia/Tokyo', locale: 'en-GB' }),
        }),
      },
    },
  );
});

test('resolveBrowserTimeZone is unavailable on the server', () => {
  const originalWindow = globalThis.window;

  delete globalThis.window;

  try {
    assert.throws(() => resolveBrowserTimeZone(), /client-only/);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  }
});
