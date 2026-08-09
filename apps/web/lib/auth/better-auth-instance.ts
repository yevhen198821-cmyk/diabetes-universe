import { resolveAuthEnvironment } from '@diabetes-universe/identity';
import {
  getIdentityService,
  type BetterAuthInstance,
} from '@diabetes-universe/identity/server';

let betterAuthInstancePromise: Promise<BetterAuthInstance> | null = null;

export async function getBetterAuthInstance(): Promise<BetterAuthInstance> {
  if (!betterAuthInstancePromise) {
    betterAuthInstancePromise = getIdentityService(
      resolveAuthEnvironment(),
    ).then((service) => service.auth);
  }

  return betterAuthInstancePromise;
}
