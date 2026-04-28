// =============================================================================
// Database Types — mirrors future Supabase schema
// =============================================================================
// When connecting to Supabase, these types can be auto-generated with:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts
// For now, they serve as the single source of truth for data shapes.
// =============================================================================

export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  price_raw: number;
  badge: string;
  badge_color: string;
  badge_width?: string;
  image: string;
  img_style?: string;
  description?: string;
  specifications?: Record<string, string>;
  stock: number;
  weight_kg?: number;
  created_at?: string;
}

export interface Category {
  name: string;
  count: number;
  slug: string;
}

export interface Brand {
  name: string;
  img: string;
  width: number;
  height: number;
  overflow?: boolean;
  style?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Address {
  id: string;
  user_id?: string;
  label?: string;
  name: string;
  phone: string;
  address: string;
  full_address?: string;
  details?: string;
  is_default?: boolean;
}

export interface Order {
  id: string;
  user_id?: string;
  date: string;
  status: "SHIPPED" | "DELIVERED" | "PROCESSING" | "CANCELLED";
  status_color: string;
  total_price: string;
  items?: OrderItem[];
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: number;
  quantity: number;
  price: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  img: string;
  img_style: string;
  overflow?: boolean;
  overflow_style?: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: string;
  estimated_delivery: string;
}
