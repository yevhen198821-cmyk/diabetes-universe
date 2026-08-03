import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsForbiddenAiInsightContent,
  createDashboardAiInsightViewModel,
} from './dashboard-ai-insight-model.ts';

const englishLabels = {
  defaultEmpty: 'AI insight is not available yet.',
  defaultError: 'Could not load AI insight.',
  disclaimer: 'Not a diagnosis or treatment prescription.',
  eyebrow: 'Automatic explanation',
  loading: 'Loading AI insight',
  relatedEventsLabel: 'Related records',
  relatedEventsNone: 'Related records: no confirmed records',
  title: 'AI insight',
  unavailable: 'AI insight unavailable.',
};

const validInsight = {
  displayTime: '10:15',
  generatedAt: '2026-08-02T07:15:00.000Z',
  id: 'insight-1015',
  relatedEventIds: ['glucose-0800', 'meal-0820'],
  relatedEventsLabel: 'Related records: 2',
  summary:
    'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
  title: 'После завтрака',
};

test('creates ready state with a single confirmed insight', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: validInsight,
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'ready');
  assert.ok(model.insight);
  assert.equal(model.insight.id, 'insight-1015');
  assert.equal(model.insight.title, 'После завтрака');
  assert.equal(model.insight.relatedEventCount, 2);
  assert.equal(model.insight.relatedEventsLabel, 'Related records: 2');
  assert.equal(model.insight.disclaimer, englishLabels.disclaimer);
});

test('rejects diagnosis content in ready insight', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: {
        ...validInsight,
        summary: 'Это может быть диагноз сахарного диабета.',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, englishLabels.unavailable);
});

test('rejects treatment assignment content in ready insight', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: {
        ...validInsight,
        summary: 'Рекомендуется назначить новое лечение.',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
});

test('rejects dosing recommendation content in ready insight', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: {
        ...validInsight,
        summary: 'Рекомендуется увеличить дозу инсулина.',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
});

test('rejects forecast content in ready insight', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: {
        ...validInsight,
        summary: 'Прогноз на завтра выглядит нестабильно.',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
});

test('downgrades invalid ready insight fields to unavailable empty', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: {
        ...validInsight,
        generatedAt: 'invalid',
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.insight, null);
  assert.equal(model.message, englishLabels.unavailable);
});

test('accepts precomposed zero-state related events label without reformatting', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: {
        ...validInsight,
        relatedEventIds: [' ', ''],
        relatedEventsLabel: englishLabels.relatedEventsNone,
      },
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal(model.state, 'ready');
  assert.equal(model.insight?.relatedEventCount, 0);
  assert.equal(
    model.insight?.relatedEventsLabel,
    englishLabels.relatedEventsNone,
  );
});

test('does not expose diagnosis, treatment, dosing, or forecast fields', () => {
  const model = createDashboardAiInsightViewModel(
    {
      insight: validInsight,
      state: 'ready',
    },
    englishLabels,
  );

  assert.equal('diagnosis' in model, false);
  assert.equal('treatment' in model, false);
  assert.equal('doseRecommendation' in model, false);
  assert.equal('forecast' in model, false);
  assert.equal('insights' in model, false);
});

test('exposes a future AI engine contract without implementing generation', () => {
  /** @type {import('./dashboard-ai-insight-model.ts').DashboardAiInsightEngine} */
  const engine = {
    async generateInsight() {
      return { insight: null };
    },
  };

  assert.equal(typeof engine.generateInsight, 'function');
  assert.equal(containsForbiddenAiInsightContent('Прогноз'), true);
  assert.equal(
    containsForbiddenAiInsightContent(
      'После завтрака значение было выше обычного уровня.',
    ),
    false,
  );
});

test('creates loading state with the default accessible label', () => {
  const model = createDashboardAiInsightViewModel(
    { state: 'loading' },
    englishLabels,
  );

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, englishLabels.loading);
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardAiInsightViewModel(
    { state: 'empty' },
    englishLabels,
  );

  assert.equal(model.state, 'empty');
  assert.equal(model.message, englishLabels.defaultEmpty);
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardAiInsightViewModel(
    { state: 'error' },
    englishLabels,
  );

  assert.equal(model.state, 'error');
  assert.equal(model.message, englishLabels.defaultError);
});

test('uses injected English labels for block chrome', () => {
  assert.equal(englishLabels.title, 'AI insight');
  assert.equal(englishLabels.eyebrow, 'Automatic explanation');
  assert.equal(
    englishLabels.disclaimer,
    'Not a diagnosis or treatment prescription.',
  );
});
