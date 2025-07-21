import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@arkion.com',
    name: 'Admin',
    role: 'admin',
    balance: 0,
    createdAt: new Date('2024-01-01'),
    password: 'admin123'
  },
  {
    id: '2',
    email: 'user@arkion.com',
    name: 'Usuario Demo',
    role: 'user',
    balance: 15000,
    createdAt: new Date('2024-01-15'),
    password: 'user123'
  }
];
