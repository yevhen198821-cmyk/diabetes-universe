import { defineDraftMessages } from '../../contracts';
import { englishCanonicalMessages } from '../en/messages';

/**
 * Russian draft bundle.
 *
 * Account security sessions strings are localized to match the Russian
 * account shell. Other namespaces remain English placeholders until translated.
 */
export const russianDraftMessages = defineDraftMessages({
  ...englishCanonicalMessages,
  'account.security.sessions.back': 'Безопасность входа',
  'account.security.sessions.confirmRevokeAll.confirm': 'Выйти везде',
  'account.security.sessions.confirmRevokeAll.description':
    'Вы выйдете на этом устройстве и на всех других устройствах.',
  'account.security.sessions.confirmRevokeAll.title':
    'Выйти на всех устройствах?',
  'account.security.sessions.confirmRevokeOne.confirm': 'Завершить сессию',
  'account.security.sessions.confirmRevokeOne.description':
    'Доступ с {clientLabel} будет прекращён.',
  'account.security.sessions.confirmRevokeOne.title': 'Завершить эту сессию?',
  'account.security.sessions.confirmRevokeOthers.confirm':
    'Выйти из других сессий',
  'account.security.sessions.confirmRevokeOthers.description':
    'Другие активные сессии будут завершены. На этом устройстве вход сохранится.',
  'account.security.sessions.confirmRevokeOthers.title':
    'Выйти из других сессий?',
  'account.security.sessions.currentBadge': 'Текущая сессия',
  'account.security.sessions.description':
    'Устройства, на которых выполнен вход в аккаунт.',
  'account.security.sessions.emptyOthers': 'Другие активные сессии не найдены.',
  'account.security.sessions.error.generic':
    'Не удалось выполнить действие. Попробуйте ещё раз.',
  'account.security.sessions.expires': 'Истекает',
  'account.security.sessions.freshAuth.action': 'Подтвердить вход',
  'account.security.sessions.freshAuth.message':
    'Подтвердите вход и повторите действие.',
  'account.security.sessions.passkeysLink': 'Управление Passkeys',
  'account.security.sessions.revokeAll': 'Выйти везде',
  'account.security.sessions.revokeAllPending': 'Выходим на всех устройствах…',
  'account.security.sessions.revokeOne': 'Завершить сессию',
  'account.security.sessions.revokeOnePending': 'Завершаем сессию…',
  'account.security.sessions.revokeOthers': 'Выйти из других сессий',
  'account.security.sessions.revokeOthersPending': 'Выходим из других сессий…',
  'account.security.sessions.signOut': 'Выйти',
  'account.security.sessions.signOutPending': 'Выходим…',
  'account.security.sessions.signedIn': 'Вход выполнен',
  'account.security.sessions.success': 'Действие выполнено.',
  'account.security.sessions.title': 'Активные сессии',
  'common.actions.cancel': 'Отмена',
});
