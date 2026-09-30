import { Resend } from 'resend';

import type {
  AuthEmailDelivery,
  MagicLinkEmailPayload,
} from './auth-email-delivery';

export interface ResendAuthEmailDeliveryOptions {
  readonly apiKey: string;
  readonly fromAddress: string;
}

export function createResendAuthEmailDelivery(
  options: ResendAuthEmailDeliveryOptions,
  resend: Pick<Resend, 'emails'> = new Resend(options.apiKey),
): AuthEmailDelivery {
  return {
    async sendMagicLinkEmail({ email, url }: MagicLinkEmailPayload) {
      let response;

      try {
        response = await resend.emails.send({
          from: options.fromAddress,
          to: email,
          subject: 'Вход в Diabetes Universe',
          text: `Перейдите по ссылке, чтобы войти в Diabetes Universe:\n\n${url}\n\nСсылка действует ограниченное время. Если вы не запрашивали вход, просто проигнорируйте это письмо.`,
        });
      } catch {
        console.error('[auth-email] Resend transport failed');
        throw new Error('Auth email delivery failed');
      }

      const { error } = response;

      if (error) {
        // Resend reports API failures in the response instead of throwing.
        // Never log the recipient, link, API key, or the provider's free-form message.
        console.error('[auth-email] Resend rejected the magic link', {
          category:
            error.name === 'validation_error' ||
            error.name === 'rate_limit_exceeded'
              ? error.name
              : 'provider_error',
        });
        throw new Error('Auth email delivery failed');
      }
    },
  };
}
