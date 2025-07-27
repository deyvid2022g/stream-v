import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, ProductAccount } from '../types';
import { productService } from '../services/productService';

interface ProductContextType {
  products: Product[];
  productAccounts: ProductAccount[];
  loading: boolean;
  error: string | null;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (productId: string) => Product | undefined;
  addProductAccount: (productId: string, accountData: { email: string; password: string; additionalInfo?: string }) => Promise<ProductAccount>;
  deleteProductAccount: (accountId: string) => Promise<void>;
  markAccountAsSold: (accountId: string, orderId: string) => Promise<void>;
  getAvailableAccounts: (productId: string) => ProductAccount[];
  getSoldAccounts: (productId: string) => ProductAccount[];
  getAllAccounts: (productId: string) => ProductAccount[];
  clearError: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productAccounts, setProductAccounts] = useState<ProductAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, accountsData] = await Promise.all([
          productService.getAllProducts(),
          productService.getAllProductAccounts()
        ]);
        
        // Convertir ProductWithAccounts a Product incluyendo las cuentas
        const products: Product[] = productsData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          discount: p.discount,
          image: p.image,
          category: p.category,
          duration: p.duration,
          accounts: p.accounts || [] // Incluir las cuentas en el producto
        }));
        
        setProducts(products);
        setProductAccounts(accountsData);
      } catch (error) {
        console.error('Error loading products data:', error);
        setError('Error loading products');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct = await productService.createProduct(productData);
      if (newProduct) {
        setProducts(prev => [...prev, newProduct]);
      }
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Error adding product');
      throw error;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      await productService.updateProduct(id, updates);
      setProducts(prev => prev.map(product => 
        product.id === id ? { ...product, ...updates } : product
      ));
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Error updating product');
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      // También eliminar las cuentas asociadas del estado local
      setProductAccounts(prev => prev.filter(account => account.productId !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Error deleting product');
      throw error;
    }
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const addProductAccount = async (productId: string, accountData: { email: string; password: string; additionalInfo?: string }) => {
    try {
      const newAccount = await productService.addProductAccount(productId, accountData);
      if (newAccount) {
        const accountWithProductId = { ...newAccount, productId };
        setProductAccounts(prev => [...prev, accountWithProductId]);
        
        // También actualizar el producto para incluir la nueva cuenta
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, accounts: [...(product.accounts || []), accountWithProductId] }
            : product
        ));
        
        return accountWithProductId;
      }
      throw new Error('Failed to create account');
    } catch (error) {
      console.error('Error adding product account:', error);
      throw error;
    }
  };

  const deleteProductAccount = async (accountId: string) => {
    try {
      await productService.deleteProductAccount(accountId);
      
      // Encontrar la cuenta que se va a eliminar para obtener el productId
      const accountToDelete = productAccounts.find(acc => acc.id === accountId);
      
      setProductAccounts(prev => prev.filter(account => account.id !== accountId));
      
      // También eliminar la cuenta del producto correspondiente
      if (accountToDelete) {
        setProducts(prev => prev.map(product => 
          product.id === accountToDelete.productId 
            ? { ...product, accounts: (product.accounts || []).filter(acc => acc.id !== accountId) }
            : product
        ));
      }
    } catch (error) {
      console.error('Error deleting product account:', error);
      throw error;
    }
  };



  const markAccountAsSold = async (accountId: string, orderId: string) => {
    try {
      await productService.markAccountAsSold(accountId, orderId);
      
      // Encontrar la cuenta para obtener el productId
      const accountToUpdate = productAccounts.find(acc => acc.id === accountId);
      
      setProductAccounts(prev => prev.map(account => 
        account.id === accountId 
          ? { ...account, isSold: true, soldAt: new Date(), orderId }
          : account
      ));
      
      // También actualizar la cuenta en el producto correspondiente
      if (accountToUpdate) {
        setProducts(prev => prev.map(product => 
          product.id === accountToUpdate.productId 
            ? { 
                ...product, 
                accounts: (product.accounts || []).map(acc => 
                  acc.id === accountId 
                    ? { ...acc, isSold: true, soldAt: new Date(), orderId }
                    : acc
                )
              }
            : product
        ));
      }
    } catch (error) {
      console.error('Error marking account as sold:', error);
      throw error;
    }
  };

  const getAvailableAccounts = (productId: string): ProductAccount[] => {
    return productAccounts.filter(acc => acc.productId === productId && !acc.isSold);
  };

  const getSoldAccounts = (productId: string): ProductAccount[] => {
    return productAccounts.filter(acc => acc.productId === productId && acc.isSold);
  };

  const getAllAccounts = (productId: string): ProductAccount[] => {
    return productAccounts.filter(acc => acc.productId === productId);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        productAccounts,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        addProductAccount,
        deleteProductAccount,
        markAccountAsSold,
        getAvailableAccounts,
        getSoldAccounts,
        getAllAccounts,
        clearError,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

// Export the hook in a separate statement to fix Fast Refresh warning
const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export { useProducts };
export default ProductContext;
