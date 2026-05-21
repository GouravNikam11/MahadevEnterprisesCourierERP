import { env } from '../config/env'
import { logger } from '../config/logger'

export type SendEmailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(input: SendEmailInput) {
  const provider = env.EMAIL_PROVIDER ?? 'mock'

  if (provider === 'mock') {
    logger.info('Email (mock)', {
      to: input.to,
      subject: input.subject,
      preview: input.text.slice(0, 200),
    })
    return { ok: true, provider: 'mock' as const }
  }

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.EMAIL_FROM) {
    logger.warn('Email skipped: SMTP not configured', { to: input.to, subject: input.subject })
    return { ok: false, provider: 'smtp' as const, reason: 'MISSING_CONFIG' }
  }

  try {
    const nodemailer = await import('nodemailer')
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    })

    await transport.sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, '<br>'),
    })

    return { ok: true, provider: 'smtp' as const }
  } catch (e) {
    logger.error('Email send failed', { error: e, to: input.to })
    return { ok: false, provider: 'smtp' as const, reason: 'SEND_FAILED' }
  }
}

export function buildPasswordResetEmail(resetUrl: string) {
  const subject = 'Reset your Mahadev Enterprises Courier ERP password'
  const text = [
    'You requested a password reset.',
    '',
    'Open this link to set a new password (valid for 1 hour):',
    resetUrl,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n')
  return { subject, text }
}
