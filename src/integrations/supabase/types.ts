export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      capital_assets: {
        Row: {
          asset_type: string
          cost: number
          created_at: string
          depreciation_hint: string | null
          description: string
          id: string
          notes: string | null
          purchase_date: string
          receipt_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          cost?: number
          created_at?: string
          depreciation_hint?: string | null
          description: string
          id?: string
          notes?: string | null
          purchase_date: string
          receipt_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          cost?: number
          created_at?: string
          depreciation_hint?: string | null
          description?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          receipt_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capital_assets_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "project_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string
          created_at: string
          email: string
          id: string
          is_1099_eligible: boolean | null
          is_subcontractor: boolean | null
          legal_name: string | null
          name: string
          phone: string
          tin_encrypted: string | null
          tin_type: string | null
          user_id: string | null
        }
        Insert: {
          address: string
          created_at?: string
          email: string
          id?: string
          is_1099_eligible?: boolean | null
          is_subcontractor?: boolean | null
          legal_name?: string | null
          name: string
          phone: string
          tin_encrypted?: string | null
          tin_type?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          id?: string
          is_1099_eligible?: boolean | null
          is_subcontractor?: boolean | null
          legal_name?: string | null
          name?: string
          phone?: string
          tin_encrypted?: string | null
          tin_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          irs_code: string | null
          is_default: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          irs_code?: string | null
          is_default?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          irs_code?: string | null
          is_default?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_reminders: {
        Row: {
          id: string
          invoice_id: string
          method: string
          reminder_type: string
          sent_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          method: string
          reminder_type: string
          sent_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          method?: string
          reminder_type?: string
          sent_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          items: Json
          notes: string | null
          paid_at: string | null
          payment_token: string | null
          quote_id: string | null
          receipt_attachments: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_token?: string | null
          quote_id?: string | null
          receipt_attachments?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_token?: string | null
          quote_id?: string | null
          receipt_attachments?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      irs_mileage_rates: {
        Row: {
          created_at: string | null
          rate_per_mile: number
          year: number
        }
        Insert: {
          created_at?: string | null
          rate_per_mile: number
          year: number
        }
        Update: {
          created_at?: string | null
          rate_per_mile?: number
          year?: number
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sku: string | null
          supplier: string | null
          unit: string
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mileage_entries: {
        Row: {
          client_id: string | null
          coordinates: Json | null
          created_at: string
          distance: number
          end_location: string | null
          end_time: string | null
          id: string
          is_tracking: boolean
          project_id: string | null
          purpose: string | null
          start_location: string | null
          start_time: string | null
          tax_year: number | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          coordinates?: Json | null
          created_at?: string
          distance?: number
          end_location?: string | null
          end_time?: string | null
          id?: string
          is_tracking?: boolean
          project_id?: string | null
          purpose?: string | null
          start_location?: string | null
          start_time?: string | null
          tax_year?: number | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          coordinates?: Json | null
          created_at?: string
          distance?: number
          end_location?: string | null
          end_time?: string | null
          id?: string
          is_tracking?: boolean
          project_id?: string | null
          purpose?: string | null
          start_location?: string | null
          start_time?: string | null
          tax_year?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_mileage: {
        Row: {
          coordinates: Json | null
          created_at: string
          distance: number
          end_location: string
          end_time: string | null
          id: string
          is_tracking: boolean
          notes: string | null
          project_id: string | null
          start_location: string
          start_time: string
          user_id: string
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string
          distance?: number
          end_location: string
          end_time?: string | null
          id?: string
          is_tracking?: boolean
          notes?: string | null
          project_id?: string | null
          start_location: string
          start_time?: string
          user_id: string
        }
        Update: {
          coordinates?: Json | null
          created_at?: string
          distance?: number
          end_location?: string
          end_time?: string | null
          id?: string
          is_tracking?: boolean
          notes?: string | null
          project_id?: string | null
          start_location?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_mileage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          project_id: string
          storage_path: string
          type: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          project_id: string
          storage_path: string
          type?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          project_id?: string
          storage_path?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_receipts: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          id: string
          is_capital_asset: boolean | null
          project_id: string
          storage_path: string
          tax_notes: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          is_capital_asset?: boolean | null
          project_id: string
          storage_path: string
          tax_notes?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_capital_asset?: boolean | null
          project_id?: string
          storage_path?: string
          tax_notes?: string | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_receipts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          accepted_at: string | null
          arrival_window_end: string | null
          arrival_window_start: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          items: Json
          quote_notes: string | null
          response_token: string | null
          response_token_used_at: string | null
          schedule_notes: string | null
          schedule_notification_sent_at: string | null
          scheduled_date: string | null
          sent_at: string | null
          started_at: string | null
          status: string
          title: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          arrival_window_end?: string | null
          arrival_window_start?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          items?: Json
          quote_notes?: string | null
          response_token?: string | null
          response_token_used_at?: string | null
          schedule_notes?: string | null
          schedule_notification_sent_at?: string | null
          scheduled_date?: string | null
          sent_at?: string | null
          started_at?: string | null
          status?: string
          title: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          arrival_window_end?: string | null
          arrival_window_start?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          items?: Json
          quote_notes?: string | null
          response_token?: string | null
          response_token_used_at?: string | null
          schedule_notes?: string | null
          schedule_notification_sent_at?: string | null
          scheduled_date?: string | null
          sent_at?: string | null
          started_at?: string | null
          status?: string
          title?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_payments: {
        Row: {
          amount: number
          check_number: string | null
          client_id: string
          created_at: string
          description: string | null
          id: string
          payment_date: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          check_number?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          payment_date: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          check_number?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          id: string
          is_ignored: boolean
          match_confidence: string | null
          matched_invoice_id: string | null
          matched_receipt_id: string | null
          source: string
          source_reference: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          is_ignored?: boolean
          match_confidence?: string | null
          matched_invoice_id?: string | null
          matched_receipt_id?: string | null
          source?: string
          source_reference?: string | null
          transaction_date: string
          transaction_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_ignored?: boolean
          match_confidence?: string | null
          matched_invoice_id?: string | null
          matched_receipt_id?: string | null
          source?: string
          source_reference?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_matched_invoice_id_fkey"
            columns: ["matched_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_matched_receipt_id_fkey"
            columns: ["matched_receipt_id"]
            isOneToOne: false
            referencedRelation: "project_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          dashboard_logo_url: string | null
          id: string
          invoice_prefix: string | null
          irs_mileage_rate: number | null
          license_number: string | null
          partner_suggestions_dismissed: boolean | null
          payment_instructions: string | null
          tagline: string | null
          tax_pro_enabled: boolean | null
          tax_rate_estimate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          dashboard_logo_url?: string | null
          id?: string
          invoice_prefix?: string | null
          irs_mileage_rate?: number | null
          license_number?: string | null
          partner_suggestions_dismissed?: boolean | null
          payment_instructions?: string | null
          tagline?: string | null
          tax_pro_enabled?: boolean | null
          tax_rate_estimate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          dashboard_logo_url?: string | null
          id?: string
          invoice_prefix?: string | null
          irs_mileage_rate?: number | null
          license_number?: string | null
          partner_suggestions_dismissed?: boolean | null
          payment_instructions?: string | null
          tagline?: string | null
          tax_pro_enabled?: boolean | null
          tax_rate_estimate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invoice_by_payment_token: {
        Args: { p_token: string }
        Returns: {
          client_email: string
          client_name: string
          due_date: string
          id: string
          invoice_number: string
          items: Json
          status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
