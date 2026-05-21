import { prisma } from '../config/prisma'

export async function buildTrackingLink(courierCompanyId: string, trackingNumber: string) {
  const company = await prisma.courierCompany.findFirst({ where: { id: courierCompanyId, deletedAt: null } })
  if (!company?.trackingUrl) return null
  return company.trackingUrl.replace('{tracking_number}', encodeURIComponent(trackingNumber))
}

