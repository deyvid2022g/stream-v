export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  balance: number;
  createdAt: Date;
  password?: string; // Contraseña opcional para usuarios registrados
}

export interface ProductAccount {
  id: string;
  email: string;
  password: string;
  isSold: boolean;
  orderId?: string;
  soldAt?: Date;
  soldTo?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  description: string;
  duration: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  accounts?: ProductAccount[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'processing';
  createdAt: Date;
  deliveredAt?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}