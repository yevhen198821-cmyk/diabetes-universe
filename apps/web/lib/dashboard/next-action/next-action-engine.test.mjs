import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';
import {
  createDashboardNextActionEngineInput,
  resolveDashboardNextActionPresentation,
} from '../dashboard-next-action-integration.ts';
import { createTimelinePresentationDependencies } from '../../timeline/presentation/index.ts';
import { liftLegacyTestFixtures } from '../../timeline/testing/lift-legacy-test-fixtures.ts';
import { createTestTimelinePresentationDependencies } from '../../timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import {
  NEXT_ACTION_DEFAULT_ACTION_LABEL_KEY,
  NEXT_ACTION_DEFAULT_DESCRIPTION_KEY,
  NEXT_ACTION_DEFAULT_MESSAGE_KEY,
  createCompatibilityDefaultDecision,
} from './next-action-default.ts';
import { createNextActionContext } from './next-action-context.ts';
import { evaluateNextAction } from './next-action-engine.ts';
import {
  NEXT_ACTION_FALLBACK_MESSAGE_KEY,
  createNeutralFallbackDecision,
} from './next-action-fallback.ts';
import {
  mapNeutralFallbackPresentation,
  mapNextActionDecision,
} from './next-action-mapper.ts';
import { mapEnginePriorityToNextStepPriority } from './next-action-priority-map.ts';
import { getContextualNextActionRules } from './next-action-rules.ts';
import {
  DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES,
  isDashboardQuickAddCategory,
} from './next-action-availability.ts';

const FIXED_NOW = new Date('2026-08-02T10:00:00.000Z');

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await createTestTimelinePresentationDependencies();
});

function createTestContext(overrides = {}) {
  const { events: overrideEvents, ...rest } = overrides;
  const events = Array.isArray(overrideEvents)
    ? liftLegacyTestFixtures(overrideEvents)
    : [];

  return createNextActionContext({
    events,
    now: FIXED_NOW,
    presentationDependencies,
    quickAddAvailability: {
      availableCategories: ['insulin'],
    },
    ...rest,
  });
}

test('contextual rule registry is empty in SD-001', () => {
  assert.deepEqual(getContextualNextActionRules(), []);
});

test('compatibility default is selected when no contextual rules match', () => {
  const decision = evaluateNextAction(createTestContext());

  assert.equal(decision.source, 'compatibility-default');
  assert.equal(decision.action.kind, 'quick-add');
  assert.equal(decision.action.category, 'insulin');
  assert.equal(decision.messageKey, NEXT_ACTION_DEFAULT_MESSAGE_KEY);
  assert.equal(decision.descriptionKey, NEXT_ACTION_DEFAULT_DESCRIPTION_KEY);
  assert.equal(decision.action.labelKey, NEXT_ACTION_DEFAULT_ACTION_LABEL_KEY);
});

test('neutral fallback is selected when default mapping is unsafe', () => {
  const decision = evaluateNextAction(
    createTestContext({
      quickAddAvailability: {
        availableCategories: ['glucose'],
      },
    }),
  );

  assert.equal(decision.source, 'neutral-fallback');
  assert.equal(decision.action.kind, 'none');
  assert.equal(decision.messageKey, NEXT_ACTION_FALLBACK_MESSAGE_KEY);
});

test('evaluateNextAction returns exactly one decision', () => {
  const decision = evaluateNextAction(createTestContext());

  assert.equal(typeof decision.messageKey, 'string');
  assert.equal(typeof decision.priority, 'string');
  assert.equal(typeof decision.source, 'string');
});

test('evaluateNextAction is deterministic for identical input', () => {
  const context = createTestContext({
    events: [
      {
        dateTime: '2026-08-02T08:00:00.000Z',
        id: 'glucose-1',
        kind: 'glucose',
        title: 'Glucose',
        value: '6.4',
      },
    ],
  });

  const first = evaluateNextAction(context);
  const second = evaluateNextAction(context);

  assert.deepEqual(first, second);
});

test('contextual rules resolve by highest semantic priority', () => {
  const decision = evaluateNextAction(
    createTestContext({
      quickAddAvailability: {
        availableCategories: ['glucose', 'insulin'],
      },
    }),
    {
      rules: [
        {
          evaluate: () => ({
            action: { category: 'glucose', kind: 'quick-add', labelKey: 'x' },
            messageKey: 'recommended',
          }),
          priority: 'recommended',
          ruleId: 'rule-recommended',
          tieBreakRank: 1,
        },
        {
          evaluate: () => ({
            action: { category: 'glucose', kind: 'quick-add', labelKey: 'x' },
            messageKey: 'critical',
          }),
          priority: 'critical',
          ruleId: 'rule-critical',
          tieBreakRank: 2,
        },
      ],
    },
  );

  assert.equal(decision.messageKey, 'critical');
  assert.equal(decision.ruleId, 'rule-critical');
  assert.equal(decision.priority, 'critical');
});

test('contextual rules resolve by lowest tie-break rank within same priority', () => {
  const decision = evaluateNextAction(
    createTestContext({
      quickAddAvailability: {
        availableCategories: ['glucose', 'insulin'],
      },
    }),
    {
      rules: [
        {
          evaluate: () => ({
            action: { category: 'glucose', kind: 'quick-add', labelKey: 'x' },
            messageKey: 'rank-2',
          }),
          priority: 'important',
          ruleId: 'rule-b',
          tieBreakRank: 2,
        },
        {
          evaluate: () => ({
            action: { category: 'glucose', kind: 'quick-add', labelKey: 'x' },
            messageKey: 'rank-1',
          }),
          priority: 'important',
          ruleId: 'rule-a',
          tieBreakRank: 1,
        },
      ],
    },
  );

  assert.equal(decision.messageKey, 'rank-1');
  assert.equal(decision.ruleId, 'rule-a');
});

test('contextual rules resolve by lexicographic rule ID when priority and rank tie', () => {
  const decision = evaluateNextAction(
    createTestContext({
      quickAddAvailability: {
        availableCategories: ['glucose', 'insulin'],
      },
    }),
    {
      rules: [
        {
          evaluate: () => ({
            action: { category: 'glucose', kind: 'quick-add', labelKey: 'x' },
            messageKey: 'rule-b',
          }),
          priority: 'important',
          ruleId: 'rule-b',
          tieBreakRank: 1,
        },
        {
          evaluate: () => ({
            action: { category: 'glucose', kind: 'quick-add', labelKey: 'x' },
            messageKey: 'rule-a',
          }),
          priority: 'important',
          ruleId: 'rule-a',
          tieBreakRank: 1,
        },
      ],
    },
  );

  assert.equal(decision.messageKey, 'rule-a');
  assert.equal(decision.ruleId, 'rule-a');
});

test('rule priority cannot diverge from decision priority', () => {
  const rulePriority = 'important';
  const decision = evaluateNextAction(
    createTestContext({
      quickAddAvailability: {
        availableCategories: ['glucose', 'insulin'],
      },
    }),
    {
      rules: [
        {
          evaluate: () => ({
            action: {
              category: 'glucose',
              kind: 'quick-add',
              labelKey: 'dashboard.nextAction.action',
            },
            messageKey: 'dashboard.nextAction.title',
          }),
          priority: rulePriority,
          ruleId: 'priority-owner-rule',
          tieBreakRank: 1,
        },
      ],
    },
  );

  assert.equal(decision.source, 'contextual-rule');
  assert.equal(decision.priority, rulePriority);
  assert.equal(decision.ruleId, 'priority-owner-rule');
  assert.equal('priority' in (decision.action ?? {}), false);
});

test('priority mapping is exhaustive for all engine priorities', () => {
  assert.equal(mapEnginePriorityToNextStepPriority('critical'), 'high');
  assert.equal(mapEnginePriorityToNextStepPriority('important'), 'high');
  assert.equal(mapEnginePriorityToNextStepPriority('recommended'), 'normal');
  assert.equal(mapEnginePriorityToNextStepPriority('informational'), 'normal');
});

test('unsupported quick-add category maps to null presentation', () => {
  const context = createTestContext({
    quickAddAvailability: {
      availableCategories: ['glucose'],
    },
  });
  const mapped = mapNextActionDecision(
    context,
    createCompatibilityDefaultDecision(),
  );

  assert.equal(mapped, null);
});

test('quick-add mapped presentation always requires action label key', () => {
  const mapped = mapNextActionDecision(
    createTestContext(),
    createCompatibilityDefaultDecision(),
  );

  assert.ok(mapped);
  assert.equal(mapped.kind, 'quick-add');
  if (mapped.kind === 'quick-add') {
    assert.equal(typeof mapped.actionLabelKey, 'string');
    assert.ok(mapped.actionLabelKey.length > 0);
    assert.equal(mapped.category, 'insulin');
  }
});

test('none presentation cannot expose CTA data', () => {
  const mapped = mapNeutralFallbackPresentation();

  assert.equal(mapped.kind, 'none');
  assert.equal(mapped.action.kind, 'none');
  assert.equal('actionLabelKey' in mapped, false);
  assert.equal('category' in mapped, false);
});

test('fallback mapping requires no synthetic time or context', () => {
  const mapped = mapNeutralFallbackPresentation();

  assert.equal(mapped.source, 'neutral-fallback');
  assert.equal(mapped.action.kind, 'none');
  assert.equal(mapped.messageKey, NEXT_ACTION_FALLBACK_MESSAGE_KEY);
  assert.equal(mapped.priority, 'normal');
});

test('incomplete context still returns compatibility default when insulin is available', () => {
  const decision = evaluateNextAction(
    createTestContext({
      events: [],
    }),
  );

  assert.equal(decision.source, 'compatibility-default');
});

test('createNextActionContext does not mutate input events', () => {
  const events = [
    {
      dateTime: '2026-08-02T08:00:00.000Z',
      id: 'glucose-1',
      kind: 'glucose',
      title: 'Glucose',
      value: '6.4',
    },
  ];
  const inputEvents = [...events];

  const context = createNextActionContext({
    events: liftLegacyTestFixtures(inputEvents),
    now: FIXED_NOW,
    presentationDependencies,
    quickAddAvailability: {
      availableCategories: ['insulin'],
    },
  });

  inputEvents.push({
    dateTime: '2026-08-02T09:00:00.000Z',
    id: 'glucose-2',
    kind: 'glucose',
    title: 'Glucose',
    value: '7.0',
  });
  context.recentTimelineEvents.push({
    dateTime: '2026-08-02T10:00:00.000Z',
    id: 'glucose-3',
    kind: 'glucose',
    title: 'Glucose',
    value: '7.5',
  });

  assert.equal(events.length, 1);
  assert.equal(inputEvents.length, 2);
  assert.equal(context.recentTimelineEvents.length, 2);
});

test('engine decisions contain localization keys only', () => {
  const decision = evaluateNextAction(createTestContext());

  assert.match(decision.messageKey, /^dashboard\.nextAction\./);
  assert.match(decision.descriptionKey ?? '', /^dashboard\.nextAction\./);
  if (decision.action.kind === 'quick-add') {
    assert.match(decision.action.labelKey, /^dashboard\.nextAction\./);
  }
});

test('compatibility default and neutral fallback decisions use keys only', () => {
  const defaultDecision = createCompatibilityDefaultDecision();
  const fallbackDecision = createNeutralFallbackDecision();

  for (const decision of [defaultDecision, fallbackDecision]) {
    assert.match(decision.messageKey, /^dashboard\.nextAction\./);
    if (decision.descriptionKey) {
      assert.match(decision.descriptionKey, /^dashboard\.nextAction\./);
    }
  }
});

test('contextual rule with unavailable action falls back to neutral presentation', () => {
  const decision = evaluateNextAction(
    createTestContext({
      quickAddAvailability: {
        availableCategories: ['insulin'],
      },
    }),
    {
      rules: [
        {
          evaluate: () => ({
            action: {
              category: 'glucose',
              kind: 'quick-add',
              labelKey: 'dashboard.nextAction.action',
            },
            messageKey: 'dashboard.nextAction.title',
          }),
          priority: 'important',
          ruleId: 'glucose-rule',
          tieBreakRank: 1,
        },
      ],
    },
  );

  assert.equal(decision.source, 'neutral-fallback');
});

test('dashboard integration preserves insulin quick add presentation', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const presentationDependencies = createTimelinePresentationDependencies({
    formatter: runtime.formatter,
    localization: runtime.localization,
    timeZone: 'Europe/London',
  });

  const presentation = resolveDashboardNextActionPresentation(
    runtime.localization,
    createDashboardNextActionEngineInput(
      [],
      FIXED_NOW,
      presentationDependencies,
    ),
  );

  assert.equal(presentation.state, 'ready');
  if (presentation.state === 'ready') {
    assert.equal(presentation.quickAddCategory, 'insulin');
    assert.equal(presentation.action.title, 'Next action');
    assert.equal(presentation.action.description, 'Add insulin');
    assert.equal(presentation.action.actionLabel, 'Add');
    assert.ok(!presentation.action.title.includes('dashboard.nextAction'));
  }
});

test('dashboard integration uses empty state for neutral fallback', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const presentation = resolveDashboardNextActionPresentation(
    runtime.localization,
    {
      events: [],
      now: FIXED_NOW,
      quickAddAvailability: {
        availableCategories: ['glucose'],
      },
    },
  );

  assert.equal(presentation.state, 'empty');
  if (presentation.state === 'empty') {
    assert.equal(presentation.content.title, 'Next action unavailable');
    assert.equal(
      presentation.content.description,
      'Next action details are temporarily unavailable.',
    );
    assert.ok(!presentation.content.title.includes('dashboard.nextAction'));
  }
});

test('no contextual match does not select neutral fallback when default is safe', () => {
  const decision = evaluateNextAction(createTestContext());

  assert.notEqual(decision.source, 'neutral-fallback');
  assert.equal(decision.source, 'compatibility-default');
});

test('dashboard category availability is the single governed source', () => {
  assert.deepEqual(DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES, [
    'activity',
    'glucose',
    'insulin',
    'medication',
    'note',
    'nutrition',
  ]);
  assert.equal(isDashboardQuickAddCategory('insulin'), true);
  assert.equal(isDashboardQuickAddCategory('glucose'), true);
});
