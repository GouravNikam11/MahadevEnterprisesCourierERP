export function buildTrackingLink(
  trackingUrlTemplate: string | null | undefined,
  trackingNumber: string,
): string | null {
  if (!trackingUrlTemplate?.trim()) return null
  return trackingUrlTemplate.replace('{tracking_number}', encodeURIComponent(trackingNumber))
}
