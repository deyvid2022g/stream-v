import { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../context/ProductContext';
import { useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';

const Store = () => {
  const { products, loading, error } = useProducts();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter products based on search query and available stock
  const filteredProducts = useMemo(() => {
    // First filter by stock
    const inStockProducts = products.filter(product => {
      const availableStock = product.accounts?.filter(acc => !acc.isSold).length || 0;
      return availableStock > 0;
    });

    // Then apply search filter
    if (!searchQuery.trim()) return inStockProducts;
    
    const query = searchQuery.toLowerCase();
    return inStockProducts.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(query) || false;
      const descMatch = product.description?.toLowerCase().includes(query) || false;
      const categoryMatch = product.category?.toLowerCase().includes(query) || false;
      return nameMatch || descMatch || categoryMatch;
    });
  }, [products, searchQuery]);
  
  // Handle search from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Handle checkout success message
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('checkout');
    
    if (success === 'success') {
      // Show success notification
      console.log('Checkout successful!');
      
      // Clean up the URL parameter without causing a reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('checkout');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error loading products. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No mostrar el mensaje de "No se encontraron productos" si hay productos en la tienda pero no coinciden con la búsqueda
  if (filteredProducts.length === 0 && products.length > 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No products found</h2>
        <p className="text-gray-500 mb-6">No products available that match your search</p>
        <button
          onClick={() => setSearchQuery('')}
          className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors"
        >
          Clear search
        </button>
      </div>
    );
  }

  // Mostrar mensaje si no hay productos en la tienda
  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No products available</h2>
        <p className="text-gray-500">Check back later for our products</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 lg:p-6 pt-16 lg:pt-6">
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Store;