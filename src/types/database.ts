export type Priority = "low" | "medium" | "high";

export interface Pipeline {
  id: string;
  name: string;
  chatwoot_inbox_id: string;
  created_at: string;
}

export interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  is_default: boolean;
  is_won: boolean;
  created_at: string;
}

export interface Contact {
  id: number;
  chatwoot_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  profile_url: string | null;
  created_at: string;
}

export interface DealTitle {
  id: string;
  title: string;
  is_active: boolean;
  value_default: number | null;
  created_at: string;
}

export interface Deal {
  id: string;
  pipeline_id: string;
  stage_id: string;
  contact_id: number | null;
  title: string;
  deal_value_negotiated: number;
  priority: Priority;
  chatwoot_conversation_id: string | null;
  ai_summary: string | null;
  needs_contract: boolean;
  existing_client_id: number | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_reason: string | null;
  contract_id: number | null;
  created_at: string;
  updated_at: string;
  // Para joins
  contacts?: Contact | null;
}

// ============================================
// ERP TYPES
// ============================================

export interface Company {
  id: number;
  name: string;
  cnpj: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContractType {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ContractTemplate {
  id: number;
  name: string;
  type: "contract" | "receipt";
  contract_type_id: number | null;
  template_html: string;
  css_styles: string | null;
  header_html: string | null;
  footer_html: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  contact_id: number | null;
  full_name: string;
  cpf: string;
  rg_number: string | null;
  rg_issuer_state: string | null;
  rg_issue_date: string | null;
  birth_date: string | null;
  gender: "M" | "F" | "Outro" | null;
  father_name: string | null;
  mother_name: string | null;
  birth_country: string;
  birth_state: string | null;
  birth_city: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  cnh_number: string | null;
  cnh_expiration_date: string | null;
  source: "crm" | "balcao";
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Para joins
  contacts?: Contact | null;
}

export interface Contract {
  id: number;
  company_id: number;
  client_id: number;
  contract_type_id: number;
  template_id: number | null;
  contract_number: string;
  total_value: number;
  discount: number;
  final_value: number;
  installments: number;
  payment_method_id: number | null;
  start_date: string;
  end_date: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Para joins
  companies?: Company;
  clients?: Client;
  contract_types?: ContractType;
  payment_methods?: PaymentMethod;
}


export interface ContractItem {
  id: number;
  contract_id: number;
  catalog_item_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_extra: boolean;
  created_at: string;
  // Joined from catalog
  catalog_items?: {
    is_lesson: boolean;
    vehicle_category: 'car' | 'motorcycle' | 'bus' | 'truck' | null;
  };
}

export interface Receivable {
  id: number;
  contract_id: number;
  company_id: number;
  client_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  paid_date: string | null;
  paid_amount: number | null;
  payment_method_id: number | null;
  receipt_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Para joins
  clients?: Client;
  contracts?: Contract;
  companies?: Company;
}

export interface Receipt {
  id: number;
  company_id: number;
  client_id: number;
  receivable_id: number | null;
  receipt_number: string;
  receipt_date: string;
  amount: number;
  payment_method_id: number | null;
  description: string;
  pdf_url: string | null;
  created_at: string;
  // Para joins
  clients?: Client;
  companies?: Company;
  payment_methods?: PaymentMethod;
}

export interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: "create" | "update" | "delete";
  user_id: string | null;
  user_email: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PDFTemplate {
  id: string
  company_id: number
  template_type: 'contract' | 'receipt'
  show_logo: boolean
  logo_url: string | null
  header_text: string | null
  footer_text: string | null
  show_contact_info: boolean
  primary_color: string
  secondary_color: string
  contract_terms: string | null
  contract_notes: string | null
  receipt_notes: string | null
  created_at: string
  updated_at: string
}

// ============================================
// DATABASE SCHEMA
// ============================================

export interface Database {
  public: {
    Tables: {
      crm_pipelines: {
        Row: Pipeline;
        Insert: Omit<Pipeline, "id" | "created_at">;
        Update: Partial<Omit<Pipeline, "id" | "created_at">>;
      };
      crm_stages: {
        Row: Stage;
        Insert: Omit<Stage, "id" | "created_at">;
        Update: Partial<Omit<Stage, "id" | "created_at">>;
      };
      crm_contacts: {
        Row: Contact;
        Insert: Omit<Contact, "id" | "created_at">;
        Update: Partial<Omit<Contact, "id" | "created_at">>;
      };
      crm_deal_titles: {
        Row: DealTitle;
        Insert: Omit<DealTitle, "id" | "created_at">;
        Update: Partial<Omit<DealTitle, "id" | "created_at">>;
      };
      crm_deals: {
        Row: Deal;
        Insert: Omit<
          Deal,
          | "id"
          | "created_at"
          | "updated_at"
          | "contacts"
          | "needs_contract"
          | "existing_client_id"
          | "is_archived"
          | "archived_at"
          | "archived_reason"
          | "contract_id"
        >;
        Update: Partial<
          Omit<Deal, "id" | "created_at" | "updated_at" | "contacts">
        >;
      };
      app_settings: {
        Row: {
          id: number;
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string | null;
          updated_at?: string;
        };
      };
      // ERP Tables
      erp_companies: {
        Row: Company;
        Insert: Omit<Company, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Company, "id" | "created_at" | "updated_at">>;
      };
      erp_contract_types: {
        Row: ContractType;
        Insert: Omit<ContractType, "id" | "created_at">;
        Update: Partial<Omit<ContractType, "id" | "created_at">>;
      };
      erp_payment_methods: {
        Row: PaymentMethod;
        Insert: Omit<PaymentMethod, "id" | "created_at">;
        Update: Partial<Omit<PaymentMethod, "id" | "created_at">>;
      };
      erp_contract_templates: {
        Row: ContractTemplate;
        Insert: Omit<ContractTemplate, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<ContractTemplate, "id" | "created_at" | "updated_at">
        >;
      };
      erp_clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at" | "contacts">;
        Update: Partial<
          Omit<Client, "id" | "created_at" | "updated_at" | "contacts">
        >;
      };
      erp_contracts: {
        Row: Contract;
        Insert: Omit<
          Contract,
          | "id"
          | "created_at"
          | "updated_at"
          | "companies"
          | "clients"
          | "contract_types"
          | "payment_methods"
        >;
        Update: Partial<
          Omit<
            Contract,
            | "id"
            | "created_at"
            | "updated_at"
            | "companies"
            | "clients"
            | "contract_types"
            | "payment_methods"
          >
        >;
      };
      erp_contract_items: {
        Row: ContractItem;
        Insert: Omit<ContractItem, "id" | "created_at">;
        Update: Partial<Omit<ContractItem, "id" | "created_at">>;
      };
      erp_receivables: {
        Row: Receivable;
        Insert: Omit<
          Receivable,
          | "id"
          | "created_at"
          | "updated_at"
          | "clients"
          | "contracts"
          | "companies"
        >;
        Update: Partial<
          Omit<
            Receivable,
            | "id"
            | "created_at"
            | "updated_at"
            | "clients"
            | "contracts"
            | "companies"
          >
        >;
      };
      erp_receipts: {
        Row: Receipt;
        Insert: Omit<
          Receipt,
          "id" | "created_at" | "clients" | "companies" | "payment_methods"
        >;
        Update: Partial<
          Omit<
            Receipt,
            "id" | "created_at" | "clients" | "companies" | "payment_methods"
          >
        >;
      };
      erp_audit_log: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id" | "created_at">>;
      };
    };
  };
}

// Vehicle types
export type VehicleTransmission = 'manual' | 'automatic'
export type VehicleCategory = 'car' | 'motorcycle' | 'bus' | 'truck'

export interface Vehicle {
  id: number
  plate: string
  renavam: string
  brand: string
  model: string
  transmission: VehicleTransmission
  category: VehicleCategory
  photo_url: string | null
  lesson_price: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  companies?: Array<{ id: number; name: string }>
}

export interface VehicleCompany {
  id: number
  vehicle_id: number
  company_id: number
  created_at: string
}

// Instructor Types
export type CNHCategory = 'A' | 'B' | 'AB' | 'C' | 'D' | 'E' | 'AC' | 'AD' | 'AE'

export interface WeeklySchedule {
  monday: { enabled: boolean; start: string; end: string }
  tuesday: { enabled: boolean; start: string; end: string }
  wednesday: { enabled: boolean; start: string; end: string }
  thursday: { enabled: boolean; start: string; end: string }
  friday: { enabled: boolean; start: string; end: string }
  saturday: { enabled: boolean; start: string; end: string }
  sunday: { enabled: boolean; start: string | null; end: string | null }
}

export interface Instructor {
  id: number
  full_name: string
  cpf: string
  rg: string | null
  birth_date: string | null
  phone: string
  email: string | null
  address: string | null
  cnh: string
  cnh_category: CNHCategory
  cnh_expiration_date: string
  credencial_detran: string
  credencial_expiration_date: string
  hourly_rate: number
  photo_url: string | null
  lesson_duration_minutes: number
  weekly_schedule: WeeklySchedule
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined data
  companies?: Array<{ id: number; name: string }>
}

export interface InstructorCompany {
  id: number
  instructor_id: number
  company_id: number
  created_at: string
}

export interface InstructorBlock {
  id: number
  instructor_id: number
  block_date: string
  start_time: string
  end_time: string
  reason: string | null
  all_day: boolean
  created_at: string
  created_by: string | null
}

// Lesson Types
export type LessonStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

export interface Lesson {
  id: number
  contract_item_id: number
  instructor_id: number
  vehicle_id: number
  lesson_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: LessonStatus
  topic: string | null
  location: string | null
  notes: string | null
  instructor_notes: string | null
  
  // Audit fields
  scheduled_at: string
  scheduled_by: string
  completed_at: string | null
  completed_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  no_show_at: string | null
  no_show_by: string | null
  
  // Webhook tracking
  webhook_sent_at: string | null
  reminder_sent_at: string | null
  
  created_at: string
  updated_at: string
  
  // Joined data
  contract_items?: ContractItem & {
    contracts?: Contract & {
      clients?: Client
    }
  }
  instructors?: Instructor
  vehicles?: Vehicle
}

export interface LessonAudit {
  id: number
  lesson_id: number
  action: string
  performed_by: string
  performed_at: string
  previous_status: string | null
  new_status: string | null
  reason: string | null
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
}

export interface LessonConflict {
  conflict_type: 'instructor' | 'vehicle'
  conflicting_lesson_id: number
  details: string
}

// Form Types
export interface CreateLessonFormData {
  contract_item_id: number
  instructor_id: number
  vehicle_id: number
  lesson_date: string
  start_time: string
  topic?: string
  location?: string
  notes?: string
}

export interface LessonFilters {
  start_date?: string
  end_date?: string
  instructor_id?: number
  vehicle_id?: number
  contract_id?: number
  client_id?: number
  status?: LessonStatus
  search?: string
}

export interface AvailabilitySlot {
  start: string
  end: string
  available: boolean
  reason?: string
}

export interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  backgroundColor: string
  borderColor: string
  data: Lesson
}

