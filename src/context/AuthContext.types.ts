import type { User } from '../types';

export interface LoginResult {
  success: boolean;
  needsPasswordReset?: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  updateUserBalance: (userId: string, newBalance: number) => void;
  getAllUsers: () => User[];
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
