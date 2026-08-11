import type {
  AuthEmailDelivery,
  MagicLinkEmailPayload,
} from './auth-email-delivery';

export interface CapturedMagicLinkEmail extends MagicLinkEmailPayload {
  readonly capturedAt: string;
}

type CaptureGlobal = typeof globalThis & {
  __duCapturedMagicLinkEmails?: Map<string, CapturedMagicLinkEmail>;
  __duLastCapturedMagicLinkEmail?: string | null;
};

function normalizeCaptureEmail(email: string): string {
  return email.trim().toLowerCase();
}

function readCaptureGlobal(): CaptureGlobal {
  return globalThis as CaptureGlobal;
}

function readCaptureStore(): Map<string, CapturedMagicLinkEmail> {
  const global = readCaptureGlobal();

  if (!global.__duCapturedMagicLinkEmails) {
    global.__duCapturedMagicLinkEmails = new Map();
  }

  return global.__duCapturedMagicLinkEmails;
}

export function createCapturingAuthEmailDelivery(): AuthEmailDelivery {
  return {
    async sendMagicLinkEmail(payload: MagicLinkEmailPayload) {
      const store = readCaptureStore();
      const normalizedEmail = normalizeCaptureEmail(payload.email);

      store.set(normalizedEmail, {
        ...payload,
        email: normalizedEmail,
        capturedAt: new Date().toISOString(),
      });
      readCaptureGlobal().__duLastCapturedMagicLinkEmail = normalizedEmail;
    },
  };
}

export function getCapturedMagicLinkEmailForAddress(
  email: string,
): CapturedMagicLinkEmail | null {
  return readCaptureStore().get(normalizeCaptureEmail(email)) ?? null;
}

export function getLastCapturedMagicLinkEmail(): CapturedMagicLinkEmail | null {
  const lastEmail = readCaptureGlobal().__duLastCapturedMagicLinkEmail;

  if (!lastEmail) {
    return null;
  }

  return readCaptureStore().get(lastEmail) ?? null;
}

export function resetCapturedMagicLinkEmail(): void {
  const global = readCaptureGlobal();
  global.__duCapturedMagicLinkEmails?.clear();
  global.__duLastCapturedMagicLinkEmail = null;
}
