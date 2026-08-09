export {
  createIdentityService,
  getIdentityService,
  resetIdentityServiceForTests,
  type IdentityService,
} from './identity-service';
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
  getLastCapturedMagicLinkEmail,
  resetCapturedMagicLinkEmail,
} from './email/capturing-auth-email-delivery';
