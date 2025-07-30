import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useNotifications } from '../context/NotificationContext';
import useProducts from '../context/ProductContext';

const Cart: React.FC = () => {
  const { 
    items: allItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    validateCart, 
    getCartSummary,
    isLoading: cartLoading
  } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { addNotification } = useNotifications();
  const { products } = useProducts();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckoutAttempt, setLastCheckoutAttempt] = useState(0);
  const [cartValidation, setCartValidation] = useState<{ isValid: boolean; issues: string[] }>({ isValid: true, issues: [] });
  
  // Filter out any undefined or invalid items before rendering (memoized to prevent infinite re-renders)
  const filteredItems = useMemo(() => 
    allItems.filter(item => 
      item && 
      typeof item.id === 'string' &&
      typeof item.price === 'number' && 
      typeof item.quantity === 'number' &&
      item.quantity > 0
    ), [allItems]
  );
  
  // Use optimized cart summary
  const cartSummary = useMemo(() => getCartSummary(), [getCartSummary]);
  const { total: cartTotal, itemCount, hasStockIssues, stockIssues } = cartSummary;

  // Validate cart when items change
  useEffect(() => {
    const validateCartItems = async () => {
      if (filteredItems.length > 0) {
        const validation = await validateCart();
        setCartValidation(validation);
      } else {
        setCartValidation({ isValid: true, issues: [] });
      }
    };
    
    validateCartItems();
  }, [filteredItems, validateCart]);

  const handleCheckout = useCallback(async () => {
    // Prevenir múltiples clics rápidos (debounce de 3 segundos)
    const now = Date.now();
    if (now - lastCheckoutAttempt < 3000) {
      addNotification('warning', 'Por favor espera antes de intentar nuevamente');
      return;
    }
    
    if (isProcessing || cartLoading) {
      addNotification('warning', 'Ya hay una operación en proceso');
      return;
    }

    // Validaciones previas usando las nuevas funcionalidades
    if (filteredItems.length === 0) {
      addNotification('warning', 'El carrito está vacío');
      return;
    }
    
    if (!user) {
      addNotification('error', 'Debes iniciar sesión para realizar una compra');
      return;
    }

    if (user.balance < cartTotal) {
      addNotification('warning', `Saldo insuficiente. Necesitas ${(cartTotal - user.balance).toFixed(0)} puntos más.`);
      return;
    }

    // Usar la validación optimizada del carrito
    if (!cartValidation.isValid) {
      cartValidation.issues.forEach(issue => addNotification('error', issue));
      return;
    }

    // Validación adicional en tiempo real
    const currentValidation = await validateCart();
    if (!currentValidation.isValid) {
      currentValidation.issues.forEach(issue => addNotification('error', issue));
      setCartValidation(currentValidation);
      return;
    }

    setIsProcessing(true);
    setLastCheckoutAttempt(now);

    try {
      addNotification('info', 'Procesando compra... Por favor espera');
      
      const order = await createOrder(filteredItems);
      
      if (!order) {
        throw new Error('No se pudo crear la orden');
      }
      
      clearCart();
      
      addNotification('success', `¡Compra realizada exitosamente! Orden #${order.id.slice(-6)}`);
      
      setTimeout(() => {
        addNotification('info', 'Las credenciales están disponibles en tu historial de pedidos');
      }, 1500);
      
    } catch (error: unknown) {
      console.error('Error al procesar la compra:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Saldo insuficiente')) {
          addNotification('error', error.message);
        } else if (error.message.includes('stock') || error.message.includes('disponible')) {
          addNotification('error', 'Stock insuficiente. Algunos productos ya no están disponibles.');
          // Revalidar carrito después del error de stock
          const revalidation = await validateCart();
          setCartValidation(revalidation);
        } else if (error.message.includes('Usuario no encontrado')) {
          addNotification('error', 'Error de autenticación. Por favor, inicia sesión nuevamente.');
        } else {
          addNotification('error', `Error: ${error.message}`);
        }
      } else {
        addNotification('error', 'Error inesperado. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [filteredItems, user, cartTotal, createOrder, clearCart, addNotification, isProcessing, cartLoading, lastCheckoutAttempt, cartValidation, validateCart]);

  // Función para refrescar validación del carrito
  const refreshCartValidation = useCallback(async () => {
    const validation = await validateCart();
    setCartValidation(validation);
    return validation;
  }, [validateCart]);

  const handleQuantityChange = useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      const item = filteredItems.find(i => i.id === productId);
      removeFromCart(productId);
      addNotification('info', `"${item?.name || 'Producto'}" eliminado del carrito`);
      return;
    }
    
    // Usar la función optimizada del contexto que ya maneja validaciones
    updateQuantity(productId, newQuantity);
    
    // Refrescar validación después del cambio
    setTimeout(() => {
      refreshCartValidation();
    }, 100);
  }, [filteredItems, removeFromCart, updateQuantity, addNotification, refreshCartValidation]);

  const handleRemoveItem = useCallback(async (productId: string, productName: string) => {
    if (!productId) return;
    removeFromCart(productId);
    addNotification('info', `"${productName}" eliminado del carrito`);
    
    // Refrescar validación después de eliminar
    setTimeout(() => {
      refreshCartValidation();
    }, 100);
  }, [removeFromCart, addNotification, refreshCartValidation]);

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Agrega productos para continuar</p>
        <a
          href="/store"
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Ver productos
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        {/* Header */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4 overflow-x-auto">
            <span>Carrito de Compras</span>
            <span className="text-gray-400">›</span>
            <span>Checkout</span>
            <span className="text-gray-400">›</span>
            <span className="text-gray-400">Order Complete</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-800">Carrito de Compras ({filteredItems.length} productos)</h1>
        </div>

        {/* Alertas de stock y validación */}
        {(hasStockIssues || !cartValidation.isValid) && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Problemas detectados en el carrito:</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {stockIssues.map((issue, index) => (
                      <li key={`stock-${index}`}>• {issue}</li>
                    ))}
                    {cartValidation.issues.map((issue, index) => (
                      <li key={`validation-${index}`}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={refreshCartValidation}
                className="ml-4 p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-lg transition-colors"
                title="Refrescar validación"
                disabled={cartLoading}
              >
                <RefreshCw className={`w-4 h-4 ${cartLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Cart Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Productos ({itemCount} items)</h3>
                  <button
                    onClick={() => {
                      clearCart();
                      addNotification('info', 'Carrito vaciado');
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    disabled={isProcessing}
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <div key={item.id} className="p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full sm:w-20 h-48 sm:h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 w-full">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      {item.category && (
                        <p className="text-sm text-gray-600">{item.category}</p>
                      )}
                      {item.duration && (
                        <p className="text-sm text-gray-500 mt-1">{item.duration}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-lg font-bold text-gray-900">
                          {item.price.toFixed(0)} pts
                        </span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {item.originalPrice.toFixed(0)} pts
                          </span>
                        )}
                        {item.discount && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            -{item.discount}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start space-x-4 w-full sm:w-auto">
                      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessing}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessing || (() => {
                            const product = products.find(p => p.id === item.id);
                            // Solo verificar stock si el producto tiene accounts
                            if (!product?.accounts || !Array.isArray(product.accounts)) {
                              return false; // No hay restricciones de stock
                            }
                            const availableStock = product.accounts.filter(acc => !acc.isSold).length;
                            return item.quantity >= availableStock;
                          })()}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {(item.price * item.quantity).toFixed(0)} pts
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isProcessing}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Stock indicator */}
                    {(() => {
                      const product = products.find(p => p.id === item.id);
                      // Solo mostrar indicador de stock si el producto tiene accounts
                      if (!product?.accounts || !Array.isArray(product.accounts)) {
                        return null; // No mostrar indicador para productos sin accounts
                      }
                      
                      const availableStock = product.accounts.filter(acc => !acc.isSold).length;
                      if (availableStock <= 5 && availableStock > 0) {
                        return (
                          <div className="mt-2 text-xs text-orange-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Solo quedan {availableStock} unidades
                          </div>
                        );
                      } else if (availableStock === 0) {
                        return (
                          <div className="mt-2 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Producto agotado
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 lg:sticky lg:top-6 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Resumen del Pedido
            </h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                <span className="font-semibold">{cartTotal.toFixed(0)} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Envío digital</span>
                <span className="font-semibold text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Gratis
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-yellow-600">{cartTotal.toFixed(0)} pts</span>
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tu saldo actual:</span>
                <span className="font-bold text-gray-900">{user?.balance?.toFixed(0) || 0} pts</span>
              </div>
              {user && user.balance < cartTotal ? (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Saldo insuficiente
                </p>
              ) : (
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Saldo suficiente
                </p>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={!user || user.balance < cartTotal || hasStockIssues || !cartValidation.isValid || isProcessing || cartLoading}
              className={`w-full font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                user && user.balance >= cartTotal && !hasStockIssues && cartValidation.isValid && !isProcessing && !cartLoading
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {(isProcessing || cartLoading) ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>{cartLoading ? 'Validando...' : 'Procesando...'}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>PROCEDER AL PAGO</span>
                </>
              )}
            </button>

            {user && user.balance < cartTotal && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  Necesitas {(cartTotal - user.balance).toFixed(0)} pts más para completar esta compra
                </p>
                <button
                  onClick={() => {
                    const message = `Hola, quiero cargar ${(cartTotal - user.balance).toFixed(0)} puntos a mi cuenta de Arkion. Mi email es: ${user?.email}`;
                    const whatsappUrl = `https://wa.me/573181394093?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-full bg-yellow-400 text-black font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing}
                >
                  💬 CARGAR SALDO
                </button>
              </div>
            )}
            
            {(hasStockIssues || !cartValidation.isValid) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 text-center">
                  ⚠️ Resuelve los problemas detectados antes de continuar
                </p>
                {!cartValidation.isValid && (
                  <button
                    onClick={refreshCartValidation}
                    className="mt-2 w-full text-xs bg-red-100 hover:bg-red-200 text-red-700 py-1 px-2 rounded transition-colors"
                    disabled={cartLoading}
                  >
                    {cartLoading ? 'Validando...' : 'Refrescar validación'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;