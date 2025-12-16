export type Priority = 'low' | 'medium' | 'high'

export interface Pipeline {
  id: string
  name: string
  chatwoot_inbox_id: string
  created_at: string
}

export interface Stage {
  id: string
  pipeline_id: string
  name: string
  position: number
  is_default: boolean
  is_won: boolean
  created_at: string
}

export interface Contact {
  id: number
  chatwoot_id: number
  name: string
  phone: string | null
  email: string | null
  profile_url: string | null
  created_at: string
}

export interface DealTitle {
  id: string
  title: string
  is_active: boolean
  value_default: number | null
  created_at: string
}

export interface Deal {
  id: string
  pipeline_id: string
  stage_id: string
  contact_id: number | null
  title: string
  deal_value_negotiated: number
  priority: Priority
  chatwoot_conversation_id: string | null
  ai_summary: string | null
  created_at: string
  updated_at: string
  // Para joins
  contacts?: Contact | null
}

export interface Database {
  public: {
    Tables: {
      crm_pipelines: {
        Row: Pipeline
        Insert: Omit<Pipeline, 'id' | 'created_at'>
        Update: Partial<Omit<Pipeline, 'id' | 'created_at'>>
      }
      crm_stages: {
        Row: Stage
        Insert: Omit<Stage, 'id' | 'created_at'>
        Update: Partial<Omit<Stage, 'id' | 'created_at'>>
      }
      crm_contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at'>>
      }
      crm_deal_titles: {
        Row: DealTitle
        Insert: Omit<DealTitle, 'id' | 'created_at'>
        Update: Partial<Omit<DealTitle, 'id' | 'created_at'>>
      }
      crm_deals: {
        Row: Deal
        Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contacts'>
        Update: Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contacts'>>
      }
      app_settings: {
        Row: {
          id: number
          key: string
          value: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string | null
          updated_at?: string
        }
      }
    }
  }
}
