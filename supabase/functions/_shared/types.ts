export interface ApiKey {
  id: string
  permissions: string[]
  is_active: boolean
  expires_at: string | null
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  total?: number
}

export interface PaginationParams {
  limit: number
  offset: number
}
