import assert from 'node:assert/strict';
import test from 'node:test';

import { createPresentationSnapshot } from '../create-presentation-snapshot.ts';
import { asLocaleCode } from '../../platform-type-helpers.ts';

/** @type {import('../presentation-persistence.ts').PresentationPersistence} */
const persistenceContract = {
  async read() {
    return null;
  },
  async write(snapshot) {
    assert.equal(snapshot.version, 1);
  },
};

test('PresentationPersistence is a compile-time contract without browser globals', async () => {
  const snapshot = createPresentationSnapshot({
    language: 'en',
    locale: asLocaleCode('en-GB'),
    timeZone: 'Europe/London',
    hourCycle: 'h23',
  });

  await persistenceContract.write(snapshot);
  assert.equal(await persistenceContract.read(), null);
});
