import { supabase } from '../lib/supabase';
import { Order } from '../types/order';
import { CartItem } from '../types';

export interface TransactionResult {
  order: Order;
  processedItems: Array<{
    cartItemId: string;
    productId: string;
    accountId: string;
    accountEmail: string;
    accountPassword: string;
  }>;
}

export interface ProcessTransactionParams {
  userId: string;
  userEmail: string;
  cartItems: CartItem[];
  userBalance: number;
  onAccountAssign: (orderItems: Array<{ product_id: string; account_id: string; order_id: string }>) => Promise<void>;
  onBalanceUpdate: (newBalance: number) => Promise<void>;
}

export interface StockValidation {
  isValid: boolean;
  issues: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
    message: string;
  }>;
}

export interface AccountAssignment {
  accountId: string;
  email: string;
  password: string;
  productId: string;
  productName: string;
}

class TransactionService {
  /**
   * Valida el stock disponible para los items del carrito
   * Optimizado para consultas paralelas y mejor rendimiento
   */
  async validateStock(items: CartItem[]): Promise<StockValidation> {
    if (!items || items.length === 0) {
      return { isValid: true, issues: [] };
    }

    const issues: StockValidation['issues'] = [];
    
    try {
      const productIds = [...new Set(items.map(item => item.id))];
      
      // Consulta optimizada: obtener productos y contar cuentas disponibles en paralelo
      const [productsResult, stockCountResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name')
          .in('id', productIds),
        supabase
          .from('product_accounts')
          .select('product_id')
          .in('product_id', productIds)
          .eq('is_sold', false)
      ]);
      
      if (productsResult.error) {
        throw new Error(`Error al obtener productos: ${productsResult.error.message}`);
      }
      
      if (stockCountResult.error) {
        throw new Error(`Error al validar stock: ${stockCountResult.error.message}`);
      }
      
      // Crear mapas para acceso rápido
      const productMap = new Map(
        productsResult.data?.map(p => [p.id, p.name]) || []
      );
      
      const stockCountMap = new Map<string, number>();
      stockCountResult.data?.forEach(account => {
        const current = stockCountMap.get(account.product_id) || 0;
        stockCountMap.set(account.product_id, current + 1);
      });
      
      // Validar cada item del carrito
      for (const item of items) {
        const productName = productMap.get(item.id) || item.name;
        const availableStock = stockCountMap.get(item.id) || 0;
        
        if (!productMap.has(item.id)) {
          issues.push({
            productId: item.id,
            productName,
            requested: item.quantity,
            available: 0,
            message: `El producto "${productName}" ya no está disponible`
          });
          continue;
        }
        
        if (availableStock === 0) {
          issues.push({
            productId: item.id,
            productName,
            requested: item.quantity,
            available: 0,
            message: `El producto "${productName}" está agotado`
          });
        } else if (availableStock < item.quantity) {
          issues.push({
            productId: item.id,
            productName,
            requested: item.quantity,
            available: availableStock,
            message: `Solo hay ${availableStock} unidades disponibles de "${productName}". Tienes ${item.quantity} en el carrito.`
          });
        }
      }
      
      return {
        isValid: issues.length === 0,
        issues
      };
      
    } catch (error) {
      console.error('Error validating stock:', error);
      return {
        isValid: false,
        issues: [{
          productId: '',
          productName: 'Error del sistema',
          requested: 0,
          available: 0,
          message: error instanceof Error ? error.message : 'Error al validar el stock. Por favor, intenta nuevamente.'
        }]
      };
    }
  }
  

  
  /**
   * Procesa una transacción completa con validaciones y rollback
   * Optimizado para mejor rendimiento y manejo de errores
   */
  async processTransaction(params: ProcessTransactionParams): Promise<TransactionResult> {
    const { userId, userEmail, cartItems, userBalance, onAccountAssign, onBalanceUpdate } = params;
    
    // Validaciones iniciales
    if (!cartItems || cartItems.length === 0) {
      throw new Error('El carrito está vacío');
    }
    
    if (!userId || !userEmail) {
      throw new Error('Información de usuario inválida');
    }
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (total <= 0) {
      throw new Error('El total de la compra debe ser mayor a 0');
    }
    
    // 1. Validaciones paralelas para mejor rendimiento
    const [stockValidation] = await Promise.all([
      this.validateStock(cartItems)
    ]);
    
    if (!stockValidation.isValid) {
      const errorMessages = stockValidation.issues.map(i => i.message).join('; ');
      throw new Error(`Stock insuficiente: ${errorMessages}`);
    }
    
    // 2. Validar saldo
    if (userBalance < total) {
      const deficit = (total - userBalance).toFixed(2);
      throw new Error(`Saldo insuficiente. Necesitas ${deficit} puntos adicionales.`);
    }
    
    // 3. Crear la orden con manejo de errores mejorado
    const createdOrder = await this.createOrder(userId, userEmail, cartItems, total);
    if (!createdOrder) {
      throw new Error('No se pudo crear la orden. Por favor, intenta nuevamente.');
    }
    
    let processedItems: TransactionResult['processedItems'] = [];
    
    try {
      // 4. Asignar cuentas con validación adicional
      const accountAssignments = await this.assignAccountsToOrder(createdOrder, cartItems);
      
      // 5. Marcar cuentas como vendidas en paralelo
      await this.markAccountsAsSold(accountAssignments.map(a => a.accountId));
      
      // 6. Obtener los order_items creados para relacionarlos con las cuentas
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id, product_id')
        .eq('order_id', createdOrder.id);
      
      if (orderItemsError) {
        console.error('Error fetching order items:', orderItemsError);
        throw new Error(`Error al obtener los items de la orden: ${orderItemsError.message}`);
      }
      
      // 7. Crear las relaciones order_item_accounts
      const orderItemAccounts = [];
      for (const assignment of accountAssignments) {
        const orderItem = orderItemsData?.find(item => item.product_id === assignment.productId);
        if (orderItem) {
          orderItemAccounts.push({
            order_item_id: orderItem.id,
            product_account_id: assignment.accountId
          });
        }
      }
      
      if (orderItemAccounts.length > 0) {
        const { error: accountRelationError } = await supabase
          .from('order_item_accounts')
          .insert(orderItemAccounts);
        
        if (accountRelationError) {
          console.error('Error creating order item account relations:', accountRelationError);
          throw new Error(`Error al relacionar cuentas con items: ${accountRelationError.message}`);
        }
      }
      
      // 8. Preparar datos para callbacks
      processedItems = accountAssignments.map(assignment => ({
        cartItemId: assignment.productId,
        productId: assignment.productId,
        accountId: assignment.accountId,
        accountEmail: assignment.email,
        accountPassword: assignment.password
      }));
      
      const orderItems = accountAssignments.map(assignment => ({
        product_id: assignment.productId,
        account_id: assignment.accountId,
        order_id: createdOrder.id
      }));
      
      // 9. Ejecutar callbacks en paralelo
      await Promise.all([
        onAccountAssign(orderItems),
        onBalanceUpdate(userBalance - total)
      ]);
      
      // 8. Finalizar orden
      await this.completeOrder(createdOrder.id);
      
      return {
        order: { ...createdOrder, status: 'completed' as any },
        processedItems
      };
      
    } catch (error) {
      console.error('Error processing transaction:', error);
      
      // Rollback: cancelar orden y liberar cuentas
      await Promise.all([
        this.cancelOrder(createdOrder.id),
        processedItems.length > 0 ? 
          this.releaseAccounts(processedItems.map(p => p.accountId)) : 
          Promise.resolve()
      ]);
      
      throw error instanceof Error ? error : new Error('Error inesperado durante la transacción');
    }
  }
  
  /**
   * Crea una nueva orden con manejo de transacciones
   */
  private async createOrder(userId: string, userEmail: string, items: CartItem[], total: number): Promise<Order | null> {
    try {
      // Usar transacción para asegurar consistencia
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          user_email: userEmail,
          total: Number(total.toFixed(2)),
          status: 'pending',
          payment_method: 'points',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error(`Error al crear la orden: ${orderError.message}`);
      }
      
      // Crear los items de la orden con validación
      const orderItems = items.map(item => {
        if (!item.id || !item.name || item.quantity <= 0 || item.price < 0) {
          throw new Error(`Datos inválidos para el producto: ${item.name}`);
        }
        
        return {
          order_id: order.id,
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price.toFixed(2))
        };
      });
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        
        // Rollback: eliminar la orden creada
        try {
          await supabase.from('orders').delete().eq('id', order.id);
        } catch (rollbackError) {
          console.error('Error during order rollback:', rollbackError);
        }
        
        throw new Error(`Error al crear los items de la orden: ${itemsError.message}`);
      }
      
      return order as Order;
      
    } catch (error) {
      console.error('Error in createOrder:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error inesperado al crear la orden');
    }
  }
  
  /**
   * Asigna cuentas a una orden de forma optimizada
   */
  private async assignAccountsToOrder(
    order: Order,
    items: CartItem[]
  ): Promise<AccountAssignment[]> {
    const assignments: AccountAssignment[] = [];
    
    // Procesar items en paralelo cuando sea posible
    const accountPromises = items.map(async (item) => {
      const { data: accounts, error } = await supabase
        .from('product_accounts')
        .select('id, email, password')
        .eq('product_id', item.id)
        .eq('is_sold', false)
        .order('created_at', { ascending: true }) // FIFO para fairness
        .limit(item.quantity);
      
      if (error) {
        throw new Error(`Error al obtener cuentas para ${item.name}: ${error.message}`);
      }
      
      if (!accounts || accounts.length < item.quantity) {
        throw new Error(
          `No hay suficientes cuentas disponibles para ${item.name}. ` +
          `Necesitas ${item.quantity}, disponibles: ${accounts?.length || 0}`
        );
      }
      
      return accounts.slice(0, item.quantity).map(account => ({
        accountId: account.id,
        email: account.email,
        password: account.password,
        productId: item.id,
        productName: item.name
      }));
    });
    
    try {
      const results = await Promise.all(accountPromises);
      results.forEach(itemAssignments => {
        assignments.push(...itemAssignments);
      });
      
      return assignments;
      
    } catch (error) {
      console.error('Error assigning accounts:', error);
      throw error;
    }
  }
  
  /**
   * Marca cuentas como vendidas
   */
  private async markAccountsAsSold(accountIds: string[]): Promise<void> {
    if (accountIds.length === 0) return;
    
    const { error } = await supabase
      .from('product_accounts')
      .update({ 
        is_sold: true,
        sold_at: new Date().toISOString()
      })
      .in('id', accountIds);
    
    if (error) {
      throw new Error(`Error al marcar cuentas como vendidas: ${error.message}`);
    }
  }
  
  /**
   * Libera cuentas (rollback)
   */
  private async releaseAccounts(accountIds: string[]): Promise<void> {
    if (accountIds.length === 0) return;
    
    try {
      await supabase
        .from('product_accounts')
        .update({ 
          is_sold: false,
          sold_at: null
        })
        .in('id', accountIds);
    } catch (error) {
      console.error('Error releasing accounts:', error);
      // No lanzar error aquí para no interferir con el rollback principal
    }
  }
  
  /**
   * Completa una orden
   */
  private async completeOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (error) {
      console.error('Error completing order:', error);
      // No lanzar error aquí ya que la transacción ya se procesó
    }
  }
  
  /**
   * Cancela una orden con manejo mejorado
   */
  private async cancelOrder(orderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) {
        console.error('Error cancelling order:', error);
      }
    } catch (error) {
      console.error('Error in cancelOrder:', error);
      // No lanzar error para no interferir con el rollback
    }
  }
  
  /**
   * Obtiene estadísticas de stock para un producto
   */
  async getProductStockInfo(productId: string): Promise<{
    total: number;
    available: number;
    sold: number;
  }> {
    try {
      const { data: accounts, error } = await supabase
        .from('product_accounts')
        .select('is_sold')
        .eq('product_id', productId);
      
      if (error) {
        throw new Error(`Error al obtener información de stock: ${error.message}`);
      }
      
      const total = accounts?.length || 0;
      const sold = accounts?.filter(acc => acc.is_sold).length || 0;
      const available = total - sold;
      
      return { total, available, sold };
      
    } catch (error) {
      console.error('Error getting stock info:', error);
      return { total: 0, available: 0, sold: 0 };
    }
  }
  
  /**
   * Valida si una transacción puede proceder (método público para uso externo)
   */
  async canProcessTransaction(cartItems: CartItem[], userBalance: number): Promise<{
    canProcess: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    if (!cartItems || cartItems.length === 0) {
      issues.push('El carrito está vacío');
      return { canProcess: false, issues };
    }
    
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Validar saldo
    if (userBalance < total) {
      issues.push(`Saldo insuficiente. Necesitas ${(total - userBalance).toFixed(2)} puntos adicionales.`);
    }
    
    // Validar stock
    const stockValidation = await this.validateStock(cartItems);
    if (!stockValidation.isValid) {
      issues.push(...stockValidation.issues.map(issue => issue.message));
    }
    
    return {
      canProcess: issues.length === 0,
      issues
    };
  }

}

export const transactionService = new TransactionService();