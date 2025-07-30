import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product }) => {
  // Asegurarse de que no haya valores numéricos sueltos
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Optimización: Memoizar cálculos de stock
  const { availableStock, isOutOfStock } = useMemo(() => {
    const stock = product.accounts && Array.isArray(product.accounts) ? 
      product.accounts.filter(acc => !acc.isSold).length : 
      0;
    
    return {
      availableStock: stock,
      isOutOfStock: !product.accounts || !Array.isArray(product.accounts) || stock <= 0
    };
  }, [product.accounts]);

  // Optimización: Memoizar event handlers
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't navigate if the click was on the add to cart button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product);
    }
  }, [addToCart, product, isOutOfStock]);

  // Evitar que se renderice cualquier valor fuera de los contenedores
  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer ${
        isOutOfStock ? 'opacity-60' : ''
      }`}
      data-testid="product-card"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Wrapper para asegurar que no haya elementos sueltos */}
      <div className="product-card-wrapper">
      {/* Eliminamos cualquier contenido que pueda estar causando el "0" */}
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm">
              SIN STOCK
            </span>
          </div>
        )}
        {!!product.discount && product.discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            -{product.discount}%
          </div>
        )}
        {availableStock > 0 && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            {availableStock} {availableStock === 1 ? 'unidad' : 'unidades'} disponible{availableStock !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-gray-500 mb-1">{product.category}</div>
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        {isOutOfStock ? (
          <div className="w-full bg-gray-400 text-white py-2 px-4 rounded-md text-center font-medium">
            Agotado
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Añadir al carrito
          </button>
        )}
      </div>
      </div> {/* Cierre del div wrapper */}
      {/* Asegurarse de que no haya ningún texto o número suelto después del div wrapper */}
    </div>
  );
});

// Optimización: Añadir displayName para debugging
ProductCard.displayName = 'ProductCard';

export default ProductCard;