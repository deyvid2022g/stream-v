import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { orderService, OrderWithItems } from '../services/orderService';

interface OrderContextType {
  orders: OrderWithItems[];
  createOrder: (items: CartItem[]) => Promise<OrderWithItems | null>;
  getUserOrders: (userId: string) => Promise<OrderWithItems[]>;
  updateOrderStatus: (orderId: string, status: OrderWithItems['status']) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  getAllOrders: () => OrderWithItems[];
  getOrdersByUser: (userId: string) => OrderWithItems[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const { user, updateUserBalance } = useAuth();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const ordersData = await orderService.getAllOrders();
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, []);

  const createOrder = async (items: CartItem[]): Promise<OrderWithItems | null> => {
    if (!user) return null;

    try {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (user.balance < total) {
        throw new Error('Saldo insuficiente');
      }

      const order = await orderService.createOrder(user.id, user.email, items, total);
      
      if (order) {
        // Actualizar balance del usuario
        const newBalance = user.balance - total;
        await updateUserBalance(newBalance);
        
        // Recargar órdenes
        const ordersData = await orderService.getAllOrders();
        setOrders(ordersData);
        
        return order;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const getUserOrders = async (userId: string): Promise<OrderWithItems[]> => {
    try {
      const ordersData = await orderService.getUserOrders(userId);
      return ordersData;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderWithItems['status']) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await orderService.deleteOrder(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };

  const getAllOrders = (): OrderWithItems[] => {
    return orders;
  };

  const getOrdersByUser = (userId: string): OrderWithItems[] => {
    return orders.filter(order => order.userId === userId);
  };

  return (
    <OrderContext.Provider 
      value={{
        orders,
        createOrder,
        getUserOrders,
        updateOrderStatus,
        deleteOrder,
        getAllOrders,
        getOrdersByUser
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export { useOrders };
export default OrderContext;