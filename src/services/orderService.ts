import { supabase } from '../lib/supabase'
import { CartItem, OrderItem } from '../types'
import { OrderWithItems } from '../types/order'
import { authService } from './authService'
import { transactionService } from './transactionService'





export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
}

class OrderService {
  /**
   * Crea una orden usando el transactionService optimizado
   */
  async createOrder(userId: string, userEmail: string, cartItems: CartItem[]): Promise<OrderWithItems | null> {
    try {
      // Validaciones iniciales
      if (!userId || !userEmail) {
        throw new Error('Información de usuario inválida')
      }
      
      if (!cartItems || cartItems.length === 0) {
        throw new Error('El carrito está vacío')
      }
      
      // Obtener información del usuario
      const user = await authService.getUserById(userId)
      if (!user) {
        throw new Error('Usuario no encontrado')
      }
      
      // Usar transactionService para procesar la transacción completa
      const result = await transactionService.processTransaction({
        userId,
        userEmail,
        cartItems,
        userBalance: user.balance,
        onAccountAssign: async () => {
          // Esta lógica se maneja internamente en transactionService
          
          // Esta lógica se maneja internamente en transactionService
          // Solo necesitamos confirmar que las cuentas fueron asignadas
        },
        onBalanceUpdate: async (newBalance) => {
          await authService.updateUserBalance(userId, newBalance)
        }
      })
      
      // Convertir el resultado a OrderWithItems
      const orderWithItems: OrderWithItems = {
        id: result.order.id,
        userId: result.order.userId,
        userEmail: result.order.userEmail,
        total: result.order.total,
        status: result.order.status,
        paymentMethod: result.order.paymentMethod,
        createdAt: new Date(result.order.createdAt),
        completedAt: result.order.status === 'completed' ? new Date() : undefined,
        items: await this.getOrderItems(result.order.id)
      }
      
      return orderWithItems
      
    } catch (error) {
      console.error('Error in createOrder:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al crear la orden')
    }
  }
  


  /**
   * Obtiene las órdenes de un usuario con consultas optimizadas
   */
  async getUserOrders(userId: string): Promise<OrderWithItems[]> {
    try {
      if (!userId) {
        throw new Error('ID de usuario requerido')
      }

      // Usar una sola consulta con joins para obtener toda la información
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          user_email,
          total,
          status,
          payment_method,
          created_at,
          completed_at,
          cancelled_at,
          order_items (
            id,
            product_id,
            name,
            quantity,
            price,
            type,
            order_item_accounts (
              product_accounts (
                id,
                email,
                password,
                additional_info
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching user orders:', ordersError)
        throw new Error('No se pudieron obtener las órdenes del usuario')
      }

      if (!ordersData || ordersData.length === 0) {
        return []
      }

      // Transformar los datos al formato esperado
      const ordersWithItems: OrderWithItems[] = ordersData.map(order => ({
        id: order.id,
        userId: order.user_id,
        userEmail: order.user_email,
        total: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: new Date(order.created_at),
        completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
        cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : undefined,
        items: order.order_items?.map(item => ({
          id: item.id,
          orderId: order.id,
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          type: item.type,
          accounts: item.order_item_accounts?.map(acc => ({
            id: acc.product_accounts?.id || '',
            email: acc.product_accounts?.email || '',
            password: acc.product_accounts?.password || '',
            productId: item.product_id,
            isSold: true,
            additionalInfo: acc.product_accounts?.additional_info
          })) || []
        })) || []
      }))

      return ordersWithItems
    } catch (error) {
      console.error('Error in getUserOrders:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al obtener las órdenes')
    }
  }

  /**
   * Obtiene todas las órdenes con consultas optimizadas
   */
  async getAllOrders(limit?: number, offset?: number): Promise<OrderWithItems[]> {
    try {
      // Construir la consulta con paginación opcional
      let query = supabase
        .from('orders')
        .select(`
          id,
          user_id,
          user_email,
          total,
          status,
          payment_method,
          created_at,
          completed_at,
          cancelled_at,
          order_items (
            id,
            product_id,
            name,
            quantity,
            price,
            type,
            order_item_accounts (
              product_accounts (
                id,
                email,
                password,
                additional_info
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar paginación si se especifica
      if (limit) {
        query = query.limit(limit)
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 50) - 1)
      }

      const { data: ordersData, error: ordersError } = await query

      if (ordersError) {
        console.error('Error fetching all orders:', ordersError)
        throw new Error('No se pudieron obtener las órdenes')
      }

      if (!ordersData || ordersData.length === 0) {
        return []
      }

      // Transformar los datos al formato esperado
      const ordersWithItems: OrderWithItems[] = ordersData.map(order => ({
        id: order.id,
        userId: order.user_id,
        userEmail: order.user_email,
        total: order.total,
        status: order.status,
        paymentMethod: order.payment_method,
        createdAt: new Date(order.created_at),
        completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
        cancelledAt: order.cancelled_at ? new Date(order.cancelled_at) : undefined,
        items: order.order_items?.map(item => ({
          id: item.id,
          orderId: order.id,
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          type: item.type,
          accounts: item.order_item_accounts?.map(acc => ({
            id: acc.product_accounts?.id || '',
            email: acc.product_accounts?.email || '',
            password: acc.product_accounts?.password || '',
            productId: item.product_id,
            isSold: true,
            additionalInfo: acc.product_accounts?.additional_info
          })) || []
        })) || []
      }))

      return ordersWithItems
    } catch (error) {
      console.error('Error in getAllOrders:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al obtener todas las órdenes')
    }
  }

  /**
   * Obtiene una orden específica por ID con consulta optimizada
   */
  async getOrderById(orderId: string): Promise<OrderWithItems | null> {
    try {
      if (!orderId) {
        throw new Error('ID de orden requerido')
      }

      // Usar una sola consulta con joins para obtener toda la información
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          user_email,
          total,
          status,
          payment_method,
          created_at,
          completed_at,
          cancelled_at,
          order_items (
            id,
            product_id,
            name,
            quantity,
            price,
            type,
            order_item_accounts (
              product_accounts (
                id,
                email,
                password,
                additional_info
              )
            )
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) {
        if (orderError.code === 'PGRST116') {
          // No se encontró la orden
          return null
        }
        console.error('Error fetching order:', orderError)
        throw new Error('No se pudo obtener la orden')
      }

      if (!orderData) {
        return null
      }

      // Transformar los datos al formato esperado
      const orderWithItems: OrderWithItems = {
        id: orderData.id,
        userId: orderData.user_id,
        userEmail: orderData.user_email,
        total: orderData.total,
        status: orderData.status,
        paymentMethod: orderData.payment_method,
        createdAt: new Date(orderData.created_at),
        completedAt: orderData.completed_at ? new Date(orderData.completed_at) : undefined,
        cancelledAt: orderData.cancelled_at ? new Date(orderData.cancelled_at) : undefined,
        items: orderData.order_items?.map(item => ({
          id: item.id,
          orderId: orderData.id,
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          type: item.type,
          accounts: item.order_item_accounts?.map(acc => ({
            id: acc.product_accounts?.[0]?.id || '',
            email: acc.product_accounts?.[0]?.email || '',
            password: acc.product_accounts?.[0]?.password || '',
            productId: item.product_id,
            isSold: true,
            additionalInfo: acc.product_accounts?.[0]?.additional_info
          })) || []
        })) || []
      }

      return orderWithItems
    } catch (error) {
      console.error('Error in getOrderById:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al obtener la orden')
    }
  }

  /**
   * Actualiza el estado de una orden
   */
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      if (!orderId || !status) {
        throw new Error('ID de orden y estado son requeridos')
      }

      const updateData: any = { status }
      
      // Agregar timestamp según el estado
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        throw new Error('No se pudo actualizar el estado de la orden')
      }

      return true
    } catch (error) {
      console.error('Error in updateOrderStatus:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al actualizar el estado')
    }
  }

  /**
   * Elimina una orden (solo para administradores)
   */
  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      if (!orderId) {
        throw new Error('ID de orden requerido')
      }

      // Primero verificar si la orden existe
      const order = await this.getOrderById(orderId)
      if (!order) {
        throw new Error('Orden no encontrada')
      }

      // Eliminar la orden (las relaciones se eliminan en cascada)
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) {
        console.error('Error deleting order:', error)
        throw new Error('No se pudo eliminar la orden')
      }

      return true
    } catch (error) {
      console.error('Error in deleteOrder:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al eliminar la orden')
    }
  }

  /**
   * Obtiene los items de una orden específica
   */
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      if (!orderId) {
        throw new Error('ID de orden requerido')
      }

      const { data: itemsData, error } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          name,
          quantity,
          price,
          type,
          order_item_accounts (
            product_accounts (
              id,
              email,
              password,
              additional_info
            )
          )
        `)
        .eq('order_id', orderId)

      if (error) {
        console.error('Error fetching order items:', error)
        throw new Error('No se pudieron obtener los items de la orden')
      }

      return itemsData?.map(item => ({
        id: item.id,
        orderId,
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        type: item.type,
        accounts: item.order_item_accounts?.map(acc => ({
          id: acc.product_accounts?.[0]?.id || '',
          email: acc.product_accounts?.[0]?.email || '',
          password: acc.product_accounts?.[0]?.password || '',
          productId: item.product_id,
          isSold: true,
          additionalInfo: acc.product_accounts?.[0]?.additional_info
        })) || []
      })) || []
    } catch (error) {
      console.error('Error in getOrderItems:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al obtener los items')
    }
  }

  /**
   * Obtiene estadísticas de órdenes
   */
  async getOrderStats(userId?: string): Promise<OrderSummary> {
    try {
      let query = supabase.from('orders').select('status, total, created_at')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data: orders, error } = await query

      if (error) {
        console.error('Error fetching order stats:', error)
        throw new Error('No se pudieron obtener las estadísticas')
      }

      const stats: OrderSummary = {
        totalOrders: orders?.length || 0,
        completedOrders: orders?.filter(o => o.status === 'completed').length || 0,
        pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
        cancelledOrders: orders?.filter(o => o.status === 'cancelled').length || 0,
        totalRevenue: orders?.filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + o.total, 0) || 0
      }

      return stats
    } catch (error) {
      console.error('Error in getOrderStats:', error)
      throw error instanceof Error ? error : new Error('Error inesperado al obtener estadísticas')
    }
  }

  /**
   * Verifica si un usuario puede realizar una nueva compra
   */
  async canUserPurchase(userId: string, cartItems: CartItem[]): Promise<{ canPurchase: boolean; reason?: string }> {
    try {
      // Get user balance first
      const user = await authService.getUserById(userId)
      if (!user) {
        return { canPurchase: false, reason: 'Usuario no encontrado' }
      }
      
      const result = await transactionService.canProcessTransaction(cartItems, user.balance)
      return { 
        canPurchase: result.canProcess, 
        reason: result.issues.length > 0 ? result.issues.join('; ') : undefined 
      }
    } catch (error) {
      console.error('Error checking user purchase ability:', error)
      return { canPurchase: false, reason: 'Error al verificar capacidad de compra' }
    }
  }
}

export const orderService = new OrderService()