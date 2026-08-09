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
): AuthEmailDelivery {
  const resend = new Resend(options.apiKey);

  return {
    async sendMagicLinkEmail({ email, url }: MagicLinkEmailPayload) {
      await resend.emails.send({
        from: options.fromAddress,
        to: email,
        subject: 'Вход в Diabetes Universe',
        text: `Перейдите по ссылке, чтобы войти в Diabetes Universe:\n\n${url}\n\nСсылка действует ограниченное время. Если вы не запрашивали вход, просто проигнорируйте это письмо.`,
      });
    },
  };
}
