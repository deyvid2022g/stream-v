import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem } from '../types';
import { Order, OrderItem } from '../types/order';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  createOrder: (items: CartItem[], total: number, onOrderCreated?: (order: Order) => Promise<void>) => Promise<Order>;
  getOrdersByUser: (userId: string) => Order[];
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getAllOrders: () => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('arkion_orders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  const { user } = useAuth();

  const createOrder = async (items: CartItem[], total: number, onOrderCreated?: (order: Order) => Promise<void>): Promise<Order> => {
    if (!user) throw new Error('User must be authenticated to create order');

    // Convert CartItems to OrderItems (initially without accounts)
    const orderItems: OrderItem[] = items.map(item => ({
      id: item.id,
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      accounts: [], // Will be populated by the callback
      type: 'digital' as const
    }));

    const newOrder: Order = {
      id: Date.now().toString(),
      userId: user.id,
      userEmail: user.email,
      items: orderItems,
      total,
      status: 'processing',
      paymentMethod: 'balance',
      createdAt: new Date()
    };

    setOrders(prev => {
      const updated = [...prev, newOrder];
      localStorage.setItem('arkion_orders', JSON.stringify(updated));
      return updated;
    });

    // Llamar al callback después de crear la orden
    try {
      if (onOrderCreated) {
        await onOrderCreated(newOrder);
      }

      // Simulate order processing
      setTimeout(() => {
        updateOrderStatus(newOrder.id, 'completed');
      }, 3000);

      return newOrder;
    } catch (error) {
      console.error('Error en el proceso de creación de orden:', error);
      // Marcar la orden como cancelada en caso de error
      updateOrderStatus(newOrder.id, 'cancelled');
      throw error;
    }
  };

  const getOrdersByUser = (userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const updated = prev.map(order =>
        order.id === orderId 
          ? { 
              ...order, 
              status,
              deliveredAt: status === 'completed' ? new Date() : order.deliveredAt
            }
          : order
      );
      localStorage.setItem('arkion_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const getAllOrders = (): Order[] => {
    return orders;
  };

  return (
    <OrderContext.Provider 
      value={{
        orders,
        createOrder,
        getOrdersByUser,
        updateOrderStatus,
        getAllOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};