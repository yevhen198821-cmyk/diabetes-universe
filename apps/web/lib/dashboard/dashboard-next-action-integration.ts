import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import type { NextStep, QuickAddCategory } from '@diabetes-universe/types';

import type { DashboardNextActionMessage } from '../../components/dashboard/dashboard-next-action-model';
import {
  resolveDashboardNextActionEmptyContent,
  resolveNextActionPresentation,
} from '../../components/dashboard/dashboard-next-action-labels';
import { createNextActionContext } from './next-action/next-action-context';
import { evaluateNextAction } from './next-action/next-action-engine';
import { mapNextActionDecision } from './next-action/next-action-mapper';
import { createNeutralFallbackDecision } from './next-action/next-action-fallback';
import { DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES } from './next-action/next-action-availability';
import type { CreateNextActionContextInput } from './next-action/next-action-context';
import type { NextActionMappedPresentation } from './next-action/next-action-mapper';

export type DashboardNextActionEngineInput = CreateNextActionContextInput;

export type DashboardNextActionReadyPresentation = Readonly<{
  action: NextStep;
  quickAddCategory: QuickAddCategory;
  state: 'ready';
}>;

export type DashboardNextActionEmptyPresentation = Readonly<{
  content: DashboardNextActionMessage;
  state: 'empty';
}>;

export type DashboardNextActionPresentation =
  DashboardNextActionReadyPresentation | DashboardNextActionEmptyPresentation;

function resolveFallbackPresentation(
  localization: LocalizationPlatform,
): DashboardNextActionEmptyPresentation {
  const fallbackDecision = createNeutralFallbackDecision();
  const mapped = mapNextActionDecision(
    createNextActionContext({
      events: [],
      now: new Date(0),
      quickAddAvailability: {
        availableCategories: DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES,
      },
    }),
    fallbackDecision,
  );

  if (!mapped || mapped.action.kind !== 'none') {
    return {
      content: resolveDashboardNextActionEmptyContent(localization),
      state: 'empty',
    };
  }

  return {
    content: resolveNextActionPresentation(localization, mapped),
    state: 'empty',
  };
}

function toDashboardPresentation(
  localization: LocalizationPlatform,
  mapped: NextActionMappedPresentation,
): DashboardNextActionPresentation {
  if (mapped.action.kind === 'quick-add') {
    return {
      action: resolveNextActionPresentation(localization, mapped) as NextStep,
      quickAddCategory: mapped.action.category,
      state: 'ready',
    };
  }

  return {
    content: resolveNextActionPresentation(localization, mapped),
    state: 'empty',
  };
}

export function resolveDashboardNextActionPresentation(
  localization: LocalizationPlatform,
  input: DashboardNextActionEngineInput,
): DashboardNextActionPresentation {
  const context = createNextActionContext(input);
  const decision = evaluateNextAction(context);
  const mapped = mapNextActionDecision(context, decision);

  if (!mapped) {
    return resolveFallbackPresentation(localization);
  }

  return toDashboardPresentation(localization, mapped);
}

export function createDashboardNextActionEngineInput(
  events: DashboardNextActionEngineInput['events'],
  now: Date,
): DashboardNextActionEngineInput {
  return {
    events,
    now,
    quickAddAvailability: {
      availableCategories: DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES,
    },
  };
}
