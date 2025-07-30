import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import { useNotifications } from './NotificationContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  validateCart: () => Promise<{ isValid: boolean; issues: string[] }>;
  getCartSummary: () => {
    total: number;
    itemCount: number;
    hasStockIssues: boolean;
    stockIssues: string[];
  };
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAddTime, setLastAddTime] = useState<Record<string, number>>({});
  const [isLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Persistir carrito en localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('arkion-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('arkion-cart');
      }
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('arkion-cart', JSON.stringify(items));
    } else {
      localStorage.removeItem('arkion-cart');
    }
  }, [items]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if (!product || !product.id) {
      addNotification('error', 'Producto inválido');
      return;
    }

    // Prevenir múltiples adiciones rápidas del mismo producto (debounce de 500ms)
    const now = Date.now();
    const lastTime = lastAddTime[product.id] || 0;
    
    if (now - lastTime < 500) {
      addNotification('warning', 'Por favor espera antes de añadir más productos');
      return;
    }
    
    setLastAddTime(prev => ({ ...prev, [product.id]: now }));
    
    setItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      // Verificar stock disponible basado en cuentas no vendidas
      const currentQuantity = existingItem ? existingItem.quantity : 0;
      
      // Solo verificar stock si el producto tiene accounts definidos
      if (product.accounts && Array.isArray(product.accounts)) {
        const availableStock = product.accounts.filter(acc => !acc.isSold).length;
        
        if (availableStock <= 0) {
          addNotification('error', `Lo sentimos, "${product.name}" está agotado`);
          return prev;
        }
        
        const requestedTotal = currentQuantity + quantity;
        if (requestedTotal > availableStock) {
          const maxCanAdd = availableStock - currentQuantity;
          if (maxCanAdd <= 0) {
            addNotification('warning', `Ya tienes el máximo disponible de "${product.name}" en tu carrito`);
            return prev;
          }
          addNotification('warning', `Solo se pueden agregar ${maxCanAdd} unidades más de "${product.name}"`);
          quantity = maxCanAdd;
        }
      }
      // Si no tiene accounts, permitir agregar sin restricciones de stock específicas

      if (existingItem) {
        const newQuantity = currentQuantity + quantity;
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        ) as CartItem[];
      }
      
      // Crear nuevo item del carrito con todas las propiedades requeridas
      const newCartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image,
        description: product.description,
        duration: product.duration,
        accounts: product.accounts || [],
        quantity
      };
      
      return [...prev, newCartItem];
    });
  }, [lastAddTime, addNotification]);

  const removeFromCart = useCallback((productId: string) => {
    if (!productId) {
      addNotification('error', 'ID de producto inválido');
      return;
    }
    
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== productId);
      if (filtered.length === prev.length) {
        addNotification('warning', 'El producto no está en el carrito');
      }
      return filtered;
    });
  }, [addNotification]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (!productId) {
      addNotification('error', 'ID de producto inválido');
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prev => {
      const item = prev.find(item => item.id === productId);
      if (!item) {
        addNotification('warning', 'El producto no está en el carrito');
        return prev;
      }

      // Verificar stock disponible solo si el producto tiene accounts
      if (item.accounts && Array.isArray(item.accounts)) {
        const availableStock = item.accounts.filter(acc => !acc.isSold).length;
        
        if (quantity > availableStock) {
          addNotification('warning', `Solo hay ${availableStock} ${availableStock === 1 ? 'unidad disponible' : 'unidades disponibles'} de "${item.name}"`);
          const adjustedQuantity = Math.max(1, availableStock);
          return prev.map(cartItem =>
            cartItem.id === productId
              ? { ...cartItem, quantity: adjustedQuantity }
              : cartItem
          );
        }
      }
      // Si no tiene accounts, permitir cualquier cantidad

      return prev.map(cartItem =>
        cartItem.id === productId
          ? { ...cartItem, quantity }
          : cartItem
      );
    });
  }, [removeFromCart, addNotification]);

  const clearCart = useCallback(() => {
    setItems([]);
    addNotification('info', 'Carrito vaciado');
  }, [addNotification]);

  const getTotal = useCallback(() => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const validateCart = useCallback(async (): Promise<{ isValid: boolean; issues: string[] }> => {
    if (items.length === 0) {
      return { isValid: false, issues: ['El carrito está vacío'] };
    }

    const issues: string[] = [];
    
    for (const item of items) {
      // Verificar que el item tenga propiedades válidas
      if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        issues.push(`Producto "${item.name || 'Desconocido'}" tiene datos inválidos`);
        continue;
      }

      // Si no hay accounts definidos, asumir que hay stock disponible
      // Esto permite que productos sin accounts específicos puedan comprarse
      if (!item.accounts || !Array.isArray(item.accounts)) {
        console.log(`Producto ${item.name} sin accounts - permitiendo compra`);
        continue; // Producto válido sin restricciones de stock específicas
      }

      const availableStock = item.accounts.filter(acc => !acc.isSold).length;
      console.log(`Producto ${item.name}: stock disponible = ${availableStock}, cantidad en carrito = ${item.quantity}`);
      
      if (availableStock === 0) {
        issues.push(`"${item.name}" está agotado`);
      } else if (item.quantity > availableStock) {
        issues.push(`"${item.name}" solo tiene ${availableStock} unidades disponibles, pero tienes ${item.quantity} en el carrito`);
      }
    }

    const result = {
      isValid: issues.length === 0,
      issues
    };
    
    console.log('Validación del carrito:', result);
    return result;
  }, [items]);

  const getCartSummary = useCallback(() => {
    const total = getTotal();
    const itemCount = getItemCount();
    const stockIssues: string[] = [];
    
    items.forEach(item => {
      // Solo verificar stock si el producto tiene accounts definidos
      if (item.accounts && Array.isArray(item.accounts)) {
        const availableStock = item.accounts.filter(acc => !acc.isSold).length;
        if (availableStock === 0) {
          stockIssues.push(`"${item.name}" está agotado`);
        } else if (item.quantity > availableStock) {
          stockIssues.push(`"${item.name}" excede el stock disponible`);
        }
      }
      // Si no tiene accounts, no hay problemas de stock
    });

    return {
      total,
      itemCount,
      hasStockIssues: stockIssues.length > 0,
      stockIssues
    };
  }, [items, getTotal, getItemCount]);

  return (
    <CartContext.Provider 
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        validateCart,
        getCartSummary,
        isLoading
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