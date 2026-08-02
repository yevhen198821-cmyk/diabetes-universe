import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import type { PlatformFormatter } from '@diabetes-universe/formatting';
import type { PlatformRuntime } from './platform-runtime';
import type { PlatformRuntimeCreateInput } from './platform-runtime-create-input';
import type { PlatformRuntimeFactory } from './platform-runtime-factory';

declare const localization: LocalizationPlatform;
declare const formatter: PlatformFormatter;
declare const input: PlatformRuntimeCreateInput;
declare const factory: PlatformRuntimeFactory;

const runtime: PlatformRuntime = {
  localization,
  formatter,
};

void runtime;

const runtimeLocalization: LocalizationPlatform = runtime.localization;
const runtimeFormatter: PlatformFormatter = runtime.formatter;

void runtimeLocalization;
void runtimeFormatter;

const assembledInput: PlatformRuntimeCreateInput = {
  localization,
  formatter,
};

void assembledInput;

const assembledRuntime: PlatformRuntime = factory.createPlatformRuntime(input);

void assembledRuntime;

// @ts-expect-error PlatformRuntime.localization must be LocalizationPlatform
const invalidLocalization: string = runtime.localization;

void invalidLocalization;

// @ts-expect-error PlatformRuntime.formatter must be PlatformFormatter
const invalidFormatter: string = runtime.formatter;

void invalidFormatter;

// @ts-expect-error PlatformRuntimeCreateInput requires localization
const missingLocalization: PlatformRuntimeCreateInput = {
  formatter,
};

void missingLocalization;

// @ts-expect-error PlatformRuntimeCreateInput requires formatter
const missingFormatter: PlatformRuntimeCreateInput = {
  localization,
};

void missingFormatter;
