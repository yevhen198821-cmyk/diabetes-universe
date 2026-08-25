import type { AuthenticatedPrincipal } from '@diabetes-universe/identity';

import { getDashboardAvatarInitials } from '../dashboard/dashboard-header-model';

export interface ProfileUserCardModel {
  readonly avatarInitials: string | null;
  readonly displayName: string;
  readonly email: string;
  readonly showEmail: boolean;
}

export function createProfileUserCardModel(
  principal: AuthenticatedPrincipal,
  labels: Readonly<{
    readonly fallbackName: string;
  }>,
  locale?: string,
): ProfileUserCardModel {
  const trimmedName = principal.displayName?.trim() ?? '';
  const displayName =
    trimmedName.length > 0 ? trimmedName : labels.fallbackName;

  return {
    avatarInitials: getDashboardAvatarInitials(principal.displayName, locale),
    displayName,
    email: principal.email,
    showEmail: principal.email.trim().length > 0,
  };
}
