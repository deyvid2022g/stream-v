import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Calcular stock disponible en tiempo real
  const availableStock = product.accounts && Array.isArray(product.accounts) ? 
    product.accounts.filter(acc => !acc.isSold).length : 
    0;

  // Determinar si el producto está agotado
  const isOutOfStock = !product.accounts || !Array.isArray(product.accounts) || availableStock <= 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if the click was on the add to cart button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer ${
        isOutOfStock ? 'opacity-60' : ''
      }`}
    >
      <div className="relative">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                SIN STOCK
              </span>
            </div>
          )}
        {product.discount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            -{product.discount}%
          </div>
        )}
        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold">
          {availableStock} {availableStock === 1 ? 'unidad' : 'unidades'} disponible{availableStock !== 1 ? 's' : ''}
        </div>
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
    </div>
  );
};

export default ProductCard;