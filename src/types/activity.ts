export type ActivityType = 
  | 'contact_created'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'deal_updated'

export interface Activity {
  id: number
  activity_type: ActivityType
  entity_type: string
  entity_id: number
  user_id: string | null
  user_email: string | null
  metadata: {
    contact_name?: string
    phone?: string
    email?: string
    deal_title?: string
    pipeline_name?: string
    stage_name?: string
    old_stage_name?: string
    new_stage_name?: string
    contact_name?: string
    deal_value?: number
    priority?: string
    [key: string]: any
  }
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  created_at: string
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  contact_created: 'Contato Criado',
  deal_created: 'Deal Criado',
  deal_stage_changed: 'Stage Alterado',
  deal_updated: 'Deal Atualizado',
}

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  contact_created: 'bg-green-100 text-green-700 border-green-200',
  deal_created: 'bg-blue-100 text-blue-700 border-blue-200',
  deal_stage_changed: 'bg-orange-100 text-orange-700 border-orange-200',
  deal_updated: 'bg-purple-100 text-purple-700 border-purple-200',
}
