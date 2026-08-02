/**
 * Diabetes Universe Platform Runtime Foundation contracts and runtime.
 *
 * This package aggregates already prepared platform service instances into a
 * single immutable `PlatformRuntime` surface. It is consumed by a future
 * environment-specific Composition Root and does not create adapters or
 * upstream platform services.
 */

export type {
  PlatformRuntime,
  PlatformRuntimeCreateInput,
  PlatformRuntimeFactory,
} from './contracts';

export { createPlatformRuntime } from './runtime/create-platform-runtime';
