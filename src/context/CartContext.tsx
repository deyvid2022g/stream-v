import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import { useNotifications } from './NotificationContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { addNotification } = useNotifications();

  const addToCart = (product: Product) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      // Verificar stock disponible basado en cuentas no vendidas
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
      
      if (availableStock <= 0) {
        addNotification('error', 'Lo sentimos, este producto está agotado');
        return prev;
      }
      
      if (currentQuantity >= availableStock) {
        addNotification('warning', `Solo hay ${availableStock} ${availableStock === 1 ? 'unidad disponible' : 'unidades disponibles'}`);
        return prev;
      }

      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + 1, availableStock);
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        ) as CartItem[];
      }
      return [...prev, { ...product, quantity: 1 }] as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prev => {
      const item = prev.find(item => item.id === productId);
      if (item) {
        // Verificar stock disponible basado en cuentas no vendidas
        const availableStock = item.accounts?.filter(acc => !acc.isSold).length || 0;
        const finalQuantity = Math.min(quantity, availableStock);
        
        if (quantity > availableStock) {
          addNotification('warning', `Solo hay ${availableStock} ${availableStock === 1 ? 'unidad disponible' : 'unidades disponibles'} de este producto`);
        }
        
        return prev.map(cartItem =>
          cartItem.id === productId
            ? { ...cartItem, quantity: finalQuantity }
            : cartItem
        );
      }
      return prev;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider 
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export { useCart };
export default CartContext;