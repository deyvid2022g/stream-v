import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Product } from '../types';
import { products } from '../data/products';

interface SearchBarProps {
  onSearch: (results: Product[]) => void;
  onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (query.trim()) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      );
      onSearch(filtered);
    } else {
      onClear();
    }
  }, [query, onSearch, onClear]);

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full bg-gray-800 text-white rounded-lg px-10 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;