import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useNotifications } from '../context/NotificationContext';
import { useProducts } from '../context/ProductContext';
import { Order } from '../types/order';

const Cart: React.FC = () => {
  const { items: allItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user, updateUserBalance } = useAuth();
  const { createOrder } = useOrders();
  const { addNotification } = useNotifications();
  const { products, markAccountAsSold } = useProducts();
  
  // Filter out any undefined or invalid items before rendering
  const items = allItems.filter(item => 
    item && 
    typeof item.id === 'string' &&
    typeof item.price === 'number' && 
    typeof item.quantity === 'number' &&
    item.quantity > 0
  );
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (items.length === 0) {
      addNotification('warning', 'El carrito está vacío');
      return;
    }
    
    if (!user) {
      addNotification('error', 'Debes iniciar sesión para realizar una compra');
      return;
    }

    // Verificar stock antes de proceder al pago
    const stockIssues = [];
    const itemsToProcess: string[] = [];
    
    // Crear un mapa de productos para verificación de stock
    const productsMap = new Map(products.map(p => [p.id, p]));
    
    for (const item of items) {
      const product = productsMap.get(item.id);
      if (!product) {
        stockIssues.push(`El producto "${item.name}" ya no está disponible`);
        continue;
      }
      
      // Verificar stock real basado en cuentas no vendidas
      const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
      
      if (availableStock === 0) {
        stockIssues.push(`El producto "${item.name}" está agotado`);
      } else if (availableStock < item.quantity) {
        stockIssues.push(
          `Solo hay ${availableStock} ${availableStock === 1 ? 'unidad' : 'unidades'} ` +
          `disponible${availableStock === 1 ? '' : 's'} de "${item.name}". ` +
          `Tienes ${item.quantity} en el carrito.`
        );
      } else {
        // Si hay stock suficiente, marcar para procesar este artículo
        itemsToProcess.push(item.id);
      }
    }
    
    if (stockIssues.length > 0) {
      stockIssues.forEach(issue => addNotification('warning', issue));
      addNotification('error', 'Por favor actualiza tu carrito antes de continuar');
      return;
    }
    
    if (user.balance < total) {
      addNotification('warning', 'Saldo insuficiente. Por favor, carga saldo para continuar.');
      return;
    }

    try {
      // Crear la orden solo con los artículos que se pueden comprar
      const itemsToPurchase = items.filter(item => itemsToProcess.includes(item.id));
      
      // Verificar que hay artículos para comprar
      if (itemsToPurchase.length === 0) {
        addNotification('error', 'No hay productos válidos para comprar');
        return;
      }
      
      // Verificar nuevamente el saldo del usuario (podría haber cambiado)
      const totalToPurchase = itemsToPurchase.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (user.balance < totalToPurchase) {
        addNotification('error', `Saldo insuficiente. Necesitas ${totalToPurchase} puntos para completar la compra.`);
        return;
      }
      
      // Verificar nuevamente el stock de los productos
      const stockVerification = [];
      for (const item of itemsToPurchase) {
        const product = productsMap.get(item.id);
        if (!product) {
          stockVerification.push({
            productId: item.id,
            productName: item.name,
            error: 'Producto no encontrado'
          });
          continue;
        }
        
        const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
        if (availableStock < item.quantity) {
          stockVerification.push({
            productId: item.id,
            productName: item.name,
            requested: item.quantity,
            available: availableStock
          });
        }
      }
      
      if (stockVerification.length > 0) {
        console.error('Verificación de stock fallida:', stockVerification);
        stockVerification.forEach(issue => {
          if (issue.available !== undefined && issue.requested !== undefined) {
            if (issue.available === 0) {
              addNotification('warning', `El producto "${issue.productName}" está agotado`);
            } else if (issue.available < issue.requested) {
              addNotification('warning', `Solo hay ${issue.available} unidades disponibles de "${issue.productName}". Tienes ${issue.requested} en el carrito.`);
            }
          } else {
            addNotification('warning', `Error al verificar el stock de "${issue.productName}"`);
          }
        });
        addNotification('error', 'Por favor actualiza tu carrito antes de continuar');
        return;
      }
      
      // Función para marcar las cuentas como vendidas después de crear la orden
      const markAccountsAsSold = async (order: Order) => {
        try {
          const markedAccounts = [];
          const failedAccounts = [];
          
          for (const item of itemsToPurchase) {
            const product = productsMap.get(item.id);
            if (product?.accounts) {  
              // Obtener cuentas disponibles (no vendidas)
              const availableAccounts = product.accounts.filter(acc => !acc.isSold);
              
              // Verificar nuevamente si hay suficientes cuentas disponibles
              if (availableAccounts.length < item.quantity) {
                failedAccounts.push({
                  productId: product.id,
                  productName: item.name,
                  requested: item.quantity,
                  available: availableAccounts.length
                });
                continue;
              }
              
              // Tomar las primeras N cuentas disponibles (donde N es la cantidad comprada)
              const accountsToSell = availableAccounts.slice(0, item.quantity);
              
              // Crear las cuentas para la orden
              const orderAccounts = accountsToSell.map(account => ({
                id: account.id,
                email: account.email,
                password: account.password,
                productId: product.id,
                productName: item.name
              }));
              
              // Actualizar el OrderItem con las cuentas específicas
              const orderItem = order.items.find(orderItem => orderItem.productId === item.id);
              if (orderItem) {
                orderItem.accounts = orderAccounts;
              }
              
              // Marcar cada cuenta como vendida
              for (const account of accountsToSell) {
                try {
                  await markAccountAsSold(account.id, order.id);
                  markedAccounts.push({
                    productId: product.id,
                    accountId: account.id,
                    orderId: order.id
                  });
                } catch (accountError) {
                  console.error(`Error al marcar cuenta ${account.id} como vendida:`, accountError);
                  failedAccounts.push({
                    productId: product.id,
                    productName: item.name,
                    accountId: account.id,
                    error: accountError instanceof Error ? accountError.message : 'Error desconocido'
                  });
                }
              }
            }
          }
          
          // Si hay cuentas que no se pudieron marcar como vendidas
          if (failedAccounts.length > 0) {
            console.error('Algunas cuentas no pudieron ser marcadas como vendidas:', failedAccounts);
            
            // Agrupar errores por producto para mostrar notificaciones más claras
            const groupedErrors = failedAccounts.reduce((acc, curr) => {
              const key = curr.productId;
              if (!acc[key]) {
                acc[key] = {
                  productName: curr.productName,
                  count: 0,
                  errors: []
                };
              }
              acc[key].count++;
              if (curr.error) {
                acc[key].errors.push(curr.error);
              }
              return acc;
            }, {} as Record<string, {productName: string, count: number, errors: string[]}>);
            
            // Mostrar notificaciones específicas para cada producto con error
            Object.values(groupedErrors).forEach(group => {
              addNotification('error', `Error al procesar ${group.count} cuenta(s) de "${group.productName}". Por favor, intenta nuevamente.`);
            });
            
            throw new Error(`No se pudieron procesar ${failedAccounts.length} cuentas`);
          }
          
          // No need to return anything as the callback should return Promise<void>
        } catch (error) {
          console.error('Error al marcar cuentas como vendidas:', error);
          throw error; // Relanzar el error para manejarlo en el catch externo
        }
      };

      // Crear la orden
      const order = await createOrder(itemsToPurchase);
      
      if (!order) {
        throw new Error('No se pudo crear la orden');
      }
      
      // Convertir Order de index.ts a Order de order.ts
      const orderWithUserInfo: Order = {
        ...order,
        userEmail: user.email || '',
        paymentMethod: 'points',
        items: order.items.map(item => ({
          id: item.id,
          productId: item.id, // Usar el id del item como productId
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          accounts: [], // Se llenará en markAccountsAsSold
          type: 'digital' as const
        }))
      };
      
      // Marcar las cuentas como vendidas después de crear la orden
      await markAccountsAsSold(orderWithUserInfo);
      
      // Actualizar el saldo del usuario
      const newBalance = user.balance - total;
      await updateUserBalance(newBalance);
      
      // Eliminar solo los artículos comprados del carrito
      itemsToProcess.forEach(itemId => removeFromCart(itemId));
      
      // Redirigir a la tienda con mensaje de éxito
      addNotification('success', `¡Compra realizada exitosamente! Orden #${order.id.slice(-6)}`);
      
      // Simular envío de credenciales por correo
      setTimeout(() => {
        addNotification('info', 'Las credenciales han sido enviadas a tu email');
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Error al procesar la compra:', error);
      
      // Manejar diferentes tipos de errores con mensajes específicos
      if (error instanceof Error) {
        // Si el error contiene información sobre cuentas no procesadas
        if (error.message.includes('No se pudieron procesar')) {
          // Ya se mostraron notificaciones específicas en markAccountsAsSold
          addNotification('error', 'Hubo problemas al procesar algunas cuentas. Por favor, intenta nuevamente.');
        } 
        // Si es un error de saldo insuficiente
        else if (error.message.includes('Saldo insuficiente')) {
          addNotification('error', error.message);
        }
        // Si es un error de stock
        else if (error.message.includes('stock') || error.message.includes('disponible')) {
          addNotification('error', 'Algunos productos ya no están disponibles. Por favor, actualiza tu carrito.');
        }
        // Para otros errores con mensaje
        else {
          addNotification('error', `Error: ${error.message}`);
        }
      } else {
        // Error genérico
        addNotification('error', 'Error al procesar la compra. Intenta nuevamente.');
      }
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      addNotification('info', 'Producto eliminado del carrito');
      return;
    }
    
    // Verificar stock disponible antes de actualizar cantidad
    const product = products.find(p => p.id === productId);
    if (product) {
      const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
      if (newQuantity > availableStock) {
        addNotification('warning', `Solo hay ${availableStock} ${availableStock === 1 ? 'unidad disponible' : 'unidades disponibles'} de este producto`);
        // Limitar la cantidad al stock disponible
        updateQuantity(productId, availableStock);
        return;
      }
    }
    
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    if (!productId) return;
    removeFromCart(productId);
    addNotification('info', `${productName} eliminado del carrito`);
  };

  if (items.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Carrito de Compras ({items.length} productos)</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Cart Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Productos</h3>
                  <button
                    onClick={() => {
                      clearCart();
                      addNotification('info', 'Carrito vaciado');
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map(item => (
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
                          className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
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
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
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
                <span className="text-gray-600">Subtotal ({items.length} productos)</span>
                <span className="font-semibold">${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Descuentos</span>
                <span className="font-semibold text-green-600">-$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impuestos</span>
                <span className="font-semibold">$0</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-lg font-bold text-yellow-600">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tu saldo actual:</span>
                <span className="font-bold text-gray-900">${user?.balance?.toLocaleString() || 0}</span>
              </div>
              {user && user.balance < total && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Saldo insuficiente
                </p>
              )}
              {user && user.balance >= total && (
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Saldo suficiente
                </p>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={!user || user.balance < total}
              className={`w-full font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                user && user.balance >= total
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>PROCEDER AL PAGO</span>
            </button>

            {user && user.balance < total && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  Necesitas ${(total - user.balance).toLocaleString()} más para completar esta compra
                </p>
                <button
                  onClick={() => {
                    const message = `Hola, quiero cargar $${(total - user.balance).toLocaleString()} a mi cuenta de Arkion. Mi email es: ${user?.email}`;
                    const whatsappUrl = `https://wa.me/573181394093?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-full bg-yellow-400 text-black font-bold py-2 rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  CARGAR SALDO
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;