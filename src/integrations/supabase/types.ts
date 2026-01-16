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
      admin_app_settings: {
        Row: {
          force_update_version: string | null
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean
          signups_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          force_update_version?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          signups_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          force_update_version?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          signups_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings: {
        Row: {
          current_affiliates: number
          default_commission_rate: number
          default_commission_type: string
          id: string
          max_affiliates: number
          min_payout_threshold: number
          signups_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          current_affiliates?: number
          default_commission_rate?: number
          default_commission_type?: string
          id?: string
          max_affiliates?: number
          min_payout_threshold?: number
          signups_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          current_affiliates?: number
          default_commission_rate?: number
          default_commission_type?: string
          id?: string
          max_affiliates?: number
          min_payout_threshold?: number
          signups_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          application_submitted_at: string | null
          application_text: string | null
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          pending_earnings: number
          recommended_by_affiliate_id: string | null
          recommended_by_email: string | null
          referral_code: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id: string | null
          stripe_account_type: string | null
          stripe_onboarding_complete: boolean | null
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          application_submitted_at?: string | null
          application_text?: string | null
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          pending_earnings?: number
          recommended_by_affiliate_id?: string | null
          recommended_by_email?: string | null
          referral_code: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id?: string | null
          stripe_account_type?: string | null
          stripe_onboarding_complete?: boolean | null
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          application_submitted_at?: string | null
          application_text?: string | null
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          pending_earnings?: number
          recommended_by_affiliate_id?: string | null
          recommended_by_email?: string | null
          referral_code?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          stripe_account_id?: string | null
          stripe_account_type?: string | null
          stripe_onboarding_complete?: boolean | null
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_recommended_by_affiliate_id_fkey"
            columns: ["recommended_by_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      app_analytics: {
        Row: {
          created_at: string
          device_info: Json | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_flow_steps: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          flow_name: string
          id: string
          is_active: boolean
          next_step_key: string | null
          step_key: string
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          flow_name: string
          id?: string
          is_active?: boolean
          next_step_key?: string | null
          step_key: string
          step_name: string
          step_order?: number
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          flow_name?: string
          id?: string
          is_active?: boolean
          next_step_key?: string | null
          step_key?: string
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          record_counts: Json | null
          size_bytes: number | null
          started_at: string | null
          status: string
          storage_path: string | null
          tables_included: string[] | null
          user_id: string | null
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          record_counts?: Json | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string
          storage_path?: string | null
          tables_included?: string[] | null
          user_id?: string | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          record_counts?: Json | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string
          storage_path?: string | null
          tables_included?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_expenses: {
        Row: {
          amount: number
          bank_statement_ref: string | null
          category_id: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          is_reconciled: boolean
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          bank_statement_ref?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          expense_date: string
          id?: string
          is_reconciled?: boolean
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          bank_statement_ref?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          is_reconciled?: boolean
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
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
      commission_events: {
        Row: {
          affiliate_id: string | null
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          paid_at: string | null
          product_name: string | null
          product_type: string | null
          sale_amount: number
          salesperson_id: string | null
          status: string
          stripe_transfer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_id?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          product_name?: string | null
          product_type?: string | null
          sale_amount?: number
          salesperson_id?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_id?: string | null
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          product_name?: string | null
          product_type?: string | null
          sale_amount?: number
          salesperson_id?: string | null
          status?: string
          stripe_transfer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_events_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_provider_settings: {
        Row: {
          api_key_encrypted: string | null
          created_at: string
          from_email: string | null
          from_name: string | null
          id: string
          is_active: boolean
          last_test_at: string | null
          last_test_error: string | null
          last_test_success: boolean | null
          provider_type: string
          smtp_host: string | null
          smtp_password_encrypted: string | null
          smtp_port: number | null
          smtp_use_tls: boolean | null
          smtp_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_success?: boolean | null
          provider_type: string
          smtp_host?: string | null
          smtp_password_encrypted?: string | null
          smtp_port?: number | null
          smtp_use_tls?: boolean | null
          smtp_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_active?: boolean
          last_test_at?: string | null
          last_test_error?: string | null
          last_test_success?: boolean | null
          provider_type?: string
          smtp_host?: string | null
          smtp_password_encrypted?: string | null
          smtp_port?: number | null
          smtp_use_tls?: boolean | null
          smtp_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      encryption_key_refs: {
        Row: {
          algorithm: string
          created_at: string
          id: string
          is_active: boolean
          key_name: string
          key_version: number
          purpose: string
          rotated_at: string | null
        }
        Insert: {
          algorithm?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_name: string
          key_version?: number
          purpose: string
          rotated_at?: string | null
        }
        Update: {
          algorithm?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_name?: string
          key_version?: number
          purpose?: string
          rotated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_code: string | null
          error_message: string
          error_type: string
          id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_code?: string | null
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_code?: string | null
          error_message?: string
          error_type?: string
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
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
      global_feature_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_name: string
          id: string
          is_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
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
          context_id: string | null
          context_type: string | null
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
          context_id?: string | null
          context_type?: string | null
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
          context_id?: string | null
          context_type?: string | null
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
      metrics_snapshots: {
        Row: {
          created_at: string
          id: string
          metric_type: string
          metrics: Json
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_type: string
          metrics?: Json
          snapshot_date: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_type?: string
          metrics?: Json
          snapshot_date?: string
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
      notification_preferences: {
        Row: {
          appointment_reminders: boolean
          created_at: string
          email_enabled: boolean
          id: string
          invoice_reminders: boolean
          marketing: boolean
          payment_received: boolean
          push_enabled: boolean
          quote_accepted: boolean
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          invoice_reminders?: boolean
          marketing?: boolean
          payment_received?: boolean
          push_enabled?: boolean
          quote_accepted?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          created_at?: string
          email_enabled?: boolean
          id?: string
          invoice_reminders?: boolean
          marketing?: boolean
          payment_received?: boolean
          push_enabled?: boolean
          quote_accepted?: boolean
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          applies_to_professions: string[] | null
          applies_to_roles: string[] | null
          conditions: Json | null
          content_body: string | null
          content_description: string | null
          content_title: string | null
          created_at: string
          id: string
          is_active: boolean
          step_key: string
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          applies_to_professions?: string[] | null
          applies_to_roles?: string[] | null
          conditions?: Json | null
          content_body?: string | null
          content_description?: string | null
          content_title?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          step_key: string
          step_name: string
          step_order?: number
          updated_at?: string
        }
        Update: {
          applies_to_professions?: string[] | null
          applies_to_roles?: string[] | null
          conditions?: Json | null
          content_body?: string | null
          content_description?: string | null
          content_title?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          step_key?: string
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profession_menu_config: {
        Row: {
          created_at: string
          default_label: string
          display_order: number
          icon_name: string | null
          id: string
          is_enabled: boolean
          menu_item_key: string
          menu_label: string
          profession_id: string | null
          route_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_label: string
          display_order?: number
          icon_name?: string | null
          id?: string
          is_enabled?: boolean
          menu_item_key: string
          menu_label: string
          profession_id?: string | null
          route_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_label?: string
          display_order?: number
          icon_name?: string | null
          id?: string
          is_enabled?: boolean
          menu_item_key?: string
          menu_label?: string
          profession_id?: string | null
          route_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profession_menu_config_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          business_type: string
          created_at: string
          description: string | null
          display_name: string
          icon: string
          id: string
          is_active: boolean
          setup_order: number
          slug: string
          updated_at: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string
          id?: string
          is_active?: boolean
          setup_order?: number
          slug: string
          updated_at?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string
          id?: string
          is_active?: boolean
          setup_order?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
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
      push_notification_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          device_type: string
          id: string
          is_active: boolean
          last_used_at: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          device_type?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          device_type?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          paid_at: string | null
          product_name: string
          product_type: string
          referred_email: string | null
          referred_user_id: string | null
          sale_amount: number
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          product_name: string
          product_type: string
          referred_email?: string | null
          referred_user_id?: string | null
          sale_amount?: number
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          product_name?: string
          product_type?: string
          referred_email?: string | null
          referred_user_id?: string | null
          sale_amount?: number
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_events: {
        Row: {
          amount: number
          created_at: string
          currency: string
          event_type: string
          id: string
          metadata: Json | null
          related_invoice_id: string | null
          related_subscription_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          event_type: string
          id?: string
          metadata?: Json | null
          related_invoice_id?: string | null
          related_subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          related_invoice_id?: string | null
          related_subscription_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_list_requests: {
        Row: {
          fulfilled: boolean | null
          fulfilled_at: string | null
          id: string
          notes: string | null
          requested_at: string | null
          sector_id: string
          sector_name: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          fulfilled?: boolean | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          sector_id: string
          sector_name: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          fulfilled?: boolean | null
          fulfilled_at?: string | null
          id?: string
          notes?: string | null
          requested_at?: string | null
          sector_id?: string
          sector_name?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_menu_library: {
        Row: {
          available_in_setup: boolean
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          preview_items: Json
          price_cents: number
          profession_id: string
          services: Json
          title: string
          updated_at: string
        }
        Insert: {
          available_in_setup?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          preview_items?: Json
          price_cents?: number
          profession_id: string
          services?: Json
          title: string
          updated_at?: string
        }
        Update: {
          available_in_setup?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          preview_items?: Json
          price_cents?: number
          profession_id?: string
          services?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_menu_library_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
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
      subscription_overrides: {
        Row: {
          billing_status: string | null
          expires_at: string | null
          feature_name: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          override_type: string
          reason: string | null
          user_id: string
        }
        Insert: {
          billing_status?: string | null
          expires_at?: string | null
          feature_name?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          override_type: string
          reason?: string | null
          user_id: string
        }
        Update: {
          billing_status?: string | null
          expires_at?: string | null
          feature_name?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          override_type?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_feature_flags: {
        Row: {
          expires_at: string | null
          flag_name: string
          granted_at: string
          granted_by: string | null
          id: string
          is_enabled: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          flag_name: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          flag_name?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_enabled?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_referral_rewards: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          original_purchase_amount: number
          original_stripe_payment_intent_id: string | null
          referral_code: string
          referred_at: string | null
          referred_buyer_email: string | null
          referred_buyer_id: string | null
          referred_purchase_amount: number | null
          reward_amount: number | null
          reward_method: string | null
          reward_processed_at: string | null
          status: Database["public"]["Enums"]["referral_link_status"]
          stripe_refund_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_purchase_amount?: number
          original_stripe_payment_intent_id?: string | null
          referral_code: string
          referred_at?: string | null
          referred_buyer_email?: string | null
          referred_buyer_id?: string | null
          referred_purchase_amount?: number | null
          reward_amount?: number | null
          reward_method?: string | null
          reward_processed_at?: string | null
          status?: Database["public"]["Enums"]["referral_link_status"]
          stripe_refund_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          original_purchase_amount?: number
          original_stripe_payment_intent_id?: string | null
          referral_code?: string
          referred_at?: string | null
          referred_buyer_email?: string | null
          referred_buyer_id?: string | null
          referred_purchase_amount?: number | null
          reward_amount?: number | null
          reward_method?: string | null
          reward_processed_at?: string | null
          status?: Database["public"]["Enums"]["referral_link_status"]
          stripe_refund_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_services: {
        Row: {
          bg_color: string | null
          created_at: string
          duration: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          source_library_id: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bg_color?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number
          source_library_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bg_color?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          source_library_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_services_source_library_id_fkey"
            columns: ["source_library_id"]
            isOneToOne: false
            referencedRelation: "service_menu_library"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          ai_scans_period: string | null
          ai_scans_subscription_customer_id: string | null
          ai_scans_subscription_status: string | null
          ai_scans_used: number
          business_sector: string | null
          business_type: string | null
          cloud_storage_tier: string | null
          cloud_storage_used_bytes: number | null
          company_address: string | null
          company_email: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          dashboard_logo_url: string | null
          financial_pro_enabled: boolean | null
          financial_tool_enabled: boolean | null
          id: string
          invoice_prefix: string | null
          irs_mileage_rate: number | null
          license_number: string | null
          mileage_pro_enabled: boolean | null
          partner_suggestions_dismissed: boolean | null
          payment_instructions: string | null
          scheduling_pro_enabled: boolean | null
          setup_completed: boolean | null
          tagline: string | null
          tax_pro_enabled: boolean | null
          tax_rate_estimate: number | null
          trial_started_at: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_scans_period?: string | null
          ai_scans_subscription_customer_id?: string | null
          ai_scans_subscription_status?: string | null
          ai_scans_used?: number
          business_sector?: string | null
          business_type?: string | null
          cloud_storage_tier?: string | null
          cloud_storage_used_bytes?: number | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          dashboard_logo_url?: string | null
          financial_pro_enabled?: boolean | null
          financial_tool_enabled?: boolean | null
          id?: string
          invoice_prefix?: string | null
          irs_mileage_rate?: number | null
          license_number?: string | null
          mileage_pro_enabled?: boolean | null
          partner_suggestions_dismissed?: boolean | null
          payment_instructions?: string | null
          scheduling_pro_enabled?: boolean | null
          setup_completed?: boolean | null
          tagline?: string | null
          tax_pro_enabled?: boolean | null
          tax_rate_estimate?: number | null
          trial_started_at?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_scans_period?: string | null
          ai_scans_subscription_customer_id?: string | null
          ai_scans_subscription_status?: string | null
          ai_scans_used?: number
          business_sector?: string | null
          business_type?: string | null
          cloud_storage_tier?: string | null
          cloud_storage_used_bytes?: number | null
          company_address?: string | null
          company_email?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          dashboard_logo_url?: string | null
          financial_pro_enabled?: boolean | null
          financial_tool_enabled?: boolean | null
          id?: string
          invoice_prefix?: string | null
          irs_mileage_rate?: number | null
          license_number?: string | null
          mileage_pro_enabled?: boolean | null
          partner_suggestions_dismissed?: boolean | null
          payment_instructions?: string | null
          scheduling_pro_enabled?: boolean | null
          setup_completed?: boolean | null
          tagline?: string | null
          tax_pro_enabled?: boolean | null
          tax_rate_estimate?: number | null
          trial_started_at?: Json | null
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
      generate_referral_code: { Args: never; Returns: string }
      generate_user_referral_code: { Args: never; Returns: string }
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      affiliate_status: "pending" | "active" | "paused" | "rejected"
      app_role: "admin" | "moderator" | "user"
      referral_link_status:
        | "active"
        | "used"
        | "expired"
        | "reward_pending"
        | "reward_completed"
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
    Enums: {
      affiliate_status: ["pending", "active", "paused", "rejected"],
      app_role: ["admin", "moderator", "user"],
      referral_link_status: [
        "active",
        "used",
        "expired",
        "reward_pending",
        "reward_completed",
      ],
    },
  },
} as const
