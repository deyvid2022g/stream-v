import { supabase } from '../lib/supabase'
import { CartItem, OrderItem, ProductAccount } from '../types'
import { productService } from './productService'
import { authService } from './authService'

// Interface para la respuesta de Supabase
interface SupabaseOrderItemAccount {
  product_accounts: {
    id: string;
    email: string;
    password: string;
    product_id: string;
    is_sold: boolean;
  }[];
}

export interface OrderWithItems {
  id: string;
  userId: string;
  userEmail: string;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: string;
  createdAt: Date | string;
  items: OrderItem[];
}

class OrderService {
  async createOrder(userId: string, userEmail: string, cartItems: CartItem[], total: number, paymentMethod: string = 'balance'): Promise<OrderWithItems | null> {
    try {
      // Crear la orden
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          user_email: userEmail,
          total: total,
          status: 'completed',
          payment_method: paymentMethod
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('Error creating order:', orderError)
        return null
      }

      // Procesar cada item del carrito
      for (const item of cartItems) {
        // Obtener cuentas disponibles para este producto
        const availableAccounts = await productService.getAvailableAccounts(item.id)
        
        if (availableAccounts.length < item.quantity) {
          console.error(`Not enough accounts available for product ${item.id}`)
          // Eliminar la orden si no hay suficientes cuentas
          await supabase.from('orders').delete().eq('id', order.id)
          return null
        }

        // Crear item de orden
        const { data: orderItem, error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            type: 'digital'
          })
          .select()
          .single()

        if (orderItemError || !orderItem) {
          console.error('Error creating order item:', orderItemError)
          await supabase.from('orders').delete().eq('id', order.id)
          return null
        }

        // Tomar las cuentas necesarias y asociarlas al order_item
        const accountsToSell = availableAccounts.slice(0, item.quantity)
        
        for (const account of accountsToSell) {
          // Marcar cuenta como vendida y asociarla a la orden
          await supabase
            .from('product_accounts')
            .update({
              is_sold: true,
              order_id: order.id,
              sold_at: new Date().toISOString()
            })
            .eq('id', account.id)
          
          // Crear relación en order_item_accounts
          await supabase
            .from('order_item_accounts')
            .insert({
              order_item_id: orderItem.id,
              product_account_id: account.id
            })
        }
      }

      // Actualizar balance del usuario
      const user = await authService.getUserById(userId)
      if (user) {
        const newBalance = user.balance - total
        await authService.updateUserBalance(userId, newBalance)
      }

      return {
        id: order.id,
        userId: order.user_id,
        userEmail: order.user_email,
        total: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: new Date(order.created_at),
        items: []
      }
    } catch (error) {
      console.error('Error in createOrder:', error)
      return null
    }
  }

  async getUserOrders(userId: string): Promise<OrderWithItems[]> {
    try {
      // Obtener órdenes del usuario
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (ordersError || !orders) {
        console.error('Error fetching user orders:', ordersError)
        return []
      }

      // Obtener items para cada orden
      const ordersWithItems: OrderWithItems[] = []

      for (const order of orders) {
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
          continue
        }

        const items: OrderItem[] = []
        
        for (const item of orderItems || []) {
          // Obtener las cuentas asociadas a este order_item
          const { data: itemAccounts, error: accountsError } = await supabase
            .from('order_item_accounts')
            .select(`
              product_accounts!inner(*)
            `)
            .eq('order_item_id', item.id)

          if (accountsError) {
            console.error('Error fetching item accounts:', accountsError)
            continue
          }

          const accounts: ProductAccount[] = (itemAccounts as unknown as SupabaseOrderItemAccount[] || []).flatMap(acc => 
            acc.product_accounts.map(pa => ({
              id: pa.id,
              email: pa.email,
              password: pa.password,
              productId: pa.product_id,
              isSold: pa.is_sold
            }))
          )

          items.push({
            id: item.id,
            productId: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            accounts,
            type: item.type
          })
        }

        ordersWithItems.push({
          id: order.id,
          userId: order.user_id,
          userEmail: order.user_email,
          total: order.total,
          status: order.status,
          paymentMethod: order.payment_method,
          createdAt: new Date(order.created_at),
          items
        })
      }

      return ordersWithItems
    } catch (error) {
      console.error('Error in getUserOrders:', error)
      return []
    }
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    try {
      // Obtener todas las órdenes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (ordersError || !orders) {
        console.error('Error fetching all orders:', ordersError)
        return []
      }

      // Obtener items para cada orden
      const ordersWithItems: OrderWithItems[] = []

      for (const order of orders) {
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)

        if (itemsError) {
          console.error('Error fetching order items:', itemsError)
          continue
        }

        const items: OrderItem[] = []
        
        for (const item of orderItems || []) {
          // Obtener las cuentas asociadas a este order_item
          const { data: itemAccounts, error: accountsError } = await supabase
            .from('order_item_accounts')
            .select(`
              product_accounts!inner(*)
            `)
            .eq('order_item_id', item.id)

          if (accountsError) {
            console.error('Error fetching item accounts:', accountsError)
            continue
          }

          const accounts: ProductAccount[] = (itemAccounts as unknown as SupabaseOrderItemAccount[] || []).flatMap(acc => 
            acc.product_accounts.map(pa => ({
              id: pa.id,
              email: pa.email,
              password: pa.password,
              productId: pa.product_id,
              isSold: pa.is_sold
            }))
          )

          items.push({
            id: item.id,
            productId: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            accounts,
            type: item.type
          })
        }

        ordersWithItems.push({
          id: order.id,
          userId: order.user_id,
          userEmail: order.user_email,
          total: order.total,
          status: order.status,
          paymentMethod: order.payment_method,
          createdAt: new Date(order.created_at),
          items
        })
      }

      return ordersWithItems
    } catch (error) {
      console.error('Error in getAllOrders:', error)
      return []
    }
  }

  async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        return null
      }

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) {
        console.error('Error fetching order items:', itemsError)
        return null
      }

      const items: OrderItem[] = []
      
      for (const item of orderItems || []) {
        // Obtener las cuentas asociadas a este order_item
        const { data: itemAccounts, error: accountsError } = await supabase
          .from('order_item_accounts')
          .select(`
            product_accounts!inner(*)
          `)
          .eq('order_item_id', item.id)

        if (accountsError) {
          console.error('Error fetching item accounts:', accountsError)
          continue
        }

        const accounts: ProductAccount[] = (itemAccounts as unknown as SupabaseOrderItemAccount[] || []).flatMap(acc => 
          acc.product_accounts.map(pa => ({
            id: pa.id,
            email: pa.email,
            password: pa.password,
            productId: pa.product_id,
            isSold: pa.is_sold
          }))
        )

        items.push({
          id: item.id,
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          accounts,
          type: item.type
        })
      }

      return {
        id: order.id,
        userId: order.user_id,
        userEmail: order.user_email,
        total: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: new Date(order.created_at),
        items
      }
    } catch (error) {
      console.error('Error in getOrderById:', error)
      return null
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      return !error
    } catch (error) {
      console.error('Error in updateOrderStatus:', error)
      return false
    }
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      return !error
    } catch (error) {
      console.error('Error in deleteOrder:', error)
      return false
    }
  }
}

export const orderService = new OrderService()