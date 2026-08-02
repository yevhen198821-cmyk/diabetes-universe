export type DashboardHeaderState = 'error' | 'loading' | 'ready';

export interface DashboardHeaderUser {
  readonly avatarUrl?: string | null;
  readonly displayName?: string | null;
}

export interface DashboardHeaderModelInput {
  readonly currentDate: Date;
  readonly errorMessage?: string;
  readonly locale: string;
  readonly onAddEvent: () => void;
  readonly onAvatarClick?: () => void;
  readonly state: DashboardHeaderState;
  readonly timeZone: string;
  readonly user: DashboardHeaderUser | null;
}

export interface DashboardHeaderViewModel {
  readonly addEventLabel: string;
  readonly avatarInitials: string | null;
  readonly avatarLabel: string;
  readonly avatarUrl: string | null;
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

export const DASHBOARD_DESKTOP_ACTION_CLASS_NAME =
  'hidden min-h-11 items-center justify-center gap-2 lg:inline-flex';

export const DASHBOARD_AVATAR_TARGET_CLASS_NAME =
  'grid size-11 shrink-0 place-items-center overflow-hidden rounded-full';

export const dashboardHeaderLabels = {
  addEvent: 'Добавить событие',
  avatar: 'Профиль пользователя',
  avatarAction: 'Открыть профиль',
  currentDate: 'Текущая дата',
  dateUnavailable: 'Дата недоступна',
  defaultError: 'Не удалось загрузить данные заголовка.',
  loading: 'Загрузка данных заголовка',
  productName: 'Diabetes Universe',
} as const;

export function formatDashboardDate(
  currentDate: Date,
  locale: string,
  timeZone: string,
): string | null {
  if (Number.isNaN(currentDate.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      timeZone,
      weekday: 'long',
      year: 'numeric',
    }).format(currentDate);
  } catch {
    return null;
  }
}

export function getDashboardAvatarInitials(
  displayName: string | null | undefined,
  locale: string,
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
    return initials.toLocaleUpperCase(locale);
  } catch {
    return initials.toUpperCase();
  }
}

export function createDashboardHeaderViewModel({
  currentDate,
  errorMessage,
  locale,
  onAddEvent,
  onAvatarClick,
  state,
  timeZone,
  user,
}: DashboardHeaderModelInput): DashboardHeaderViewModel {
  const displayName = user?.displayName?.trim() || null;
  const validDate = Number.isNaN(currentDate.getTime()) ? null : currentDate;
  const avatarLabelPrefix = onAvatarClick
    ? dashboardHeaderLabels.avatarAction
    : dashboardHeaderLabels.avatar;

  return {
    addEventLabel: dashboardHeaderLabels.addEvent,
    avatarInitials: getDashboardAvatarInitials(displayName, locale),
    avatarLabel: displayName
      ? `${avatarLabelPrefix}: ${displayName}`
      : avatarLabelPrefix,
    avatarUrl:
      state === 'ready' && user?.avatarUrl?.trim()
        ? user.avatarUrl.trim()
        : null,
    currentDateLabel: dashboardHeaderLabels.currentDate,
    dateLabel:
      state === 'loading'
        ? null
        : formatDashboardDate(currentDate, locale, timeZone),
    dateTime: validDate?.toISOString() ?? null,
    dateUnavailableLabel: dashboardHeaderLabels.dateUnavailable,
    errorMessage:
      state === 'error'
        ? errorMessage?.trim() || dashboardHeaderLabels.defaultError
        : null,
    isError: state === 'error',
    isLoading: state === 'loading',
    loadingLabel: dashboardHeaderLabels.loading,
    onAddEvent,
    onAvatarClick,
    productName: dashboardHeaderLabels.productName,
  };
}
