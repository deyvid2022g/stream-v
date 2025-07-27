import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@admin.com',
    username: 'Administrador',
    password: 'admin123',
    balance: 1000,
    createdAt: new Date().toISOString(),
    is_admin: true,
  },
  {
    id: '2',
    email: 'user@arkion.com',
    username: 'Usuario Demo',
    is_admin: false,
    balance: 15000,
    createdAt: new Date('2024-01-15').toISOString(),
    password: 'user123'
  }
];
