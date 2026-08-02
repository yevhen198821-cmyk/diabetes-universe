import type { DashboardHeaderLabels } from './dashboard-header-labels';

export type DashboardHeaderState = 'error' | 'loading' | 'ready';

export interface DashboardHeaderDate {
  readonly dateTime: string;
  readonly label: string;
  readonly locale: string;
  readonly timeZone: string;
}

export interface DashboardHeaderUser {
  readonly avatarUrl?: string | null;
  readonly displayName?: string | null;
}

export interface DashboardHeaderModelInput {
  readonly addEventDisabled?: boolean;
  readonly date: DashboardHeaderDate | null;
  readonly errorMessage?: string;
  readonly labels: DashboardHeaderLabels;
  readonly onAddEvent: () => void;
  readonly onAvatarClick?: () => void;
  readonly state: DashboardHeaderState;
  readonly user: DashboardHeaderUser | null;
}

export interface DashboardHeaderViewModel {
  readonly addEventDisabled: boolean;
  readonly addEventLabel: string;
  readonly avatarInitials: string | null;
  readonly avatarLabel: string;
  readonly avatarUrl: string | null;
  readonly currentDateAriaLabel: string | null;
  readonly currentDateLabel: string;
  readonly dateLabel: string | null;
  readonly dateTime: string | null;
  readonly dateUnavailableLabel: string;
  readonly errorMessage: string | null;
  readonly isError: boolean;
  readonly isLoading: boolean;
  readonly loadingLabel: string;
  readonly onAddEvent: () => void;
  readonly onAvatarClick?: () => void;
  readonly productName: string;
}

export interface DashboardHeaderDateInput {
  readonly currentDate: Date;
  readonly formatCalendarDateKey: (date: Date) => string | null;
  readonly formatDisplayDate: (date: Date) => string;
  readonly locale: string;
  readonly timeZone: string;
}

export function createDashboardHeaderDate({
  currentDate,
  formatCalendarDateKey,
  formatDisplayDate,
  locale,
  timeZone,
}: DashboardHeaderDateInput): DashboardHeaderDate | null {
  if (Number.isNaN(currentDate.getTime())) {
    return null;
  }

  const normalizedLocale = locale.trim();
  const normalizedTimeZone = timeZone.trim();

  if (normalizedLocale.length === 0 || normalizedTimeZone.length === 0) {
    return null;
  }

  try {
    const dateTime = formatCalendarDateKey(currentDate);

    if (!dateTime) {
      return null;
    }

    const label = formatDisplayDate(currentDate).trim();

    if (label.length === 0) {
      return null;
    }

    return {
      dateTime,
      label,
      locale: normalizedLocale,
      timeZone: normalizedTimeZone,
    };
  } catch {
    return null;
  }
}

export function getDashboardAvatarInitials(
  displayName: string | null | undefined,
  locale?: string,
): string | null {
  const nameParts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (nameParts.length === 0) {
    return null;
  }

  const selectedParts =
    nameParts.length === 1
      ? [nameParts[0]]
      : [nameParts[0], nameParts[nameParts.length - 1]];
  const initials = selectedParts
    .map((part) => Array.from(part)[0] ?? '')
    .join('');

  try {
    if (!locale) {
      return initials.toUpperCase();
    }

    return initials.toLocaleUpperCase(locale);
  } catch {
    return initials.toUpperCase();
  }
}

export function getDashboardAvatarImageUrl(
  avatarUrl: string | null,
  failedAvatarUrl: string | null,
): string | null {
  const normalizedAvatarUrl = avatarUrl?.trim() || null;
  const normalizedFailedUrl = failedAvatarUrl?.trim() || null;

  return normalizedAvatarUrl && normalizedAvatarUrl !== normalizedFailedUrl
    ? normalizedAvatarUrl
    : null;
}

export function createDashboardHeaderViewModel({
  addEventDisabled = false,
  date,
  errorMessage,
  labels,
  onAddEvent,
  onAvatarClick,
  state,
  user,
}: DashboardHeaderModelInput): DashboardHeaderViewModel {
  const displayName = user?.displayName?.trim() || null;
  const avatarLabelPrefix = onAvatarClick ? labels.avatarAction : labels.avatar;
  const dateLabel = state === 'loading' ? null : (date?.label ?? null);

  return {
    addEventDisabled,
    addEventLabel: labels.addEvent,
    avatarInitials: getDashboardAvatarInitials(displayName, date?.locale),
    avatarLabel: displayName
      ? `${avatarLabelPrefix}: ${displayName}`
      : avatarLabelPrefix,
    avatarUrl:
      state === 'ready' && user?.avatarUrl?.trim()
        ? user.avatarUrl.trim()
        : null,
    currentDateAriaLabel:
      dateLabel === null ? null : `${labels.currentDate}: ${dateLabel}`,
    currentDateLabel: labels.currentDate,
    dateLabel,
    dateTime: state === 'loading' ? null : (date?.dateTime ?? null),
    dateUnavailableLabel: labels.dateUnavailable,
    errorMessage:
      state === 'error' ? errorMessage?.trim() || labels.defaultError : null,
    isError: state === 'error',
    isLoading: state === 'loading',
    loadingLabel: labels.loading,
    onAddEvent,
    onAvatarClick,
    productName: labels.productName,
  };
}
