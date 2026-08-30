import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import {
  formatPluralMessage,
  type PluralMessageTemplates,
} from '@diabetes-universe/i18n';
export type TimelinePluralCountLabels = PluralMessageTemplates;

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export interface TimelineUiLabels {
  readonly detail: Readonly<{
    readonly close: string;
    readonly closeButton: string;
    readonly closeOverlay: string;
    readonly context: string;
    readonly delete: string;
    readonly deleteConfirm: Readonly<{
      readonly closeOverlay: string;
      readonly confirm: string;
      readonly description: string;
      readonly title: string;
    }>;
    readonly edit: string;
    readonly editTitle: string;
    readonly form: Readonly<{
      readonly context: string;
      readonly date: string;
      readonly insulin: Readonly<{
        readonly contextLabel: string;
        readonly doseLabel: string;
        readonly errors: Readonly<{
          readonly doseRange: string;
          readonly otherNameRequired: string;
        }>;
        readonly keepRecordedContext: string;
        readonly keepRecordedPreparation: string;
        readonly legacyContextHint: string;
        readonly legacyPreparationHint: string;
        readonly otherNameLabel: string;
        readonly preparationLabel: string;
      }>;
      readonly note: string;
      readonly save: string;
      readonly time: string;
      readonly title: string;
      readonly unit: string;
      readonly value: string;
    }>;
    readonly note: string;
    readonly source: string;
  }>;
  readonly empty: Readonly<{
    readonly action: string;
    readonly description: string;
    readonly title: string;
  }>;
  readonly error: Readonly<{
    readonly default: string;
    readonly title: string;
  }>;
  readonly filteredEmpty: Readonly<{
    readonly description: string;
    readonly reset: string;
    readonly title: string;
  }>;
  readonly dateFilter: Readonly<{
    readonly apply: string;
    readonly ariaLabel: string;
    readonly closeOverlay: string;
    readonly last45Days: string;
    readonly last30Days: string;
    readonly last7Days: string;
    readonly sheetTitle: string;
    readonly today: string;
  }>;
  readonly dayEmpty: Readonly<{
    readonly description: string;
    readonly title: string;
  }>;
  readonly dayNavigation: Readonly<{
    readonly ariaLabel: string;
    readonly nextDay: string;
    readonly previousDay: string;
    readonly todayPrefix: string;
  }>;
  readonly dayPeriod: Readonly<{
    readonly day: string;
    readonly evening: string;
    readonly morning: string;
    readonly night: string;
    readonly timeRange: Readonly<{
      readonly day: string;
      readonly evening: string;
      readonly morning: string;
      readonly night: string;
    }>;
  }>;
  readonly eventCount: TimelinePluralCountLabels;
  readonly eventsOfDay: Readonly<{
    readonly ariaLabel: string;
    readonly clusterAriaLabel: TimelinePluralCountLabels;
    readonly currentTime: string;
    readonly helper: string;
    readonly title: string;
  }>;
  readonly periodEmpty: Readonly<{
    readonly description: string;
    readonly title: string;
  }>;
  readonly filters: Readonly<{
    readonly ariaLabel: string;
  }>;
  readonly group: Readonly<{
    readonly unknownDate: string;
  }>;
  readonly header: Readonly<{
    readonly title: string;
  }>;
  readonly historyLoad: Readonly<{
    readonly error: string;
  }>;
  readonly list: Readonly<{
    readonly ariaLabel: string;
  }>;
  readonly loadMore: Readonly<{
    readonly announced: string;
    readonly button: string;
    readonly loading: string;
    readonly remaining: string;
  }>;
  readonly loading: Readonly<{
    readonly status: string;
    readonly title: string;
  }>;
  readonly search: Readonly<{
    readonly clear: string;
    readonly label: string;
    readonly placeholder: string;
  }>;
  readonly shell: Readonly<{
    readonly eyebrow: string;
  }>;
  readonly sources: Readonly<{
    readonly demo: string;
    readonly device: string;
    readonly import: string;
    readonly manual: string;
  }>;
  readonly toolbar: Readonly<{
    readonly foundCount: string;
    readonly noMatches: string;
    readonly reset: string;
    readonly title: string;
  }>;
  readonly topBar: Readonly<{
    readonly home: string;
  }>;
}

const TIMELINE_UI_TRANSLATION_KEYS = {
  detailClose: asTranslationKey('timeline.detail.closeButton'),
  detailCloseDetails: asTranslationKey('timeline.detail.close'),
  detailCloseOverlay: asTranslationKey('timeline.detail.closeOverlay'),
  detailContext: asTranslationKey('timeline.detail.context'),
  detailDelete: asTranslationKey('timeline.detail.delete'),
  detailDeleteConfirmCloseOverlay: asTranslationKey(
    'timeline.detail.deleteConfirm.closeOverlay',
  ),
  detailDeleteConfirmConfirm: asTranslationKey(
    'timeline.detail.deleteConfirm.confirm',
  ),
  detailDeleteConfirmDescription: asTranslationKey(
    'timeline.detail.deleteConfirm.description',
  ),
  detailDeleteConfirmTitle: asTranslationKey(
    'timeline.detail.deleteConfirm.title',
  ),
  detailEdit: asTranslationKey('timeline.detail.edit'),
  detailEditTitle: asTranslationKey('timeline.detail.editTitle'),
  detailFormContext: asTranslationKey('timeline.detail.form.context'),
  detailFormDate: asTranslationKey('timeline.detail.form.date'),
  detailFormInsulinContextLabel: asTranslationKey(
    'timeline.detail.form.insulin.contextLabel',
  ),
  detailFormInsulinDoseLabel: asTranslationKey(
    'timeline.detail.form.insulin.doseLabel',
  ),
  detailFormInsulinErrorDoseRange: asTranslationKey(
    'timeline.detail.form.insulin.errors.doseRange',
  ),
  detailFormInsulinErrorOtherNameRequired: asTranslationKey(
    'timeline.detail.form.insulin.errors.otherNameRequired',
  ),
  detailFormInsulinKeepRecordedContext: asTranslationKey(
    'timeline.detail.form.insulin.keepRecordedContext',
  ),
  detailFormInsulinKeepRecordedPreparation: asTranslationKey(
    'timeline.detail.form.insulin.keepRecordedPreparation',
  ),
  detailFormInsulinLegacyContextHint: asTranslationKey(
    'timeline.detail.form.insulin.legacyContextHint',
  ),
  detailFormInsulinLegacyPreparationHint: asTranslationKey(
    'timeline.detail.form.insulin.legacyPreparationHint',
  ),
  detailFormInsulinOtherNameLabel: asTranslationKey(
    'timeline.detail.form.insulin.otherNameLabel',
  ),
  detailFormInsulinPreparationLabel: asTranslationKey(
    'timeline.detail.form.insulin.preparationLabel',
  ),
  detailFormNote: asTranslationKey('timeline.detail.form.note'),
  detailFormSave: asTranslationKey('timeline.detail.form.save'),
  detailFormTime: asTranslationKey('timeline.detail.form.time'),
  detailFormTitle: asTranslationKey('timeline.detail.form.title'),
  detailFormUnit: asTranslationKey('timeline.detail.form.unit'),
  detailFormValue: asTranslationKey('timeline.detail.form.value'),
  detailNote: asTranslationKey('timeline.detail.note'),
  detailSource: asTranslationKey('timeline.detail.source'),
  emptyAction: asTranslationKey('timeline.empty.action'),
  emptyDescription: asTranslationKey('timeline.empty.description'),
  emptyTitle: asTranslationKey('timeline.empty.title'),
  errorDefault: asTranslationKey('timeline.error.default'),
  errorTitle: asTranslationKey('timeline.error.title'),
  filteredEmptyDescription: asTranslationKey(
    'timeline.filteredEmpty.description',
  ),
  filteredEmptyReset: asTranslationKey('timeline.filteredEmpty.reset'),
  filteredEmptyTitle: asTranslationKey('timeline.filteredEmpty.title'),
  dateFilterApply: asTranslationKey('timeline.dateFilter.apply'),
  dateFilterAriaLabel: asTranslationKey('timeline.dateFilter.ariaLabel'),
  dateFilterCloseOverlay: asTranslationKey('timeline.dateFilter.closeOverlay'),
  dateFilterLast45Days: asTranslationKey('timeline.dateFilter.last45Days'),
  dateFilterLast30Days: asTranslationKey('timeline.dateFilter.last30Days'),
  dateFilterLast7Days: asTranslationKey('timeline.dateFilter.last7Days'),
  dateFilterSheetTitle: asTranslationKey('timeline.dateFilter.sheetTitle'),
  dateFilterToday: asTranslationKey('timeline.dateFilter.today'),
  dayEmptyDescription: asTranslationKey('timeline.dayEmpty.description'),
  dayEmptyTitle: asTranslationKey('timeline.dayEmpty.title'),
  dayNavigationAriaLabel: asTranslationKey('timeline.dayNavigation.ariaLabel'),
  dayNavigationNextDay: asTranslationKey('timeline.dayNavigation.nextDay'),
  dayNavigationPreviousDay: asTranslationKey(
    'timeline.dayNavigation.previousDay',
  ),
  dayNavigationTodayPrefix: asTranslationKey(
    'timeline.dayNavigation.todayPrefix',
  ),
  dayPeriodDay: asTranslationKey('timeline.dayPeriod.day'),
  dayPeriodEvening: asTranslationKey('timeline.dayPeriod.evening'),
  dayPeriodMorning: asTranslationKey('timeline.dayPeriod.morning'),
  dayPeriodNight: asTranslationKey('timeline.dayPeriod.night'),
  dayPeriodTimeRangeDay: asTranslationKey('timeline.dayPeriod.timeRange.day'),
  dayPeriodTimeRangeEvening: asTranslationKey(
    'timeline.dayPeriod.timeRange.evening',
  ),
  dayPeriodTimeRangeMorning: asTranslationKey(
    'timeline.dayPeriod.timeRange.morning',
  ),
  dayPeriodTimeRangeNight: asTranslationKey(
    'timeline.dayPeriod.timeRange.night',
  ),
  eventCountFew: asTranslationKey('timeline.eventCount.few'),
  eventCountMany: asTranslationKey('timeline.eventCount.many'),
  eventCountOne: asTranslationKey('timeline.eventCount.one'),
  eventCountOther: asTranslationKey('timeline.eventCount.other'),
  eventsOfDayAriaLabel: asTranslationKey('timeline.eventsOfDay.ariaLabel'),
  eventsOfDayClusterAriaLabelFew: asTranslationKey(
    'timeline.eventsOfDay.clusterAriaLabel.few',
  ),
  eventsOfDayClusterAriaLabelMany: asTranslationKey(
    'timeline.eventsOfDay.clusterAriaLabel.many',
  ),
  eventsOfDayClusterAriaLabelOne: asTranslationKey(
    'timeline.eventsOfDay.clusterAriaLabel.one',
  ),
  eventsOfDayClusterAriaLabelOther: asTranslationKey(
    'timeline.eventsOfDay.clusterAriaLabel.other',
  ),
  eventsOfDayCurrentTime: asTranslationKey('timeline.eventsOfDay.currentTime'),
  eventsOfDayHelper: asTranslationKey('timeline.eventsOfDay.helper'),
  eventsOfDayTitle: asTranslationKey('timeline.eventsOfDay.title'),
  periodEmptyDescription: asTranslationKey('timeline.periodEmpty.description'),
  periodEmptyTitle: asTranslationKey('timeline.periodEmpty.title'),
  filtersAriaLabel: asTranslationKey('timeline.filters.ariaLabel'),
  groupUnknownDate: asTranslationKey('timeline.group.unknownDate'),
  headerTitle: asTranslationKey('timeline.header.title'),
  historyLoadError: asTranslationKey('timeline.historyLoad.error'),
  listAriaLabel: asTranslationKey('timeline.list.ariaLabel'),
  loadMoreAnnounced: asTranslationKey('timeline.loadMore.announced'),
  loadMoreButton: asTranslationKey('timeline.loadMore.button'),
  loadMoreLoading: asTranslationKey('timeline.loadMore.loading'),
  loadMoreRemaining: asTranslationKey('timeline.loadMore.remaining'),
  loadingStatus: asTranslationKey('timeline.loading.status'),
  loadingTitle: asTranslationKey('timeline.loading.title'),
  searchClear: asTranslationKey('timeline.search.clear'),
  searchLabel: asTranslationKey('timeline.search.label'),
  searchPlaceholder: asTranslationKey('timeline.search.placeholder'),
  shellEyebrow: asTranslationKey('timeline.shell.eyebrow'),
  sourceDemo: asTranslationKey('timeline.detail.source.demo'),
  sourceDevice: asTranslationKey('timeline.detail.source.device'),
  sourceImport: asTranslationKey('timeline.detail.source.import'),
  sourceManual: asTranslationKey('timeline.detail.source.manual'),
  toolbarFoundCount: asTranslationKey('timeline.toolbar.foundCount'),
  toolbarNoMatches: asTranslationKey('timeline.toolbar.noMatches'),
  toolbarReset: asTranslationKey('timeline.toolbar.reset'),
  toolbarTitle: asTranslationKey('timeline.toolbar.title'),
  topBarHome: asTranslationKey('timeline.topBar.home'),
} as const;

export function resolveTimelineUiLabels(
  localization: LocalizationPlatform,
): TimelineUiLabels {
  return {
    detail: {
      close: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.detailCloseDetails,
      ),
      closeButton: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.detailClose,
      ),
      closeOverlay: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.detailCloseOverlay,
      ),
      context: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.detailContext,
      ),
      delete: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.detailDelete,
      ),
      deleteConfirm: {
        closeOverlay: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailDeleteConfirmCloseOverlay,
        ),
        confirm: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailDeleteConfirmConfirm,
        ),
        description: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailDeleteConfirmDescription,
        ),
        title: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailDeleteConfirmTitle,
        ),
      },
      edit: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.detailEdit),
      editTitle: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.detailEditTitle,
      ),
      form: {
        context: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormContext,
        ),
        date: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormDate,
        ),
        insulin: {
          contextLabel: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinContextLabel,
          ),
          doseLabel: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinDoseLabel,
          ),
          errors: {
            doseRange: translate(
              localization,
              TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinErrorDoseRange,
            ),
            otherNameRequired: translate(
              localization,
              TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinErrorOtherNameRequired,
            ),
          },
          keepRecordedContext: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinKeepRecordedContext,
          ),
          keepRecordedPreparation: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinKeepRecordedPreparation,
          ),
          legacyContextHint: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinLegacyContextHint,
          ),
          legacyPreparationHint: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinLegacyPreparationHint,
          ),
          otherNameLabel: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinOtherNameLabel,
          ),
          preparationLabel: translate(
            localization,
            TIMELINE_UI_TRANSLATION_KEYS.detailFormInsulinPreparationLabel,
          ),
        },
        note: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormNote,
        ),
        save: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormSave,
        ),
        time: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormTime,
        ),
        title: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormTitle,
        ),
        unit: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormUnit,
        ),
        value: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.detailFormValue,
        ),
      },
      note: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.detailNote),
      source: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.detailSource,
      ),
    },
    empty: {
      action: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.emptyAction),
      description: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.emptyDescription,
      ),
      title: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.emptyTitle),
    },
    error: {
      default: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.errorDefault,
      ),
      title: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.errorTitle),
    },
    filteredEmpty: {
      description: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.filteredEmptyDescription,
      ),
      reset: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.filteredEmptyReset,
      ),
      title: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.filteredEmptyTitle,
      ),
    },
    dateFilter: {
      apply: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterApply,
      ),
      ariaLabel: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterAriaLabel,
      ),
      closeOverlay: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterCloseOverlay,
      ),
      last45Days: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterLast45Days,
      ),
      last30Days: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterLast30Days,
      ),
      last7Days: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterLast7Days,
      ),
      sheetTitle: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterSheetTitle,
      ),
      today: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dateFilterToday,
      ),
    },
    dayEmpty: {
      description: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayEmptyDescription,
      ),
      title: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayEmptyTitle,
      ),
    },
    dayNavigation: {
      ariaLabel: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayNavigationAriaLabel,
      ),
      nextDay: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayNavigationNextDay,
      ),
      previousDay: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayNavigationPreviousDay,
      ),
      todayPrefix: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayNavigationTodayPrefix,
      ),
    },
    dayPeriod: {
      day: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.dayPeriodDay),
      evening: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayPeriodEvening,
      ),
      morning: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayPeriodMorning,
      ),
      night: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.dayPeriodNight,
      ),
      timeRange: {
        day: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.dayPeriodTimeRangeDay,
        ),
        evening: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.dayPeriodTimeRangeEvening,
        ),
        morning: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.dayPeriodTimeRangeMorning,
        ),
        night: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.dayPeriodTimeRangeNight,
        ),
      },
    },
    eventCount: {
      few: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.eventCountFew),
      many: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.eventCountMany,
      ),
      one: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.eventCountOne),
      other: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.eventCountOther,
      ),
    },
    eventsOfDay: {
      ariaLabel: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayAriaLabel,
      ),
      clusterAriaLabel: {
        few: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayClusterAriaLabelFew,
        ),
        many: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayClusterAriaLabelMany,
        ),
        one: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayClusterAriaLabelOne,
        ),
        other: translate(
          localization,
          TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayClusterAriaLabelOther,
        ),
      },
      currentTime: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayCurrentTime,
      ),
      helper: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayHelper,
      ),
      title: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.eventsOfDayTitle,
      ),
    },
    periodEmpty: {
      description: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.periodEmptyDescription,
      ),
      title: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.periodEmptyTitle,
      ),
    },
    filters: {
      ariaLabel: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.filtersAriaLabel,
      ),
    },
    group: {
      unknownDate: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.groupUnknownDate,
      ),
    },
    header: {
      title: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.headerTitle),
    },
    historyLoad: {
      error: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.historyLoadError,
      ),
    },
    list: {
      ariaLabel: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.listAriaLabel,
      ),
    },
    loadMore: {
      announced: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.loadMoreAnnounced,
      ),
      button: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.loadMoreButton,
      ),
      loading: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.loadMoreLoading,
      ),
      remaining: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.loadMoreRemaining,
      ),
    },
    loading: {
      status: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.loadingStatus,
      ),
      title: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.loadingTitle),
    },
    search: {
      clear: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.searchClear),
      label: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.searchLabel),
      placeholder: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.searchPlaceholder,
      ),
    },
    shell: {
      eyebrow: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.shellEyebrow,
      ),
    },
    sources: {
      demo: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.sourceDemo),
      device: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.sourceDevice,
      ),
      import: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.sourceImport,
      ),
      manual: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.sourceManual,
      ),
    },
    toolbar: {
      foundCount: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.toolbarFoundCount,
      ),
      noMatches: translate(
        localization,
        TIMELINE_UI_TRANSLATION_KEYS.toolbarNoMatches,
      ),
      reset: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.toolbarReset),
      title: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.toolbarTitle),
    },
    topBar: {
      home: translate(localization, TIMELINE_UI_TRANSLATION_KEYS.topBarHome),
    },
  };
}

export function formatTimelineEventCount(
  count: number,
  labels: TimelinePluralCountLabels,
  locale: string,
  formatCount: (count: number) => string,
): string {
  return formatPluralMessage(count, labels, locale, formatCount);
}

export function formatTimelineToolbarResultLabel(
  labels: Pick<TimelineUiLabels['toolbar'], 'noMatches'> & {
    readonly eventCount: TimelinePluralCountLabels;
  },
  model: Readonly<{
    readonly hasActiveSearchOrCategoryCriteria: boolean;
    readonly resultCount: number;
  }>,
  locale: string,
  formatCount: (count: number) => string,
): string {
  if (model.hasActiveSearchOrCategoryCriteria && model.resultCount === 0) {
    return labels.noMatches;
  }

  return formatTimelineEventCount(
    model.resultCount,
    labels.eventCount,
    locale,
    formatCount,
  );
}

export function formatTimelineLoadMoreAnnouncement(
  template: string,
  count: number,
  formatCount: (count: number) => string,
): string {
  return template.replace('{count}', formatCount(count));
}

export function formatTimelineLoadMoreRemaining(
  template: string,
  count: number,
  formatCount: (count: number) => string,
): string {
  return template.replace('{count}', formatCount(count));
}

export function formatTimelineDayPeriodEventCount(
  count: number,
  labels: TimelinePluralCountLabels,
  locale: string,
  formatCount: (count: number) => string,
): string {
  return formatTimelineEventCount(count, labels, locale, formatCount);
}

export function formatTimelineEventsOfDayClusterAriaLabel(
  count: number,
  labels: TimelinePluralCountLabels,
  locale: string,
  formatCount: (count: number) => string,
): string {
  return formatTimelineEventCount(count, labels, locale, formatCount);
}
