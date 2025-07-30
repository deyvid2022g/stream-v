import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useOrders } from '../context/OrderContext';
const Checkout: React.FC = () => {
  const { items, removeFromCart, getCartSummary, validateCart, isLoading: cartLoading } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessTime, setLastProcessTime] = useState(0);
  const [cartValidation, setCartValidation] = useState<{isValid: boolean; issues: string[]}>({isValid: true, issues: []});

  // Obtener resumen del carrito usando la función optimizada
  const cartSummary = getCartSummary();
  
  // Validar carrito cuando cambian los items
  useEffect(() => {
    const performValidation = async () => {
      if (items.length > 0) {
        const validation = await validateCart();
        setCartValidation(validation);
      } else {
        setCartValidation({isValid: true, issues: []});
      }
    };
    
    performValidation();
  }, [items, validateCart]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleCheckout = useCallback(async () => {
    // Prevenir múltiples clics rápidos (debounce de 3 segundos)
    const now = Date.now();
    if (now - lastProcessTime < 3000) {
      addNotification('warning', 'Por favor espera antes de intentar nuevamente');
      return;
    }
    
    if (isProcessing || cartLoading) {
      addNotification('warning', 'Ya hay una operación en proceso, por favor espera');
      return;
    }

    if (!user) {
      addNotification('error', 'Debes iniciar sesión para realizar una compra');
      navigate('/login');
      return;
    }

    if (validItems.length === 0) {
      addNotification('error', 'Tu carrito está vacío');
      navigate('/cart');
      return;
    }

    // Validaciones usando las funciones optimizadas
    if (!cartValidation.isValid) {
      addNotification('error', 'Hay problemas en tu carrito. Revisa los productos.');
      return;
    }
    
    if (cartSummary.hasStockIssues) {
      addNotification('error', 'Hay problemas de stock en tu carrito. Revisa los productos.');
      return;
    }

    if (user.balance < cartSummary.total) {
      addNotification('error', `Saldo insuficiente. Necesitas ${(cartSummary.total - user.balance).toFixed(0)} pts más`);
      return;
    }

    setIsProcessing(true);
    setLastProcessTime(now);

    try {
      addNotification('info', 'Procesando tu pedido...');
      
      // Validación en tiempo real antes de procesar
      const realtimeValidation = await validateCart();
      if (!realtimeValidation.isValid) {
        addNotification('error', 'El carrito ha cambiado. Por favor, revisa los productos.');
        setCartValidation(realtimeValidation);
        return;
      }
      
      // Crear la orden usando el contexto de órdenes
      const order = await createOrder(validItems);
      
      if (!order) {
        throw new Error('Error al crear la orden');
      }

      // Eliminar artículos comprados del carrito
      validItems.forEach(item => {
        removeFromCart(item.id);
      });

      // Mostrar mensaje de éxito
      addNotification('success', `¡Compra realizada exitosamente! Orden #${order.id.slice(-6)}`);
      addNotification('info', 'Las credenciales han sido enviadas a tu correo electrónico');
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        navigate('/account?tab=orders');
      }, 1500);

    } catch (error: unknown) {
      console.error('Checkout error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Saldo insuficiente')) {
          addNotification('error', error.message);
        } else if (error.message.includes('stock') || error.message.includes('disponible')) {
          addNotification('error', 'Algunos productos ya no están disponibles. Por favor, actualiza tu carrito.');
          // Revalidar carrito después de error de stock
          const newValidation = await validateCart();
          setCartValidation(newValidation);
        } else {
          addNotification('error', `Error: ${error.message}`);
        }
      } else {
        addNotification('error', 'Error al procesar la compra. Intenta nuevamente.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [user, lastProcessTime, cartSummary, cartValidation, validateCart, createOrder, removeFromCart, addNotification, navigate, isProcessing, cartLoading]);

  // Filter out any undefined or invalid items before calculating total
  const validItems = items.filter(item => item && typeof item.price === 'number' && typeof item.quantity === 'number');
  
  const { total, itemCount, hasStockIssues, stockIssues } = cartSummary;
  const hasValidationIssues = !cartValidation.isValid || hasStockIssues;
  
  if (validItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Carrito vacío</h1>
        <p>No hay productos en el carrito.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4 transition-colors"
            disabled={isProcessing}
          >
            ← Volver al carrito
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Finalizar Compra</h1>
        </div>
        
        {isProcessing && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm font-medium">Procesando...</span>
          </div>
        )}
      </div>
      
      {/* Alertas de validación y stock */}
      {hasValidationIssues && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="text-red-400 mt-0.5 mr-3 flex-shrink-0">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-2">Problemas detectados:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {!cartValidation.isValid && cartValidation.issues.map((issue, index) => (
                  <li key={`validation-${index}`}>• {issue}</li>
                ))}
                {hasStockIssues && stockIssues.map((issue, index) => (
                  <li key={`stock-${index}`}>• {issue}</li>
                ))}
              </ul>
              <p className="text-xs text-red-600 mt-2">Por favor, ajusta las cantidades en tu carrito antes de continuar.</p>
              {cartLoading && (
                <div className="mt-2 flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-xs">Validando carrito...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Resumen de la compra</h2>
        
        <div className="space-y-4 mb-6">
          {validItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{(item.price * item.quantity).toFixed(0)} pts</p>
                <p className="text-sm text-gray-500">{item.price.toFixed(0)} pts c/u</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal ({itemCount} items)</span>
              <span className="font-medium">{total.toFixed(0)} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Envío digital</span>
              <span className="font-medium text-green-600">✓ Gratis</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Procesamiento</span>
              <span className="font-medium text-green-600">✓ Instantáneo</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total a pagar:</span>
                <span className="text-yellow-600">{total.toFixed(0)} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Método de pago</h2>
        <p className="mb-6">El pago se realizará utilizando tus puntos disponibles.</p>
        
        {user && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-700 font-medium">Tu saldo actual:</span>
              <span className="font-bold text-blue-800 text-lg">{user.balance.toFixed(0)} pts</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-700">Total a pagar:</span>
              <span className="font-semibold text-blue-800">{total.toFixed(0)} pts</span>
            </div>
            
            <div className="border-t border-blue-200 pt-2">
              {user.balance >= total ? (
                <div className="flex items-center text-green-700">
                  <span className="mr-2">✓</span>
                  <span className="text-sm font-medium">Saldo suficiente</span>
                  <span className="ml-auto text-sm">Restante: {(user.balance - total).toFixed(0)} pts</span>
                </div>
              ) : (
                <div className="flex items-center text-red-700">
                  <span className="mr-2">⚠️</span>
                  <span className="text-sm font-medium">Saldo insuficiente</span>
                  <span className="ml-auto text-sm">Faltan: {(total - user.balance).toFixed(0)} pts</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Los puntos serán descontados automáticamente de tu saldo al confirmar la compra.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleCheckout}
            disabled={!user || user.balance < total || hasValidationIssues || isProcessing || cartLoading}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              user && user.balance >= total && !hasValidationIssues && !isProcessing && !cartLoading
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                <span>Procesando compra...</span>
              </>
            ) : cartLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span>Validando carrito...</span>
              </>
            ) : (
              <>
                <span>💳</span>
                <span>Confirmar y pagar {total.toFixed(0)} pts</span>
              </>
            )}
          </button>
          
          {hasValidationIssues && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 text-center">
                ⚠️ Resuelve los problemas detectados antes de continuar
              </p>
            </div>
          )}
        </div>
        
        {user && user.balance < total && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center mb-2">
                💡 <strong>¿Necesitas más saldo?</strong> Carga puntos de forma rápida y segura
              </p>
            </div>
            
            <button
              onClick={() => {
                const needed = (total - user.balance).toFixed(0);
                const message = `Hola, quiero cargar ${needed} puntos a mi cuenta de Arkion. Mi email es: ${user.email}`;
                const whatsappUrl = `https://wa.me/573181394093?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              💬 Cargar {(total - user.balance).toFixed(0)} pts por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
