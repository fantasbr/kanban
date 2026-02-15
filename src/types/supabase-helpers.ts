// Shared types for Supabase RPC function responses and common data structures

/**
 * Response from check_lesson_conflicts RPC function
 */
export interface LessonConflictResponse {
  conflict_type: 'instructor' | 'vehicle' | 'student'
  details: string
  conflicting_lesson_id?: number
}

/**
 * Response from check_instructor_availability RPC function
 */
export interface InstructorAvailabilityResponse {
  is_available: boolean
  reason?: string
  block_type?: 'vacation' | 'sick_leave' | 'training' | 'other'
}

/**
 * Generic error response from API/RPC calls
 */
export interface ErrorResponse {
  message: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Webhook log entry
 */
export interface WebhookLog {
  id: string
  subscription_id: string
  event_type: string
  payload: Record<string, unknown>
  status_code?: number
  response_body?: string
  error_message?: string
  duration_ms?: number
  attempt_number: number
  created_at: string
}

/**
 * Webhook subscription data for creation
 */
export interface WebhookCreateData {
  name: string
  url: string
  events: string[]
  retryCount: number
  timeoutSeconds: number
}

/**
 * Chart data point for reports
 */
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

/**
 * Export data for reports (generic)
 */
export type ExportData = unknown[]

/**
 * File upload event type
 */
export interface FileUploadEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement & {
    files: FileList
  }
}

/**
 * Generic mutation error type
 */
export interface MutationError extends Error {
  code?: string
  details?: unknown
}

// ============================================
// SUPABASE TYPE HELPERS FOR INSERT/UPDATE
// ============================================

/**
 * These utility types help avoid @ts-expect-error when working with Supabase operations.
 * They provide properly typed payloads for INSERT and UPDATE operations.
 * 
 * @example
 * ```typescript
 * import type { ReceiptInsert, ReceivableUpdate } from '@/types/supabase-helpers'
 * 
 * // ✅ Type-safe insert
 * const receiptData: ReceiptInsert = {
 *   company_id: 1,
 *   client_id: 2,
 *   receipt_number: 'REC-001',
 *   // ... other fields
 * }
 * await supabase.from('erp_receipts').insert(receiptData)
 * 
 * // ✅ Type-safe update
 * const updates: ReceivableUpdate = {
 *   status: 'paid',
 *   paid_date: '2024-01-01'
 * }
 * await supabase.from('erp_receivables').update(updates)
 * ```
 */

import type { Database } from './database'

// Generic type extractors
type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Generic helpers
export type InsertPayload<T extends keyof Database['public']['Tables']> = TableInsert<T>
export type UpdatePayload<T extends keyof Database['public']['Tables']> = TableUpdate<T>
export type RowWithJoins<T extends keyof Database['public']['Tables']> = TableRow<T>

// Client types
export type ClientInsert = InsertPayload<'erp_clients'>
export type ClientUpdate = UpdatePayload<'erp_clients'>

// Contract types
export type ContractInsert = InsertPayload<'erp_contracts'>
export type ContractUpdate = UpdatePayload<'erp_contracts'>
export type ContractItemInsert = InsertPayload<'erp_contract_items'>
export type ContractItemUpdate = UpdatePayload<'erp_contract_items'>

// Financial types
export type ReceivableInsert = InsertPayload<'erp_receivables'>
export type ReceivableUpdate = UpdatePayload<'erp_receivables'>
export type ReceiptInsert = InsertPayload<'erp_receipts'>
export type ReceiptUpdate = UpdatePayload<'erp_receipts'>

// Config types
export type CompanyInsert = InsertPayload<'erp_companies'>
export type CompanyUpdate = UpdatePayload<'erp_companies'>
export type ContractTypeInsert = InsertPayload<'erp_contract_types'>
export type ContractTypeUpdate = UpdatePayload<'erp_contract_types'>
export type PaymentMethodInsert = InsertPayload<'erp_payment_methods'>
export type PaymentMethodUpdate = UpdatePayload<'erp_payment_methods'>
export type ContractTemplateInsert = InsertPayload<'erp_contract_templates'>
export type ContractTemplateUpdate = UpdatePayload<'erp_contract_templates'>

// Instructor & Vehicle types
export type InstructorInsert = InsertPayload<'erp_instructors'>
export type InstructorUpdate = UpdatePayload<'erp_instructors'>
export type LessonInsert = InsertPayload<'erp_lessons'>
export type LessonUpdate = UpdatePayload<'erp_lessons'>

// CRM types
export type ContactInsert = InsertPayload<'crm_contacts'>
export type ContactUpdate = UpdatePayload<'crm_contacts'>
export type DealInsert = InsertPayload<'crm_deals'>
export type DealUpdate = UpdatePayload<'crm_deals'>
export type DealItemInsert = InsertPayload<'crm_deal_items'>
export type DealItemUpdate = UpdatePayload<'crm_deal_items'>

