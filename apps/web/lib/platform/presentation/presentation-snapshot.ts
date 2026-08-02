import type {
  HourCycle,
  LanguageCode,
  LocaleCode,
} from '@diabetes-universe/i18n';

/**
 * JSON-serializable immutable presentation state for server/client boundary.
 */
export interface PresentationSnapshot {
  readonly version: 1;
  readonly language: LanguageCode;
  readonly locale: LocaleCode;
  readonly timeZone: string;
  readonly hourCycle: HourCycle;
  readonly numberingSystem?: string;
  readonly calendar?: string;
}

export const PRESENTATION_SNAPSHOT_VERSION = 1 as const;
