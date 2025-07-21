// Re-export the unified types from index.ts to maintain consistency
export * from './index';

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  initialAccounts?: Array<{
    email: string;
    password: string;
  }>;
  duration: string;
  image: string;
  originalPrice?: number;
  discount?: number;
}

export interface UpdateProductDTO extends Partial<Omit<CreateProductDTO, 'initialAccounts'>> {
  id: string;
  addAccounts?: Array<{
    email: string;
    password: string;
  }>;
  removeAccountIds?: string[];
}
