import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ShoppingCart, CreditCard, ChevronLeft, Loader2 } from 'lucide-react';
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

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      addNotification('info', 'Por favor inicia sesión para continuar');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    
    if (!product) return;
    
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
    addNotification('success', 'Producto añadido al carrito');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      addNotification('info', 'Por favor inicia sesión para continuar');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    
    if (!product) return;
    
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
    navigate('/checkout');
  };

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
          
          <div className="mb-6">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <div className="flex items-center">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-100 hover:bg-gray-200"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="px-4 py-1 border-t border-b border-gray-300 bg-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200"
                disabled={product.accounts && product.accounts.length > 0 && quantity >= product.accounts.filter(acc => !acc.isSold).length}
              >
                +
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleBuyNow}
              disabled={!product.accounts || product.accounts.length === 0 || product.accounts.every(acc => acc.isSold)}
              className={`w-full flex items-center justify-center px-6 py-3 rounded-md text-white font-medium ${
                !product.accounts || product.accounts.length === 0 || product.accounts.every(acc => acc.isSold)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Comprar ahora
            </button>
            
            <button
              onClick={handleAddToCart}
              disabled={!product.accounts || product.accounts.length === 0 || product.accounts.every(acc => acc.isSold)}
              className={`w-full flex items-center justify-center px-6 py-3 border border-yellow-500 rounded-md font-medium ${
                !product.accounts || product.accounts.length === 0 || product.accounts.every(acc => acc.isSold)
                  ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'text-yellow-600 hover:bg-yellow-50'
              }`}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
