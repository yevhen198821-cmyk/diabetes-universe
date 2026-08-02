export interface DashboardAiInsightData {
  readonly displayTime: string;
  readonly generatedAt: string;
  readonly id: string;
  readonly relatedEventIds: readonly string[];
  readonly summary: string;
  readonly title: string;
}

export interface DashboardAiInsightEngineRequest {
  readonly locale: string;
  readonly referenceTime: string;
  readonly timeZone: string;
}

export interface DashboardAiInsightEngineResponse {
  readonly insight: DashboardAiInsightData | null;
}

export interface DashboardAiInsightEngine {
  generateInsight(
    request: DashboardAiInsightEngineRequest,
  ): Promise<DashboardAiInsightEngineResponse>;
}

interface DashboardAiInsightLoadingProps {
  readonly loadingLabel?: string;
  readonly state: 'loading';
}

interface DashboardAiInsightReadyProps {
  readonly insight: DashboardAiInsightData;
  readonly state: 'ready';
}

interface DashboardAiInsightEmptyProps {
  readonly message?: string;
  readonly state: 'empty';
}

interface DashboardAiInsightErrorProps {
  readonly message?: string;
  readonly state: 'error';
}

export type DashboardAiInsightProps =
  | DashboardAiInsightLoadingProps
  | DashboardAiInsightReadyProps
  | DashboardAiInsightEmptyProps
  | DashboardAiInsightErrorProps;

export interface DashboardAiInsightReadyViewModel {
  readonly disclaimer: string;
  readonly displayTime: string;
  readonly generatedAt: string;
  readonly id: string;
  readonly relatedEventCount: number;
  readonly relatedEventsLabel: string;
  readonly summary: string;
  readonly title: string;
}

export interface DashboardAiInsightViewModel {
  readonly insight: DashboardAiInsightReadyViewModel | null;
  readonly isLoading: boolean;
  readonly message: string | null;
  readonly state: 'empty' | 'error' | 'loading' | 'ready';
}

export const dashboardAiInsightLabels = {
  defaultEmpty: 'ИИ-объяснение пока недоступно.',
  defaultError: 'Не удалось загрузить ИИ-объяснение.',
  disclaimer: 'Не является диагнозом или назначением лечения.',
  eyebrow: 'Автоматическое объяснение',
  loading: 'Загрузка ИИ-объяснения',
  relatedEvents: 'Связанные записи',
  title: 'ИИ-объяснение',
  unavailable: 'ИИ-объяснение недоступно.',
} as const;

const forbiddenInsightPatterns = [
  /диагноз/i,
  /диагностир/i,
  /назнач/i,
  /лечени[еяю]/i,
  /дозировк/i,
  /рекоменд.{0,24}доз/i,
  /увелич.{0,24}доз/i,
  /сниз.{0,24}доз/i,
  /прогноз/i,
  /предсказ/i,
  /вероятно завтра/i,
  /recommend(?:ed)? dose/i,
  /diagnos/i,
  /prescri/i,
  /forecast/i,
] as const;

function isValidIsoDateTime(dateTime: string): boolean {
  return !Number.isNaN(Date.parse(dateTime));
}

export function containsForbiddenAiInsightContent(text: string): boolean {
  const normalized = text.trim();

  if (normalized.length === 0) {
    return false;
  }

  return forbiddenInsightPatterns.some((pattern) => pattern.test(normalized));
}

function normalizeRelatedEventIds(
  relatedEventIds: readonly string[],
): readonly string[] {
  return relatedEventIds
    .map((eventId) => eventId.trim())
    .filter((eventId) => eventId.length > 0);
}

function formatRelatedEventsLabel(count: number): string {
  if (count === 0) {
    return `${dashboardAiInsightLabels.relatedEvents}: нет подтверждённых записей`;
  }

  return `${dashboardAiInsightLabels.relatedEvents}: ${count}`;
}

function normalizeReadyInsight(
  insight: DashboardAiInsightData,
): DashboardAiInsightReadyViewModel | null {
  const id = insight.id.trim();
  const title = insight.title.trim();
  const summary = insight.summary.trim();
  const displayTime = insight.displayTime.trim();
  const generatedAt = insight.generatedAt.trim();
  const relatedEventIds = normalizeRelatedEventIds(insight.relatedEventIds);
  const combinedContent = `${title}\n${summary}`;

  if (
    id.length === 0 ||
    title.length === 0 ||
    summary.length === 0 ||
    displayTime.length === 0 ||
    generatedAt.length === 0 ||
    !isValidIsoDateTime(generatedAt) ||
    containsForbiddenAiInsightContent(combinedContent)
  ) {
    return null;
  }

  return {
    disclaimer: dashboardAiInsightLabels.disclaimer,
    displayTime,
    generatedAt,
    id,
    relatedEventCount: relatedEventIds.length,
    relatedEventsLabel: formatRelatedEventsLabel(relatedEventIds.length),
    summary,
    title,
  };
}

function createEmptyViewModel(message: string): DashboardAiInsightViewModel {
  return {
    insight: null,
    isLoading: false,
    message,
    state: 'empty',
  };
}

export function createDashboardAiInsightViewModel(
  props: DashboardAiInsightProps,
): DashboardAiInsightViewModel {
  switch (props.state) {
    case 'loading':
      return {
        insight: null,
        isLoading: true,
        message: props.loadingLabel?.trim() || dashboardAiInsightLabels.loading,
        state: props.state,
      };
    case 'ready': {
      const insight = normalizeReadyInsight(props.insight);

      if (!insight) {
        return createEmptyViewModel(dashboardAiInsightLabels.unavailable);
      }

      return {
        insight,
        isLoading: false,
        message: null,
        state: props.state,
      };
    }
    case 'empty':
      return {
        insight: null,
        isLoading: false,
        message: props.message?.trim() || dashboardAiInsightLabels.defaultEmpty,
        state: props.state,
      };
    case 'error':
      return {
        insight: null,
        isLoading: false,
        message: props.message?.trim() || dashboardAiInsightLabels.defaultError,
        state: props.state,
      };
  }
}
