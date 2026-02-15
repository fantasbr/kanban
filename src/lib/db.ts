/**
 * Type-safe Supabase Client Wrapper
 * 
 * Este wrapper resolve o problema de tipos `never` do Supabase
 * fornecendo type assertions corretas para operações INSERT/UPDATE.
 * 
 * @see https://supabase.com/docs/guides/api/rest/generating-types
 */

import { supabase } from './supabase'
import type { Database } from '@/types/database'

// Type helpers
type Tables = Database['public']['Tables']
type TableName = keyof Tables

/**
 * Wrapper type-safe para operações Supabase
 * 
 * Uso:
 * ```typescript
 * import { db } from '@/lib/db'
 * 
 * // INSERT
 * const data: ReceiptInsert = { ... }
 * await db.insert('erp_receipts', data)
 * 
 * // UPDATE
 * const updates: ReceivableUpdate = { status: 'paid' }
 * await db.update('erp_receivables', updates).eq('id', 1)
 * ```
 */
export const db = {
  /**
   * Type-safe INSERT operation
   * 
   * @example
   * ```typescript
   * const receipt: ReceiptInsert = { company_id: 1, ... }
   * const { data, error } = await db.insert('erp_receipts', receipt)
   * ```
   */
  insert<T extends TableName>(
    table: T,
    data: Tables[T]['Insert'] | Tables[T]['Insert'][]
  ) {
    // Type assertion para contornar inferência incorreta do Supabase
    // TODO: Remover 'as any' quando tipos forem regenerados oficialmente
    return supabase.from(table).insert(data as any)
  },

  /**
   * Type-safe UPDATE operation
   * 
   * @example
   * ```typescript
   * const updates: ReceivableUpdate = { status: 'paid' }
   * const { data, error } = await db.update('erp_receivables', updates).eq('id', 1)
   * ```
   */
  update<T extends TableName>(
    table: T,
    data: Tables[T]['Update']
  ) {
    // Type assertion para contornar inferência incorreta do Supabase
    // TODO: Remover 'as any' quando tipos forem regenerados oficialmente
    return supabase.from(table).update(data as any)
  },

  /**
   * SELECT operation (passa direto para Supabase)
   * 
   * @example
   * ```typescript
   * const { data } = await db.from('erp_clients').select('*')
   * ```
   */
  from<T extends TableName>(table: T) {
    return supabase.from(table)
  },

  /**
   * RPC operation (passa direto para Supabase)
   * 
   * @example
   * ```typescript
   * const { data } = await db.rpc('generate_document_number', { doc_type: 'receipt' })
   * ```
   */
  rpc: supabase.rpc.bind(supabase),

  /**
   * Auth (passa direto para Supabase)
   */
  auth: supabase.auth,

  /**
   * Storage (passa direto para Supabase)
   */
  storage: supabase.storage,
}

/**
 * Export do cliente original para casos especiais
 */
export { supabase }
