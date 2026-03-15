export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }

  return 'Internal server error'
}

function getErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') return code
  }
  return null
}

function isSupabaseNotFoundError(error: unknown): boolean {
  const code = getErrorCode(error)
  if (code === 'PGRST116') return true

  const message = getErrorMessage(error)
  return (
    message.includes('0 rows') ||
    message.includes('multiple (or no) rows returned')
  )
}

export function normalizeApiError(error: unknown): HttpError {
  if (error instanceof HttpError) return error

  const message = getErrorMessage(error)

  if (message === 'Unauthorized') {
    return new HttpError(401, message)
  }

  if (message.startsWith('Forbidden')) {
    return new HttpError(403, message)
  }

  if (isSupabaseNotFoundError(error)) {
    return new HttpError(404, 'Not found')
  }

  if (message === 'Method not allowed') {
    return new HttpError(405, message)
  }

  return new HttpError(500, message)
}

export function methodNotAllowed(): never {
  throw new HttpError(405, 'Method not allowed')
}

export function notFound(): never {
  throw new HttpError(404, 'Not found')
}
