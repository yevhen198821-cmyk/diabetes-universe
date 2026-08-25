export {
  createIdentityService,
  getIdentityService,
  resetIdentityServiceForTests,
  type IdentityService,
} from './identity-service';
export type {
  AccountSessionClientKind,
  AccountSessionSummary,
  SessionManagementCode,
  SessionManagementResult,
} from '../contracts/session-management-contracts';
export {
  SessionManagementError,
  SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE,
  SESSION_FRESH_AUTH_REQUIRED_MESSAGE,
  SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
  SESSION_MANAGEMENT_SUCCESS_MESSAGE,
} from './session-management/session-management-errors';
export { mapUserAgentLabel } from '../presentation/map-user-agent-label';
export {
  createBetterAuth,
  type BetterAuthInstance,
} from './create-better-auth';
export {
  closeAuthDatabase,
  createAuthDatabase,
  type AuthDatabase,
} from './database/create-auth-database';
export {
  getCapturedMagicLinkEmailForAddress,
  getLastCapturedMagicLinkEmail,
  resetCapturedMagicLinkEmail,
} from './email/capturing-auth-email-delivery';
export { markCurrentSessionStaleForE2eFixture } from './e2e/mark-current-session-stale-for-fixture';
export {
  probeAuthDatabaseHealth,
  type AuthDatabaseProbeResult,
} from './probe-auth-database';
export {
  USER_AVATAR_ALLOWED_INPUT_MIME_TYPES,
  USER_AVATAR_API_PATH,
  USER_AVATAR_MAX_UPLOAD_BYTES,
  USER_AVATAR_OUTPUT_CONTENT_TYPE,
} from './avatar/avatar-constants';
export type {
  AvatarMutationCode,
  AvatarMutationResult,
  UserAvatarContent,
} from '../contracts/avatar-contracts';
