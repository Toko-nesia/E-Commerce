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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address: string
          country_code: string
          created_at: string
          details: string | null
          full_address: string | null
          id: string
          is_default: boolean
          label: string | null
          name: string
          phone: string
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          country_code?: string
          created_at?: string
          details?: string | null
          full_address?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          name: string
          phone: string
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          country_code?: string
          created_at?: string
          details?: string | null
          full_address?: string | null
          id?: string
          is_default?: boolean
          label?: string | null
          name?: string
          phone?: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          count: number
          created_at: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: never
          name: string
          slug: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          attempt_count: number
          audience: string
          created_at: string
          dedupe_key: string
          event_type: string
          failed_at: string | null
          html_content: string
          id: string
          last_error: string | null
          order_id: string | null
          payload: Json
          provider: string
          provider_message_id: string | null
          queued_at: string
          recipient_email: string
          recipient_name: string | null
          refund_request_id: string | null
          sending_at: string | null
          sent_at: string | null
          skipped_at: string | null
          status: string
          subject: string
          text_content: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          audience?: string
          created_at?: string
          dedupe_key: string
          event_type: string
          failed_at?: string | null
          html_content: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          payload?: Json
          provider?: string
          provider_message_id?: string | null
          queued_at?: string
          recipient_email: string
          recipient_name?: string | null
          refund_request_id?: string | null
          sending_at?: string | null
          sent_at?: string | null
          skipped_at?: string | null
          status?: string
          subject: string
          text_content: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          audience?: string
          created_at?: string
          dedupe_key?: string
          event_type?: string
          failed_at?: string | null
          html_content?: string
          id?: string
          last_error?: string | null
          order_id?: string | null
          payload?: Json
          provider?: string
          provider_message_id?: string | null
          queued_at?: string
          recipient_email?: string
          recipient_name?: string | null
          refund_request_id?: string | null
          sending_at?: string | null
          sent_at?: string | null
          skipped_at?: string | null
          status?: string
          subject?: string
          text_content?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_refund_request_id_fkey"
            columns: ["refund_request_id"]
            isOneToOne: false
            referencedRelation: "refund_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          id: number
          rate: number
          target_currency: string
          updated_at: string
        }
        Insert: {
          base_currency: string
          id?: never
          rate: number
          target_currency: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          id?: never
          rate?: number
          target_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          buyer_note: string | null
          created_at: string
          custom_amount_raw: number | null
          id: number
          order_id: string
          price: string | null
          price_raw: number
          product_id: number
          quantity: number
        }
        Insert: {
          buyer_note?: string | null
          created_at?: string
          custom_amount_raw?: number | null
          id?: never
          order_id: string
          price?: string | null
          price_raw: number
          product_id: number
          quantity: number
        }
        Update: {
          buyer_note?: string | null
          created_at?: string
          custom_amount_raw?: number | null
          id?: never
          order_id?: string
          price?: string | null
          price_raw?: number
          product_id?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          actor_type: string
          actor_user_id: string | null
          created_at: string
          dedupe_key: string | null
          description: string
          event_type: string
          from_payment_status: string | null
          from_status: string | null
          id: string
          metadata: Json
          order_id: string
          reason: string | null
          title: string
          to_payment_status: string | null
          to_status: string | null
        }
        Insert: {
          actor_type: string
          actor_user_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          description: string
          event_type: string
          from_payment_status?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json
          order_id: string
          reason?: string | null
          title: string
          to_payment_status?: string | null
          to_status?: string | null
        }
        Update: {
          actor_type?: string
          actor_user_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          description?: string
          event_type?: string
          from_payment_status?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json
          order_id?: string
          reason?: string | null
          title?: string
          to_payment_status?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          address_snapshot: Json
          cancel_reason: string | null
          cart_fingerprint: string | null
          cart_snapshot: Json
          completion_deadline_at: string | null
          created_at: string
          estimated_delivery: string | null
          estimated_delivery_at: string | null
          id: string
          idempotency_key: string | null
          midtrans_order_id: string | null
          midtrans_transaction_id: string | null
          note: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          payment_url: string | null
          pricing_snapshot: Json
          service_fee: number | null
          shipped_at: string | null
          shipping_cost: number | null
          shipping_method: string
          shipping_snapshot: Json
          snap_redirect_url: string | null
          snap_token: string | null
          snap_token_expires_at: string | null
          status: string
          status_color: string | null
          stock_decremented_at: string | null
          stock_release_reason: string | null
          stock_released_at: string | null
          stock_reserved_at: string | null
          total_price: string | null
          total_price_raw: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_id?: string | null
          address_snapshot?: Json
          cancel_reason?: string | null
          cart_fingerprint?: string | null
          cart_snapshot?: Json
          completion_deadline_at?: string | null
          created_at?: string
          estimated_delivery?: string | null
          estimated_delivery_at?: string | null
          id?: string
          idempotency_key?: string | null
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          note?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          payment_url?: string | null
          pricing_snapshot?: Json
          service_fee?: number | null
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_method?: string
          shipping_snapshot?: Json
          snap_redirect_url?: string | null
          snap_token?: string | null
          snap_token_expires_at?: string | null
          status?: string
          status_color?: string | null
          stock_decremented_at?: string | null
          stock_release_reason?: string | null
          stock_released_at?: string | null
          stock_reserved_at?: string | null
          total_price?: string | null
          total_price_raw: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_id?: string | null
          address_snapshot?: Json
          cancel_reason?: string | null
          cart_fingerprint?: string | null
          cart_snapshot?: Json
          completion_deadline_at?: string | null
          created_at?: string
          estimated_delivery?: string | null
          estimated_delivery_at?: string | null
          id?: string
          idempotency_key?: string | null
          midtrans_order_id?: string | null
          midtrans_transaction_id?: string | null
          note?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          payment_url?: string | null
          pricing_snapshot?: Json
          service_fee?: number | null
          shipped_at?: string | null
          shipping_cost?: number | null
          shipping_method?: string
          shipping_snapshot?: Json
          snap_redirect_url?: string | null
          snap_token?: string | null
          snap_token_expires_at?: string | null
          status?: string
          status_color?: string | null
          stock_decremented_at?: string | null
          stock_release_reason?: string | null
          stock_released_at?: string | null
          stock_reserved_at?: string | null
          total_price?: string | null
          total_price_raw?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_hash: string
          event_type: string
          fraud_status: string | null
          id: string
          ignored_reason: string | null
          midtrans_order_id: string
          order_id: string | null
          payload: Json
          processed_at: string | null
          transaction_status: string | null
        }
        Insert: {
          created_at?: string
          event_hash: string
          event_type: string
          fraud_status?: string | null
          id?: string
          ignored_reason?: string | null
          midtrans_order_id: string
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          transaction_status?: string | null
        }
        Update: {
          created_at?: string
          event_hash?: string
          event_type?: string
          fraud_status?: string | null
          id?: string
          ignored_reason?: string | null
          midtrans_order_id?: string
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          transaction_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          badge_color: string | null
          badge_width: string | null
          bootstrap_key: string | null
          category: string
          created_at: string
          description: string | null
          id: number
          image: string
          img_style: string | null
          max_price_raw: number | null
          min_price_raw: number | null
          name: string
          price: string
          price_raw: number
          pricing_type: string
          purchase_instructions: string | null
          specifications: Json | null
          stock: number
          updated_at: string
          weight_kg: number
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          badge_width?: string | null
          bootstrap_key?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: never
          image: string
          img_style?: string | null
          max_price_raw?: number | null
          min_price_raw?: number | null
          name: string
          price: string
          price_raw: number
          pricing_type?: string
          purchase_instructions?: string | null
          specifications?: Json | null
          stock?: number
          updated_at?: string
          weight_kg: number
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          badge_width?: string | null
          bootstrap_key?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: never
          image?: string
          img_style?: string | null
          max_price_raw?: number | null
          min_price_raw?: number | null
          name?: string
          price?: string
          price_raw?: number
          pricing_type?: string
          purchase_instructions?: string | null
          specifications?: Json | null
          stock?: number
          updated_at?: string
          weight_kg?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          account_name: string | null
          account_number: string
          admin_note: string | null
          buyer_reason: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          initiated_by: string | null
          initiated_by_user_id: string | null
          order_id: string
          payout_provider: string | null
          payout_submitted_at: string | null
          previous_order_status: string | null
          reason: string
          refund_amount: number | null
          refund_method: string
          refunded_at: string | null
          rejection_reason: string | null
          review_note: string | null
          reviewed_at: string | null
          seller_reason: string | null
          status: string
          transfer_note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          admin_note?: string | null
          buyer_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          initiated_by_user_id?: string | null
          order_id: string
          payout_provider?: string | null
          payout_submitted_at?: string | null
          previous_order_status?: string | null
          reason: string
          refund_amount?: number | null
          refund_method: string
          refunded_at?: string | null
          rejection_reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          seller_reason?: string | null
          status?: string
          transfer_note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          admin_note?: string | null
          buyer_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          initiated_by_user_id?: string | null
          order_id?: string
          payout_provider?: string | null
          payout_submitted_at?: string | null
          previous_order_status?: string | null
          reason?: string
          refund_amount?: number | null
          refund_method?: string
          refunded_at?: string | null
          rejection_reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          seller_reason?: string | null
          status?: string
          transfer_note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_initiated_by_user_id_fkey"
            columns: ["initiated_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          code: string
          created_at: string
          enabled: boolean
          label: string
          price_raw: number | null
          requires_tracking: boolean
          settings: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          enabled?: boolean
          label: string
          price_raw?: number | null
          requires_tracking?: boolean
          settings?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          enabled?: boolean
          label?: string
          price_raw?: number | null
          requires_tracking?: boolean
          settings?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          description: string | null
          id: number
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: never
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: never
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_midtrans_payment_event: {
        Args: {
          p_event_hash: string
          p_event_type: string
          p_fraud_status: string
          p_midtrans_order_id: string
          p_order_status: string
          p_payload: Json
          p_payment_status: string
          p_transaction_id: string
          p_transaction_status: string
        }
        Returns: Json
      }
      create_checkout_order_with_stock_reservation: {
        Args: {
          p_address_id: string
          p_address_snapshot: Json
          p_cart_fingerprint: string
          p_cart_snapshot: Json
          p_idempotency_key: string
          p_items: Json
          p_midtrans_order_id: string
          p_note: string
          p_order_id: string
          p_payment_method?: string
          p_pricing_snapshot: Json
          p_service_fee: number
          p_shipping_cost: number
          p_shipping_method?: string
          p_shipping_snapshot: Json
          p_total_price: string
          p_total_price_raw: number
          p_user_id: string
        }
        Returns: Json
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      decrement_stock: {
        Args: { p_product_id: number; p_quantity: number }
        Returns: undefined
      }
      expire_pending_payment_order: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: Json
      }
      get_trending_products: {
        Args: { p_limit?: number; p_now?: string }
        Returns: {
          badge: string | null
          badge_color: string | null
          badge_width: string | null
          bootstrap_key: string | null
          category: string
          created_at: string
          description: string | null
          id: number
          image: string
          img_style: string | null
          max_price_raw: number | null
          min_price_raw: number | null
          name: string
          price: string
          price_raw: number
          pricing_type: string
          purchase_instructions: string | null
          specifications: Json | null
          stock: number
          updated_at: string
          weight_kg: number
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      mark_checkout_payment_setup_failed: {
        Args: { p_failed_at?: string; p_order_id: string; p_reason?: string }
        Returns: Json
      }
      release_order_stock_once: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
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
