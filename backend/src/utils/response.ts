export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T | null
  error: unknown | null
}

export function ok<T>(message: string, data: T): ApiResponse<T> {
  return { success: true, message, data, error: null }
}

export function fail(message: string, error: unknown, data: null = null): ApiResponse<null> {
  return { success: false, message, data, error }
}

