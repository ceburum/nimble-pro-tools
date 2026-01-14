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
