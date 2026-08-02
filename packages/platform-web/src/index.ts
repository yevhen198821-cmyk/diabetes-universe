/**
 * Diabetes Universe Web Composition Root.
 *
 * Environment-specific platform wiring for Web runtimes. Accepts plain
 * configuration DTOs, creates Infrastructure Adapters and platform services,
 * ensures Platform Readiness, and returns an isolated PlatformRuntime.
 */

export type {
  WebPlatformConfig,
  WebPlatformPreloadConfig,
  WebPlatformRuntimeFactory,
} from './contracts';

export { createWebPlatformRuntime } from './runtime/create-web-platform-runtime';
