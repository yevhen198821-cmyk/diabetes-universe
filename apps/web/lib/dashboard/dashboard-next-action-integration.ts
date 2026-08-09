import type { LocalizationPlatform } from '@diabetes-universe/i18n';
import type { NextStep, QuickAddCategory } from '@diabetes-universe/types';

import type { DashboardNextActionMessage } from '../../components/dashboard/dashboard-next-action-model';
import {
  resolveNextActionInformationalContent,
  resolveNextActionReadyStep,
} from '../../components/dashboard/dashboard-next-action-labels';
import type { TimelinePresentationDependencies } from '../timeline/presentation';
import { DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES } from './next-action/next-action-availability';
import {
  createNextActionContext,
  type CreateNextActionContextInput,
} from './next-action/next-action-context';
import { evaluateNextAction } from './next-action/next-action-engine';
import {
  mapNeutralFallbackPresentation,
  mapNextActionDecision,
  type NextActionMappedPresentation,
} from './next-action/next-action-mapper';

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
  const mapped = mapNeutralFallbackPresentation();

  return {
    content: resolveNextActionInformationalContent(localization, {
      descriptionKey: mapped.descriptionKey,
      messageKey: mapped.messageKey,
    }),
    state: 'empty',
  };
}

function toDashboardPresentation(
  localization: LocalizationPlatform,
  mapped: NextActionMappedPresentation,
): DashboardNextActionPresentation {
  switch (mapped.kind) {
    case 'quick-add':
      return {
        action: resolveNextActionReadyStep(localization, {
          actionLabelKey: mapped.actionLabelKey,
          descriptionKey: mapped.descriptionKey,
          messageKey: mapped.messageKey,
        }),
        quickAddCategory: mapped.category,
        state: 'ready',
      };
    case 'navigate':
    case 'none':
      return {
        content: resolveNextActionInformationalContent(localization, {
          descriptionKey: mapped.descriptionKey,
          messageKey: mapped.messageKey,
        }),
        state: 'empty',
      };
    default: {
      const exhaustive: never = mapped;
      return exhaustive;
    }
  }
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
  presentationDependencies: TimelinePresentationDependencies,
): DashboardNextActionEngineInput {
  return {
    events,
    now,
    presentationDependencies,
    quickAddAvailability: {
      availableCategories: DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES,
    },
  };
}
