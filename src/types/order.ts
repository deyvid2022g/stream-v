export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

import { ProductAccount } from './index';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  accounts: ProductAccount[]; // For digital products with accounts
  type: 'physical' | 'digital';
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  billingAddress?: {
    name: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  notes?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  completedAt?: string | Date;
  deliveredAt?: string | Date;
  cancelledAt?: string | Date;
  cancelledReason?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}
