/** Express 5 types route params as `string | string[]`. */
export function routeParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? ''
  return ''
}
