import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, AuthAction } from './AuthContext.types';
import { User } from '../types';
import { authService, AuthResponse } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  updateUserBalance: (newBalance: number) => Promise<void>;
  updateSpecificUserBalance: (userId: string, newBalance: number) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  createAdminUser: (username: string, email: string, password: string, is_admin?: boolean) => Promise<boolean>;
  getAllUsers: () => User[];
  users: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        user: state.user ? { ...state.user, balance: action.payload } : null,
      };
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
      };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map((user: User) => 
          user.id === action.payload.id ? action.payload : user
        ),
        user: state.user?.id === action.payload.id ? action.payload : state.user,
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter((user: User) => user.id !== action.payload),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  users: [],
  isLoading: true,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Verificar si hay un usuario guardado en localStorage
        const savedUser = localStorage.getItem('arkion_current_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser) as User;
          dispatch({ type: 'LOGIN', payload: parsedUser });
        }
        
        // Cargar todos los usuarios
        const allUsers = await authService.getAllUsers();
        dispatch({ type: 'SET_USERS', payload: allUsers });
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await authService.login({ email, password });
      
      if (response.success && response.user) {
        dispatch({ type: 'LOGIN', payload: response.user });
        localStorage.setItem('arkion_current_user', JSON.stringify(response.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await authService.register({ email, password, username, is_admin: false });
      
      if (response.success && response.user) {
        dispatch({ type: 'LOGIN', payload: response.user });
        dispatch({ type: 'ADD_USER', payload: response.user });
        localStorage.setItem('arkion_current_user', JSON.stringify(response.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('arkion_current_user');
  };

  const updateUserBalance = async (newBalance: number): Promise<void> => {
    if (!state.user) {
      throw new Error('No user logged in');
    }
    
    try {
      const success = await authService.updateUserBalance(state.user.id, newBalance);
      if (success) {
        const userWithNewBalance = { ...state.user, balance: newBalance };
        dispatch({ type: 'UPDATE_USER', payload: userWithNewBalance });
        localStorage.setItem('arkion_current_user', JSON.stringify(userWithNewBalance));
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  const updateSpecificUserBalance = async (userId: string, newBalance: number): Promise<void> => {
    try {
      const success = await authService.updateUserBalance(userId, newBalance);
      if (success) {
        const updatedUser = state.users.find((u: User) => u.id === userId);
        if (updatedUser) {
          const userWithNewBalance = { ...updatedUser, balance: newBalance };
          dispatch({ type: 'UPDATE_USER', payload: userWithNewBalance });
          
          // Si es el usuario actual, actualizar también el localStorage
          if (state.user && state.user.id === userId) {
            localStorage.setItem('arkion_current_user', JSON.stringify(userWithNewBalance));
          }
        }
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      throw error;
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const success = await authService.updateUserProfile(userId, updates);
      if (success) {
        const updatedUser = state.users.find((u: User) => u.id === userId);
        if (updatedUser) {
          const userWithUpdates = { ...updatedUser, ...updates };
          dispatch({ type: 'UPDATE_USER', payload: userWithUpdates });
          
          // Si es el usuario actual, actualizar también el localStorage
          if (state.user && state.user.id === userId) {
            localStorage.setItem('arkion_current_user', JSON.stringify(userWithUpdates));
          }
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    try {
      const success = await authService.deleteUser(userId);
      
      if (success) {
        dispatch({ type: 'DELETE_USER', payload: userId });
        
        if (state.user && state.user.id === userId) {
          logout();
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const createAdminUser = async (username: string, email: string, password: string, is_admin: boolean = true): Promise<boolean> => {
    try {
      const response: AuthResponse = await authService.createAdminUser({ email, password, username, is_admin });
      
      if (response.success && response.user) {
        dispatch({ type: 'ADD_USER', payload: response.user });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error creating admin user:', error);
      return false;
    }
  };

  const getAllUsers = () => state.users;

  return (
    <AuthContext.Provider 
      value={{
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        login,
        logout,
        register,
        updateUserBalance,
        updateSpecificUserBalance,
        getAllUsers,
        updateUserProfile,
        deleteUser,
        createAdminUser,
        users: state.users
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };
export default AuthContext;