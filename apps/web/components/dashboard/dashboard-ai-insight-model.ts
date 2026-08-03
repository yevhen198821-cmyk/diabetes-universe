import type { DashboardAiInsightLabels } from './dashboard-ai-insight-labels';

export interface DashboardAiInsightData {
  readonly displayTime: string;
  readonly generatedAt: string;
  readonly id: string;
  readonly relatedEventIds: readonly string[];
  readonly relatedEventsLabel: string;
  readonly summary: string;
  readonly title: string;
}

export interface DashboardAiInsightEngineRequest {
  readonly locale: string;
  readonly referenceTime: string;
  readonly timeZone: string;
}

export interface DashboardAiInsightEngineInsight {
  readonly generatedAt: string;
  readonly id: string;
  readonly relatedEventIds: readonly string[];
  readonly summary: string;
  readonly title: string;
}

export interface DashboardAiInsightEngineResponse {
  readonly insight: DashboardAiInsightEngineInsight | null;
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

function normalizeReadyInsight(
  insight: DashboardAiInsightData,
  labels: DashboardAiInsightLabels,
): DashboardAiInsightReadyViewModel | null {
  const id = insight.id.trim();
  const title = insight.title.trim();
  const summary = insight.summary.trim();
  const displayTime = insight.displayTime.trim();
  const generatedAt = insight.generatedAt.trim();
  const relatedEventsLabel = insight.relatedEventsLabel.trim();
  const relatedEventIds = normalizeRelatedEventIds(insight.relatedEventIds);
  const combinedContent = `${title}\n${summary}`;

  if (
    id.length === 0 ||
    title.length === 0 ||
    summary.length === 0 ||
    displayTime.length === 0 ||
    generatedAt.length === 0 ||
    relatedEventsLabel.length === 0 ||
    !isValidIsoDateTime(generatedAt) ||
    containsForbiddenAiInsightContent(combinedContent)
  ) {
    return null;
  }

  return {
    disclaimer: labels.disclaimer,
    displayTime,
    generatedAt,
    id,
    relatedEventCount: relatedEventIds.length,
    relatedEventsLabel,
    summary,
    title,
  };
}

function createEmptyViewModel(
  labels: DashboardAiInsightLabels,
  message: string,
): DashboardAiInsightViewModel {
  return {
    insight: null,
    isLoading: false,
    message,
    state: 'empty',
  };
}

export function createDashboardAiInsightViewModel(
  props: DashboardAiInsightProps,
  labels: DashboardAiInsightLabels,
): DashboardAiInsightViewModel {
  switch (props.state) {
    case 'loading':
      return {
        insight: null,
        isLoading: true,
        message: props.loadingLabel?.trim() || labels.loading,
        state: props.state,
      };
    case 'ready': {
      const insight = normalizeReadyInsight(props.insight, labels);

      if (!insight) {
        return createEmptyViewModel(labels, labels.unavailable);
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
        message: props.message?.trim() || labels.defaultEmpty,
        state: props.state,
      };
    case 'error':
      return {
        insight: null,
        isLoading: false,
        message: props.message?.trim() || labels.defaultError,
        state: props.state,
      };
  }
}
