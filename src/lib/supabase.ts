import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names
export const TABLES = {
  USERS: 'users',
  PRODUCTS: 'products',
  PRODUCT_ACCOUNTS: 'product_accounts',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items'
} as const

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          password: string
          balance: number
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          password: string
          balance?: number
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password?: string
          balance?: number
          role?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          discount: number
          image: string
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          price: number
          discount?: number
          image?: string
          category?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          discount?: number
          image?: string
          category?: string
          updated_at?: string
        }
      }
      product_accounts: {
        Row: {
          id: string
          product_id: string
          email: string
          password: string
          additional_info: string | null
          is_sold: boolean
          sold_at: string | null
          order_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          email: string
          password: string
          additional_info?: string | null
          is_sold?: boolean
          sold_at?: string | null
          order_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          email?: string
          password?: string
          additional_info?: string | null
          is_sold?: boolean
          sold_at?: string | null
          order_id?: string | null
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          user_email: string
          total: number
          status: string
          payment_method: string
          shipping_address: string | null
          billing_address: string | null
          notes: string | null
          completed_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          total: number
          status?: string
          payment_method: string
          shipping_address?: string | null
          billing_address?: string | null
          notes?: string | null
          completed_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          total?: number
          status?: string
          payment_method?: string
          shipping_address?: string | null
          billing_address?: string | null
          notes?: string | null
          completed_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          name: string
          quantity: number
          price: number
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          name: string
          quantity: number
          price: number
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          name?: string
          quantity?: number
          price?: number
          type?: string
        }
      }
      order_item_accounts: {
        Row: {
          id: string
          order_item_id: string
          product_account_id: string
          created_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          product_account_id: string
          created_at?: string
        }
        Update: {
          id?: string
          order_item_id?: string
          product_account_id?: string
        }
      }
    }
  }
}

// TypeScript interfaces for easier use
export type users = Database['public']['Tables']['users']['Row']
export type products = Database['public']['Tables']['products']['Row']
export type product_accounts = Database['public']['Tables']['product_accounts']['Row']
export type orders = Database['public']['Tables']['orders']['Row']
export type order_items = Database['public']['Tables']['order_items']['Row']
export type order_item_accounts = Database['public']['Tables']['order_item_accounts']['Row']