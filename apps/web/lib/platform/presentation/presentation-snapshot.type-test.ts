import type { PresentationSnapshot } from './presentation-snapshot';
import { asLocaleCode } from '../platform-type-helpers';

const snapshot: PresentationSnapshot = {
  version: 1,
  language: 'en' as PresentationSnapshot['language'],
  locale: asLocaleCode('en-GB'),
  timeZone: 'Europe/London',
  hourCycle: 'h23',
};

void snapshot;

const invalidVersion: PresentationSnapshot = {
  // @ts-expect-error snapshot version must be literal 1
  version: 2,
  language: 'en' as PresentationSnapshot['language'],
  locale: asLocaleCode('en-GB'),
  timeZone: 'Europe/London',
  hourCycle: 'h23',
};

void invalidVersion;
