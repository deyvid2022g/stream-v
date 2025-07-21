import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { mockUsers } from '../constants/mockUsers';
import type { AuthContextType } from './AuthContext.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('arkion_users');
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers) as User[];
      // Convertir las cadenas de fecha a objetos Date y asegurar que las contraseñas estén presentes
      return parsedUsers.map(user => {
        // Buscar el usuario correspondiente en mockUsers para obtener la contraseña por defecto
        const mockUser = mockUsers.find(mu => mu.email === user.email);
        return {
          ...user,
          password: user.password || mockUser?.password || 'default_password',
          createdAt: new Date(user.createdAt)
        };
      });
    }
    return mockUsers;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('arkion_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Convertir la fecha a objeto Date
      if (parsedUser.createdAt && typeof parsedUser.createdAt === 'string') {
        parsedUser.createdAt = new Date(parsedUser.createdAt);
      }
      // Verify user still exists in users array
      const currentUser = users.find(u => u.id === parsedUser.id);
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('arkion_user');
      }
    }
    setIsLoading(false);
  }, [users]);

  useEffect(() => {
    localStorage.setItem('arkion_users', JSON.stringify(users));
  }, [users]);

  const login = async (email: string, password: string): Promise<{ success: boolean; needsPasswordReset?: boolean }> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Cargar usuarios directamente de localStorage para asegurar que tenemos la versión más reciente
    const savedUsers = localStorage.getItem('arkion_users');
    const currentUsers = savedUsers ? (JSON.parse(savedUsers) as User[]) : mockUsers;
    
    console.log('Attempting login with:', { email, password });
    console.log('Available users:', currentUsers.map(u => ({ email: u.email, password: u.password })));
    
    const foundUser = currentUsers.find(u => u.email === email);
    
    if (!foundUser) {
      console.log('User not found');
      setIsLoading(false);
      return { success: false };
    }
    
    console.log('Found user:', { email: foundUser.email, password: foundUser.password });
    
    // Validar contraseña - ahora es obligatoria
    if (!foundUser.password || foundUser.password !== password) {
      console.log('Password validation failed');
      setIsLoading(false);
      return { success: false };
    }
    
    console.log('Login successful');
    // Actualizar el estado del usuario y autenticación
    setUser(foundUser);
    setIsAuthenticated(true);
    localStorage.setItem('arkion_user', JSON.stringify(foundUser));
    
    setIsLoading(false);
    return { success: true };
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Cargar usuarios directamente de localStorage
    const savedUsers = localStorage.getItem('arkion_users');
    const currentUsers = savedUsers ? (JSON.parse(savedUsers) as User[]) : [];
    
    const existingUser = currentUsers.find(u => u.email === email);
    if (existingUser) {
      setIsLoading(false);
      return false; // Usuario ya existe
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      balance: 0,
      createdAt: new Date(),
      password: password
    };
    
    // Actualizamos el estado de usuarios
    const updatedUsers = [...currentUsers, newUser];
    setUsers(updatedUsers);
    
    // Autenticamos al nuevo usuario automáticamente
    setUser(newUser);
    setIsAuthenticated(true);
    
    // Guardamos en localStorage
    localStorage.setItem('arkion_user', JSON.stringify(newUser));
    localStorage.setItem('arkion_users', JSON.stringify(updatedUsers));
    
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('arkion_user');
  };

  const updateUserBalance = (userId: string, newBalance: number) => {
    setUsers(prev => 
      prev.map(u => 
        u.id === userId ? { ...u, balance: newBalance } : u
      )
    );
    
    if (user && user.id === userId) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem('arkion_user', JSON.stringify(updatedUser));
    }
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    setUsers(prev => 
      prev.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      )
    );
    
    if (user && user.id === userId) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('arkion_user', JSON.stringify(updatedUser));
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    
    if (user && user.id === userId) {
      logout();
    }
  };

  const createAdminUser = (name: string, email: string, password: string, role: string = 'admin'): boolean => {
    // Verificar si el email ya existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return false; // Usuario ya existe
    }

    const newAdmin: User = {
      id: Date.now().toString(),
      email,
      name,
      role: role as 'admin' | 'user',
      balance: 0,
      createdAt: new Date(),
      password: password
    };

    setUsers(prev => [...prev, newAdmin]);
    return true;
  };

  const getAllUsers = () => users;

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        updateUserBalance,
        getAllUsers,
        updateUserProfile,
        deleteUser,
        createAdminUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;