export type {
  AuthRequestResult,
  AuthRequestStatus,
  AuthenticatedPrincipal,
  SessionSummary,
} from './contracts/auth-contracts';
export {
  AUTH_UNAVAILABLE_MESSAGE,
  GENERIC_AUTH_ERROR_MESSAGE,
  GENERIC_MAGIC_LINK_REQUEST_MESSAGE,
} from './contracts/auth-contracts';
export {
  AUTH_ALLOWED_CALLBACK_PATHS,
  AUTH_COOKIE_PREFIX,
  AUTH_FRESH_AUTH_WINDOW_SECONDS,
  AUTH_MAGIC_LINK_EXPIRES_IN_SECONDS,
  AUTH_SESSION_EXPIRES_IN_SECONDS,
  AUTH_SESSION_UPDATE_AGE_SECONDS,
} from './config/auth-constants';
export {
  AuthConfigurationError,
  isAuthEnvironmentConfigured,
  resolveAuthEnvironment,
  resolveSafeAuthCallbackPath,
  type AuthEnvironment,
} from './config/auth-environment';
export {
  isAuthE2eFixtureEndpointEnabled,
  isAuthE2eRuntime,
  isCapturingEmailDeliveryAllowed,
  isExplicitAuthTestRuntime,
  isProductionAuthDeployment,
  shouldAutoMigrateAuthSchema,
} from './config/auth-runtime-guards';
