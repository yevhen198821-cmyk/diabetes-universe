import type { EventCardProps } from '@diabetes-universe/ui';
import { Sparkles } from 'lucide-react';
import { createElement } from 'react';

import type { DashboardAiInsightReadyViewModel } from './dashboard-ai-insight-model';

type DashboardAiInsightCardProps = Omit<EventCardProps, 'onClick' | 'variant'>;

export function mapDashboardAiInsightToCard(
  insight: DashboardAiInsightReadyViewModel,
): DashboardAiInsightCardProps {
  return {
    context: insight.relatedEventsLabel,
    icon: createElement(Sparkles, {
      'aria-hidden': true,
      size: 15,
    }),
    subtitle: insight.summary,
    time: insight.displayTime,
    title: insight.title,
    type: 'ai_insight',
    unit: '',
    value: insight.title,
  };
}
