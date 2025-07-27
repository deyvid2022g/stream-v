import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { Order } from '../types/order';

const Checkout: React.FC = () => {
  const { items, removeFromCart } = useCart();
  const { user, updateUserBalance } = useAuth();
  const { createOrder } = useOrders();
  const { addNotification } = useNotifications();
  const { products, markAccountAsSold } = useProducts();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (validItems.length === 0) {
      addNotification('warning', 'El carrito está vacío');
      navigate('/cart');
      return;
    }
    
    if (!user) {
      addNotification('error', 'Debes iniciar sesión para realizar una compra');
      navigate('/login');
      return;
    }

    // Verificar stock antes de proceder al pago
    const stockIssues = [];
    const itemsToProcess: string[] = [];
    
    // Crear un mapa de productos para verificación de stock
    const productsMap = new Map(products.map(p => [p.id, p]));
    
    for (const item of validItems) {
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
      navigate('/cart');
      return;
    }
    
    if (user.balance < total) {
      addNotification('warning', 'Saldo insuficiente. Por favor, carga saldo para continuar.');
      navigate('/cart');
      return;
    }

    try {
      // Crear la orden solo con los artículos que se pueden comprar
      const itemsToPurchase = validItems.filter(item => itemsToProcess.includes(item.id));
      
      // Verificar que hay artículos para comprar
      if (itemsToPurchase.length === 0) {
        addNotification('error', 'No hay productos válidos para comprar');
        navigate('/cart');
        return;
      }
      
      // Verificar nuevamente el saldo del usuario (podría haber cambiado)
      const totalToPurchase = itemsToPurchase.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (user.balance < totalToPurchase) {
        addNotification('error', `Saldo insuficiente. Necesitas ${totalToPurchase} puntos para completar la compra.`);
        navigate('/cart');
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
        navigate('/cart');
        return;
      }
      
      // Función para marcar las cuentas como vendidas después de crear la orden
      const markAccountsAsSold = async (order: Order) => {
        try {
          const markedAccounts = [];
          const failedAccounts = [];
          
          for (const item of itemsToPurchase) {
            const product = productsMap.get(item.id);
            if (!product || !product.accounts) {
              failedAccounts.push({
                productId: item.id,
                productName: item.name,
                error: 'Producto no encontrado o sin cuentas disponibles'
              });
              continue;
            }
              
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
      
      // Marcar las cuentas como vendidas después de crear la orden
      await markAccountsAsSold(order);
      
      // Actualizar el saldo del usuario
      const newBalance = user.balance - total;
      await updateUserBalance(newBalance);
      
      // Eliminar solo los artículos comprados del carrito
      itemsToProcess.forEach(itemId => removeFromCart(itemId));
      
      // Redirigir a la tienda con mensaje de éxito
      addNotification('success', `¡Compra realizada exitosamente! Orden #${order.id.slice(-6)}`);
      navigate('/store?checkout=success');
      
      // Simular envío de credenciales por correo
      setTimeout(() => {
        addNotification('info', 'Las credenciales han sido enviadas a tu email');
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      
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
      
      // Redirigir al carrito en caso de error
      navigate('/cart');
    }
  };

  // Filter out any undefined or invalid items before calculating total
  const validItems = items.filter(item => item && typeof item.price === 'number' && typeof item.quantity === 'number');
  
  const total = validItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  
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
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>
      
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
          <div className="flex justify-between font-bold text-lg">
            <span>Total en puntos:</span>
            <span>{total.toFixed(0)} pts</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Método de pago</h2>
        <p className="mb-6">El pago se realizará utilizando tus puntos disponibles.</p>
        
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
            disabled={!user || user.balance < total}
            className={`font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              user && user.balance >= total
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmar compra
          </button>
        </div>
        
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
  );
};

export default Checkout;
