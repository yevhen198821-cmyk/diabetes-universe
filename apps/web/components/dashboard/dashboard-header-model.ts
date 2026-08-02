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

export function createDashboardHeaderDate(
  currentDate: Date,
  locale: string,
  timeZone: string,
): DashboardHeaderDate | null {
  if (Number.isNaN(currentDate.getTime())) {
    return null;
  }

  try {
    const normalizedLocale = locale.trim();
    const normalizedTimeZone = timeZone.trim();
    const supportedLocales = Intl.DateTimeFormat.supportedLocalesOf([
      normalizedLocale,
    ]);

    if (supportedLocales.length === 0) {
      return null;
    }

    const label = new Intl.DateTimeFormat(normalizedLocale, {
      day: 'numeric',
      month: 'long',
      timeZone: normalizedTimeZone,
      weekday: 'long',
      year: 'numeric',
    }).format(currentDate);
    const dateParts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
      day: '2-digit',
      month: '2-digit',
      timeZone: normalizedTimeZone,
      year: 'numeric',
    }).formatToParts(currentDate);
    const day = dateParts.find((part) => part.type === 'day')?.value;
    const month = dateParts.find((part) => part.type === 'month')?.value;
    const year = dateParts.find((part) => part.type === 'year')?.value;

    if (!day || !month || !year) {
      return null;
    }

    return {
      dateTime: `${year.padStart(4, '0')}-${month}-${day}`,
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
  onAddEvent,
  onAvatarClick,
  state,
  user,
}: DashboardHeaderModelInput): DashboardHeaderViewModel {
  const displayName = user?.displayName?.trim() || null;
  const avatarLabelPrefix = onAvatarClick
    ? dashboardHeaderLabels.avatarAction
    : dashboardHeaderLabels.avatar;

  return {
    addEventDisabled,
    addEventLabel: dashboardHeaderLabels.addEvent,
    avatarInitials: getDashboardAvatarInitials(displayName, date?.locale),
    avatarLabel: displayName
      ? `${avatarLabelPrefix}: ${displayName}`
      : avatarLabelPrefix,
    avatarUrl:
      state === 'ready' && user?.avatarUrl?.trim()
        ? user.avatarUrl.trim()
        : null,
    currentDateLabel: dashboardHeaderLabels.currentDate,
    dateLabel: state === 'loading' ? null : (date?.label ?? null),
    dateTime: state === 'loading' ? null : (date?.dateTime ?? null),
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
