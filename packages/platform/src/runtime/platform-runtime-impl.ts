import type { PlatformRuntime } from '../contracts/platform-runtime';
import type { PlatformRuntimeCreateInput } from '../contracts/platform-runtime-create-input';
import { assertInjectedPlatformService } from './validation';

/**
 * Runtime invariants:
 *
 * - PlatformRuntime is immutable after creation.
 * - Holds only injected platform service references.
 * - Contains no business logic.
 * - Does not create Localization or Formatting runtime instances.
 */
export class PlatformRuntimeImpl implements PlatformRuntime {
  readonly localization: PlatformRuntime['localization'];
  readonly formatter: PlatformRuntime['formatter'];

  constructor(input: PlatformRuntimeCreateInput) {
    this.localization = assertInjectedPlatformService(
      input.localization,
      'localization',
    );
    this.formatter = assertInjectedPlatformService(
      input.formatter,
      'formatter',
    );
  }
}
