import type { RequestPlatformBootstrapResult } from '../request-platform-bootstrap-result';
import { asLocaleCode } from '../platform-type-helpers';
import type { CreateClientPresentationBootstrapInput } from './create-client-presentation-context';

declare const serverBootstrap: RequestPlatformBootstrapResult;

const validInput: CreateClientPresentationBootstrapInput = {
  serverBootstrap,
};

void validInput;

const invalidInput: CreateClientPresentationBootstrapInput = {
  serverBootstrap,
  // @ts-expect-error client bootstrap must not accept separate server locale input
  serverLocale: {
    language: 'en',
    locale: asLocaleCode('en-GB'),
    hourCycle: 'h23',
  },
};

void invalidInput;
