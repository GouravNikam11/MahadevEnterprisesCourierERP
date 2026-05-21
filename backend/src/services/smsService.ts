import { prisma } from '../config/prisma'
import { env } from '../config/env'
import axios from 'axios'

export type SmsSendInput = {
  toPhone: string
  message: string
  template?: string
  accountBookingId?: string
  cashBookingId?: string
}

export async function sendSms(input: SmsSendInput) {
  const provider = env.SMS_PROVIDER ?? 'mock'

  let status = provider === 'mock' ? 'MOCK_SENT' : 'PENDING'
  let providerMsgId: string | null = null

  if (provider !== 'mock') {
    try {
      if (!env.SMS_API_KEY || !env.SMS_SENDER_ID) {
        status = 'SKIPPED_MISSING_CONFIG'
      } else if (provider === 'fast2sms') {
        // Basic Fast2SMS quick API (template-specific setups can vary)
        const r = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            route: 'q',
            message: input.message,
            language: 'english',
            flash: 0,
            numbers: input.toPhone.replace(/\D/g, ''),
            sender_id: env.SMS_SENDER_ID,
          },
          { headers: { authorization: env.SMS_API_KEY } },
        )
        providerMsgId = r.data?.request_id ?? r.data?.requestId ?? null
        status = r.status >= 200 && r.status < 300 ? 'SENT' : 'FAILED'
      } else if (provider === 'msg91') {
        // MSG91 integration differs by product (Flow/Campaign/OTP). This is a minimal “send” placeholder.
        const r = await axios.post(
          'https://api.msg91.com/api/v2/sendsms',
          {
            sender: env.SMS_SENDER_ID,
            route: '4',
            country: '91',
            sms: [{ message: input.message, to: [input.toPhone.replace(/\D/g, '')] }],
          },
          { headers: { authkey: env.SMS_API_KEY, 'content-type': 'application/json' } },
        )
        providerMsgId = r.data?.request_id ?? r.data?.type ?? null
        status = r.status >= 200 && r.status < 300 ? 'SENT' : 'FAILED'
      }
    } catch (e: any) {
      status = 'FAILED'
      providerMsgId = e?.response?.data?.message ?? e?.message ?? null
    }
  }

  const log = await prisma.smsLog.create({
    data: {
      provider,
      toPhone: input.toPhone,
      template: input.template ?? null,
      message: input.message,
      status,
      providerMsgId,
      accountBookingId: input.accountBookingId ?? null,
      cashBookingId: input.cashBookingId ?? null,
    } as any,
  })

  return { ok: status === 'SENT' || status === 'MOCK_SENT', provider, logId: log.id, status }
}

