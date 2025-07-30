import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useProducts from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ShoppingCart, CreditCard, ChevronLeft, Loader2, AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';
import { Product, CartItem } from '../types';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById } = useProducts();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addNotification } = useNotifications();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        if (!id) {
          throw new Error('No se encontró el producto');
        }
        const productData = getProductById(id);
        if (!productData) {
          throw new Error('Producto no encontrado');
        }
        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el producto');
        addNotification('error', 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, getProductById, addNotification]);

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      addNotification('info', 'Por favor inicia sesión para continuar');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      // Create a CartItem with the required properties
      const cartItem: CartItem = {
        ...product,
        quantity,
        // Ensure all required Product properties are included
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image,
        description: product.description,
        duration: product.duration,
        accounts: product.accounts || []
      };
      
      addToCart(cartItem);
      addNotification('success', `${product.name} agregado al carrito (${quantity} unidades)`);
    } catch (error) {
      addNotification('error', 'Error al agregar el producto al carrito');
    } finally {
      setIsAddingToCart(false);
    }
  }, [isAuthenticated, product, quantity, addToCart, addNotification, navigate, id]);

  const handleBuyNow = useCallback(async () => {
    if (!isAuthenticated) {
      addNotification('info', 'Por favor inicia sesión para continuar');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    
    if (!product) return;
    
    const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
    
    // Validaciones previas
    if (availableStock < quantity) {
      addNotification('error', `Solo hay ${availableStock} unidades disponibles`);
      return;
    }
    
    setIsBuyingNow(true);
    try {
      addNotification('info', 'Procesando compra...');
      // Create a CartItem with the required properties
      const cartItem: CartItem = {
        ...product,
        quantity,
        // Ensure all required Product properties are included
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image,
        description: product.description,
        duration: product.duration,
        accounts: product.accounts || []
      };
      
      addToCart(cartItem);
      addNotification('success', '¡Compra realizada exitosamente! Revisa tu email para las credenciales.');
      navigate('/checkout');
    } catch (error) {
      console.error('Error en compra directa:', error);
      addNotification('error', 'Error al procesar la compra. Inténtalo nuevamente.');
    } finally {
      setIsBuyingNow(false);
    }
  }, [isAuthenticated, product, quantity, addToCart, addNotification, navigate, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Producto no encontrado'}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center text-yellow-600 hover:text-yellow-800"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-yellow-600 hover:text-yellow-800"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Volver a la tienda
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden md:flex">
        {/* Product Image */}
        <div className="md:w-1/2 p-6">
          <div className="h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                Sin imagen
              </div>
            )}
          </div>
        </div>
        
        {/* Product Info */}
        <div className="md:w-1/2 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center mb-4">
            <span className="text-2xl font-bold text-yellow-600">
              ${product.price.toFixed(2)}
            </span>
            {product.accounts && product.accounts.length > 0 ? (
              <span className="ml-4 text-sm text-green-600">
                {product.accounts.filter(acc => !acc.isSold).length} en stock
              </span>
            ) : (
              <span className="ml-4 text-sm text-red-600">Agotado</span>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Descripción</h2>
            <p className="text-gray-700">
              {product.description || 'No hay descripción disponible para este producto.'}
            </p>
          </div>
          
          {/* Stock y cantidad */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Cantidad:</span>
              <div className="flex items-center space-x-2">
                {(() => {
                  const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
                  if (availableStock <= 10 && availableStock > 0) {
                    return (
                      <span className="text-xs text-orange-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Solo {availableStock} disponibles
                      </span>
                    );
                  } else if (availableStock === 0) {
                    return (
                      <span className="text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Agotado
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {availableStock} disponibles
                      </span>
                    );
                  }
                })()}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1 || isAddingToCart || isBuyingNow}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 border-x min-w-[60px] text-center font-medium">{quantity}</span>
                <button
                  onClick={() => {
                    const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
                    if (quantity < availableStock) {
                      setQuantity(quantity + 1);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(() => {
                    const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
                    return quantity >= availableStock || isAddingToCart || isBuyingNow;
                  })()}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Total: <span className="font-bold text-yellow-600">{(product.price * quantity).toFixed(2)} pts</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleBuyNow}
              disabled={(() => {
                const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
                return !isAuthenticated || availableStock < quantity || isAddingToCart || isBuyingNow;
              })()} 
              className={`w-full flex items-center justify-center px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                (() => {
                  const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
                  return isAuthenticated && availableStock >= quantity && !isAddingToCart && !isBuyingNow
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white hover:shadow-lg transform hover:scale-105'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed';
                })()
              }`}
            >
              {isBuyingNow ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Comprar ahora
                </>
              )}
            </button>
            
            <button
              onClick={handleAddToCart}
              disabled={(() => {
                const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
                return !isAuthenticated || availableStock < quantity || isAddingToCart || isBuyingNow;
              })()} 
              className={`w-full flex items-center justify-center px-6 py-3 border rounded-md font-medium transition-all duration-300 ${
                (() => {
                  const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
                  return isAuthenticated && availableStock >= quantity && !isAddingToCart && !isBuyingNow
                    ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:shadow-lg'
                    : 'border-gray-300 text-gray-400 cursor-not-allowed';
                })()
              }`}
            >
              {isAddingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
                  <span>Agregando...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Añadir al carrito
                </>
              )}
            </button>
            
            {!isAuthenticated && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  <span className="font-medium">¡Inicia sesión</span> para comprar este producto
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
