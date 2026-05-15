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
      brands: {
        Row: {
          created_at: string
          height: number | null
          id: number
          img: string
          name: string
          overflow: boolean | null
          style: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: never
          img: string
          name: string
          overflow?: boolean | null
          style?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: never
          img?: string
          name?: string
          overflow?: boolean | null
          style?: string | null
          width?: number | null
        }
        Relationships: []
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
          created_at: string
          id: number
          order_id: string
          price: string | null
          price_raw: number
          product_id: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: never
          order_id: string
          price?: string | null
          price_raw: number
          product_id: number
          quantity: number
        }
        Update: {
          created_at?: string
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
      orders: {
        Row: {
          address_id: string | null
          address_snapshot: Json
          cancel_reason: string | null
          cart_fingerprint: string | null
          cart_snapshot: Json
          created_at: string
          estimated_delivery: string | null
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
          shipping_cost: number | null
          shipping_snapshot: Json
          snap_redirect_url: string | null
          snap_token: string | null
          snap_token_expires_at: string | null
          status: string
          status_color: string | null
          stock_decremented_at: string | null
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
          created_at?: string
          estimated_delivery?: string | null
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
          shipping_cost?: number | null
          shipping_snapshot?: Json
          snap_redirect_url?: string | null
          snap_token?: string | null
          snap_token_expires_at?: string | null
          status?: string
          status_color?: string | null
          stock_decremented_at?: string | null
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
          created_at?: string
          estimated_delivery?: string | null
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
          shipping_cost?: number | null
          shipping_snapshot?: Json
          snap_redirect_url?: string | null
          snap_token?: string | null
          snap_token_expires_at?: string | null
          status?: string
          status_color?: string | null
          stock_decremented_at?: string | null
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
          category: string
          created_at: string
          description: string | null
          id: number
          image: string
          img_style: string | null
          name: string
          price: string
          price_raw: number
          specifications: Json | null
          stock: number
          updated_at: string
          weight_kg: number
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          badge_width?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: never
          image: string
          img_style?: string | null
          name: string
          price: string
          price_raw: number
          specifications?: Json | null
          stock?: number
          updated_at?: string
          weight_kg: number
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          badge_width?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: never
          image?: string
          img_style?: string | null
          name?: string
          price?: string
          price_raw?: number
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
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      decrement_stock: {
        Args: { p_product_id: number; p_quantity: number }
        Returns: undefined
      }
      get_trending_products: {
        Args: { p_limit?: number; p_now?: string }
        Returns: {
          badge: string | null
          badge_color: string | null
          badge_width: string | null
          category: string
          created_at: string
          description: string | null
          id: number
          image: string
          img_style: string | null
          name: string
          price: string
          price_raw: number
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
