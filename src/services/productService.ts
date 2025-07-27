import { Product, ProductAccount } from '../types'
import { supabase } from '../lib/supabase'

export interface ProductWithAccounts extends Product {
  accounts: ProductAccount[]
  availableCount: number
}

class ProductService {
  async getAllProducts(): Promise<ProductWithAccounts[]> {
    try {
      // Obtener productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError || !products) {
        console.error('Error fetching products:', productsError)
        return []
      }

      // Obtener cuentas para cada producto
      const productsWithAccounts: ProductWithAccounts[] = []

      for (const product of products) {
        const { data: accounts, error: accountsError } = await supabase
          .from('product_accounts')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: true })

        if (accountsError) {
          console.error('Error fetching accounts for product:', product.id, accountsError)
          continue
        }

        const productAccounts: ProductAccount[] = (accounts || []).map(account => ({
          id: account.id,
          email: account.email,
          password: account.password,
          productId: product.id,
          isSold: account.is_sold,
          soldAt: account.sold_at ? new Date(account.sold_at) : undefined,
          soldTo: account.order_id || undefined
        }))

        const availableCount = productAccounts.filter(account => !account.isSold).length

        productsWithAccounts.push({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discount: product.discount,
          image: product.image,
          category: product.category,
          duration: '30 días',
          accounts: productAccounts,
          availableCount
        })
      }

      return productsWithAccounts
    } catch (error) {
      console.error('Error in getAllProducts:', error)
      return []
    }
  }

  async getProductById(productId: string): Promise<ProductWithAccounts | null> {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return null
      }

      const { data: accounts, error: accountsError } = await supabase
        .from('product_accounts')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })

      if (accountsError) {
        console.error('Error fetching accounts:', accountsError)
        return null
      }

      const productAccounts: ProductAccount[] = (accounts || []).map(account => ({
        id: account.id,
        email: account.email,
        password: account.password,
        productId: productId,
        isSold: account.is_sold,
        soldAt: account.sold_at ? new Date(account.sold_at) : undefined,
        soldTo: account.order_id || undefined
      }))

      const availableCount = productAccounts.filter(account => !account.isSold).length

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        discount: product.discount,
        image: product.image,
        category: product.category,
        duration: product.duration || '30 días',
        accounts: productAccounts,
        availableCount
      }
    } catch (error) {
      console.error('Error in getProductById:', error)
      return null
    }
  }

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          discount: productData.discount,
          image: productData.image,
          category: productData.category
        })
        .select()
        .single()

      if (error || !data) {
        console.error('Error creating product:', error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        price: data.price,
        discount: data.discount,
        image: data.image,
        category: data.category,
        duration: '30 días'
      }
    } catch (error) {
      console.error('Error in createProduct:', error)
      return null
    }
  }

  async updateProduct(productId: string, productData: Partial<Omit<Product, 'id'>>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)

      return !error
    } catch (error) {
      console.error('Error in updateProduct:', error)
      return false
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      return !error
    } catch (error) {
      console.error('Error in deleteProduct:', error)
      return false
    }
  }

  async addProductAccount(productId: string, accountData: { email: string; password: string }): Promise<ProductAccount | null> {
    try {
      const { data, error } = await supabase
        .from('product_accounts')
        .insert({
          product_id: productId,
          email: accountData.email,
          password: accountData.password,
          is_sold: false
        })
        .select()
        .single()

      if (error || !data) {
        console.error('Error adding product account:', error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        password: data.password,
        productId: productId,
        isSold: data.is_sold,
        soldAt: data.sold_at ? new Date(data.sold_at) : undefined,
        soldTo: data.order_id || undefined
      }
    } catch (error) {
      console.error('Error in addProductAccount:', error)
      return null
    }
  }

  async markAccountAsSold(accountId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_accounts')
        .update({
          is_sold: true,
          order_id: userId,
          sold_at: new Date().toISOString()
        })
        .eq('id', accountId)

      return !error
    } catch (error) {
      console.error('Error in markAccountAsSold:', error)
      return false
    }
  }

  async getAvailableAccounts(productId: string): Promise<ProductAccount[]> {
    try {
      const { data, error } = await supabase
        .from('product_accounts')
        .select('*')
        .eq('product_id', productId)
        .eq('is_sold', false)
        .order('created_at', { ascending: true })

      if (error || !data) {
        return []
      }

      return data.map(account => ({
        id: account.id,
        email: account.email,
        password: account.password,
        productId: productId,
        isSold: account.is_sold,
        soldAt: account.sold_at ? new Date(account.sold_at) : undefined,
        soldTo: account.order_id || undefined
      }))
    } catch (error) {
      console.error('Error in getAvailableAccounts:', error)
      return []
    }
  }

  async deleteProductAccount(accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_accounts')
        .delete()
        .eq('id', accountId)

      return !error
    } catch (error) {
      console.error('Error in deleteProductAccount:', error)
      return false
    }
  }

  async getAllProductAccounts(): Promise<ProductAccount[]> {
    try {
      const { data, error } = await supabase
        .from('product_accounts')
        .select('*')
        .order('created_at', { ascending: true })

      if (error || !data) {
        console.error('Error fetching all product accounts:', error)
        return []
      }

      return data.map(account => ({
        id: account.id,
        email: account.email,
        password: account.password,
        productId: account.product_id,
        isSold: account.is_sold,
        soldAt: account.sold_at ? new Date(account.sold_at) : undefined,
        soldTo: account.order_id || undefined
      }))
    } catch (error) {
      console.error('Error in getAllProductAccounts:', error)
      return []
    }
  }
}

export const productService = new ProductService()