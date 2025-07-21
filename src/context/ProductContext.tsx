import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 } from 'uuid';
import { Product, CreateProductDTO, UpdateProductDTO, ProductAccount } from '../types/product';
import { products as defaultProducts } from '../data/products';

// Move constants to a separate file if they need to be shared
const STORAGE_KEY = 'inventory_products';

// Define interfaces for localStorage data
interface StoredProductAccount extends Omit<ProductAccount, 'soldAt'> {
  soldAt?: string;
}

interface StoredProduct extends Omit<ExtendedProduct, 'createdAt' | 'updatedAt' | 'accounts'> {
  createdAt: string;
  updatedAt: string;
  accounts?: StoredProductAccount[];
}

// Extend the Product interface to include additional fields used in the context
interface ExtendedProduct extends Product {
  accounts?: ProductAccount[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductContextType {
  products: ExtendedProduct[];
  loading: boolean;
  error: string | null;
  addProduct: (productData: CreateProductDTO) => Promise<ExtendedProduct>;
  updateProduct: (productData: UpdateProductDTO) => Promise<ExtendedProduct>;
  deleteProduct: (productId: string) => Promise<void>;
  getProduct: (productId: string) => ExtendedProduct | undefined;
  addAccountsToProduct: (productId: string, accounts: { email: string; password: string }[]) => Promise<ExtendedProduct>;
  removeAccountsFromProduct: (productId: string, accountIds: string[]) => Promise<ExtendedProduct>;
  markAccountAsSold: (productId: string, accountId: string, orderId: string, userId: string) => Promise<ExtendedProduct>;
  getAvailableAccounts: (productId: string) => ProductAccount[];
  getNextAvailableAccount: (productId: string) => ProductAccount | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load products from localStorage on mount
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEY);
      if (savedProducts) {
        const parsedProducts: StoredProduct[] = JSON.parse(savedProducts);
        
        // Convert string dates back to Date objects
        const productsWithDates = parsedProducts.map((product) => ({
          ...product,
          accounts: product.accounts?.map(acc => ({
            ...acc,
            soldAt: acc.soldAt ? new Date(acc.soldAt) : undefined
          })),
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        }));
        
        setProducts(productsWithDates);
      } else {
        // If no saved products, load default products
        const extendedDefaultProducts: ExtendedProduct[] = defaultProducts.map(product => ({
          ...product,
          accounts: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        setProducts(extendedDefaultProducts);
      }
    } catch (err) {
      setError('Error loading products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
      } catch (err) {
        console.error('Error saving products:', err);
      }
    }
  }, [products, loading]);

  const addProduct = async (productData: CreateProductDTO): Promise<ExtendedProduct> => {
    try {
      const initialAccounts = productData.initialAccounts || [];
      const newProduct: ExtendedProduct = {
        ...productData,
        id: v4(),
        // Stock is now determined by the number of available (unsold) accounts
        stock: initialAccounts.length,
        accounts: initialAccounts.map(acc => ({
          id: v4(),
          email: acc.email,
          password: acc.password,
          isSold: false,
          soldAt: undefined,
          orderId: undefined,
          soldTo: undefined
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setProducts(prev => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      setError('Error adding product');
      console.error('Error adding product:', err);
      throw err;
    }
  };

  const updateProduct = async (productData: UpdateProductDTO): Promise<ExtendedProduct> => {
    try {
      const { id, addAccounts, removeAccountIds, ...updates } = productData;
      
      setProducts(prev => {
        const productIndex = prev.findIndex(p => p.id === id);
        if (productIndex === -1) throw new Error('Product not found');

        const product = prev[productIndex];
        let accounts = [...(product.accounts || [])];
        
        // Add new accounts if any
        const newAccounts = (addAccounts || []).map(acc => ({
          id: v4(),
          email: acc.email,
          password: acc.password,
          isSold: false,
          soldAt: undefined,
          orderId: undefined,
          soldTo: undefined
        }));
        
        // Remove accounts if any
        if (removeAccountIds && removeAccountIds.length > 0) {
          accounts = accounts.filter(acc => !removeAccountIds.includes(acc.id));
        }
        
        // Combine existing and new accounts
        const updatedAccounts = [...accounts, ...newAccounts];
        
        // Stock is now the total number of accounts (both sold and unsold)
        // Available stock is calculated by filtering unsold accounts
        const availableAccounts = updatedAccounts.filter(acc => !acc.isSold).length;
        
        const updatedProduct: ExtendedProduct = {
          ...product,
          ...updates,
          accounts: updatedAccounts,
          // Keep the original stock field for backward compatibility
          // but it will be calculated based on available accounts
          stock: availableAccounts,
          updatedAt: new Date()
        };

        const newProducts = [...prev];
        newProducts[productIndex] = updatedProduct;
        return newProducts;
      });

      const updated = products.find(p => p.id === id);
      if (!updated) throw new Error('Failed to update product');
      return updated;
    } catch (err) {
      setError('Error updating product');
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    try {
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      setError('Error deleting product');
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  const getProduct = (productId: string): ExtendedProduct | undefined => {
    return products.find(p => p.id === productId);
  };

  const addAccountsToProduct = async (productId: string, accounts: { email: string; password: string }[]): Promise<ExtendedProduct> => {
    return updateProduct({
      id: productId,
      addAccounts: accounts
    });
  };

  const removeAccountsFromProduct = async (productId: string, accountIds: string[]): Promise<ExtendedProduct> => {
    return updateProduct({
      id: productId,
      removeAccountIds: accountIds
    });
  };



  const markAccountAsSold = async (productId: string, accountId: string, orderId: string, userId: string): Promise<ExtendedProduct> => {
    try {
      setProducts(prev => {
        const productIndex = prev.findIndex(p => p.id === productId);
        if (productIndex === -1) throw new Error('Product not found');

        const product = prev[productIndex];
        const accountIndex = (product.accounts || []).findIndex(acc => acc.id === accountId);
        if (accountIndex === -1) throw new Error('Account not found');
        
        const account = product.accounts?.[accountIndex];
        if (!account) throw new Error('Account not found');
        
        // Check if the account is already sold
        if (product.accounts?.[accountIndex]?.isSold) {
          console.warn('Account already marked as sold:', accountId);
          return prev; // Return previous state if already sold
        }

        const updatedAccounts = [...(product.accounts || [])];
        updatedAccounts[accountIndex] = {
          ...updatedAccounts[accountIndex],
          isSold: true,
          soldAt: new Date(),
          orderId,
          soldTo: userId
        };
        
        const availableAccounts = updatedAccounts.filter(acc => !acc.isSold).length;
        
        const updatedProduct: ExtendedProduct = {
          ...product,
          accounts: updatedAccounts,
          stock: availableAccounts, // Update stock to reflect available accounts
          updatedAt: new Date()
        };
        
        const newProducts = [...prev];
        newProducts[productIndex] = updatedProduct;
        return newProducts;
      });

      const updatedProduct = products.find(p => p.id === productId);
      if (!updatedProduct) throw new Error('Failed to update product');
      return updatedProduct;
    } catch (err) {
      console.error('Error marking account as sold:', err);
      throw err;
    }
  };

  const getAvailableAccounts = (productId: string): ProductAccount[] => {
    const product = products.find(p => p.id === productId);
    return product?.accounts?.filter(acc => !acc.isSold) || [];
  };

  const getNextAvailableAccount = (productId: string): ProductAccount | undefined => {
    const availableAccounts = getAvailableAccounts(productId);
    return availableAccounts.length > 0 ? availableAccounts[0] : undefined;
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        addAccountsToProduct,
        removeAccountsFromProduct,
        markAccountAsSold,
        getAvailableAccounts,
        getNextAvailableAccount,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// Export the hook in a separate statement to fix Fast Refresh warning
export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
