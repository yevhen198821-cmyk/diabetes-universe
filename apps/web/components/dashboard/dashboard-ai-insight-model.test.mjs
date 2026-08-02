import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsForbiddenAiInsightContent,
  createDashboardAiInsightViewModel,
  dashboardAiInsightLabels,
} from './dashboard-ai-insight-model.ts';

const validInsight = {
  displayTime: '10:15',
  generatedAt: '2026-08-02T07:15:00.000Z',
  id: 'insight-1015',
  relatedEventIds: ['glucose-0800', 'meal-0820'],
  summary:
    'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
  title: 'После завтрака',
};

test('creates ready state with a single confirmed insight', () => {
  const model = createDashboardAiInsightViewModel({
    insight: validInsight,
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.ok(model.insight);
  assert.equal(model.insight.id, 'insight-1015');
  assert.equal(model.insight.title, 'После завтрака');
  assert.equal(model.insight.relatedEventCount, 2);
  assert.equal(model.insight.relatedEventsLabel, 'Связанные записи: 2');
  assert.equal(model.insight.disclaimer, dashboardAiInsightLabels.disclaimer);
});

test('rejects diagnosis content in ready insight', () => {
  const model = createDashboardAiInsightViewModel({
    insight: {
      ...validInsight,
      summary: 'Это может быть диагноз сахарного диабета.',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardAiInsightLabels.unavailable);
});

test('rejects treatment assignment content in ready insight', () => {
  const model = createDashboardAiInsightViewModel({
    insight: {
      ...validInsight,
      summary: 'Рекомендуется назначить новое лечение.',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
});

test('rejects dosing recommendation content in ready insight', () => {
  const model = createDashboardAiInsightViewModel({
    insight: {
      ...validInsight,
      summary: 'Рекомендуется увеличить дозу инсулина.',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
});

test('rejects forecast content in ready insight', () => {
  const model = createDashboardAiInsightViewModel({
    insight: {
      ...validInsight,
      summary: 'Прогноз на завтра выглядит нестабильно.',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
});

test('downgrades invalid ready insight fields to unavailable empty', () => {
  const model = createDashboardAiInsightViewModel({
    insight: {
      ...validInsight,
      generatedAt: 'invalid',
    },
    state: 'ready',
  });

  assert.equal(model.state, 'empty');
  assert.equal(model.insight, null);
  assert.equal(model.message, dashboardAiInsightLabels.unavailable);
});

test('formats related events label when no confirmed records are linked', () => {
  const model = createDashboardAiInsightViewModel({
    insight: {
      ...validInsight,
      relatedEventIds: [' ', ''],
    },
    state: 'ready',
  });

  assert.equal(model.state, 'ready');
  assert.equal(model.insight?.relatedEventCount, 0);
  assert.equal(
    model.insight?.relatedEventsLabel,
    'Связанные записи: нет подтверждённых записей',
  );
});

test('does not expose diagnosis, treatment, dosing, or forecast fields', () => {
  const model = createDashboardAiInsightViewModel({
    insight: validInsight,
    state: 'ready',
  });

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
  const model = createDashboardAiInsightViewModel({ state: 'loading' });

  assert.equal(model.state, 'loading');
  assert.equal(model.isLoading, true);
  assert.equal(model.message, dashboardAiInsightLabels.loading);
});

test('creates empty state with the default message when none is supplied', () => {
  const model = createDashboardAiInsightViewModel({ state: 'empty' });

  assert.equal(model.state, 'empty');
  assert.equal(model.message, dashboardAiInsightLabels.defaultEmpty);
});

test('creates error state with the default message when none is supplied', () => {
  const model = createDashboardAiInsightViewModel({ state: 'error' });

  assert.equal(model.state, 'error');
  assert.equal(model.message, dashboardAiInsightLabels.defaultError);
});

test('exposes stable approved labels', () => {
  assert.equal(dashboardAiInsightLabels.title, 'ИИ-объяснение');
  assert.equal(dashboardAiInsightLabels.eyebrow, 'Автоматическое объяснение');
  assert.equal(
    dashboardAiInsightLabels.disclaimer,
    'Не является диагнозом или назначением лечения.',
  );
});
