import type { User } from '../types';

export interface LoginResult {
  success: boolean;
  needsPasswordReset?: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  updateUserBalance: (userId: string, newBalance: number) => void;
  getAllUsers: () => User[];
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  createAdminUser: (username: string, email: string, password: string, is_admin?: boolean) => boolean;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  users: User[];
}

export type AuthAction = 
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'UPDATE_BALANCE'; payload: number }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string };
