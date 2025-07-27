// Utilidades para exportar e importar datos entre dispositivos
import { Product } from '../types';
import { User } from '../types';
import { Order } from '../types/order';

export interface AppData {
  products: Product[];
  users: User[];
  orders: Order[];
  currentUser: User | null;
  version: string;
  exportDate: string;
}

// Exportar todos los datos de la aplicación
export const exportAppData = (): string => {
  try {
    const data: AppData = {
      products: JSON.parse(localStorage.getItem('products') || '[]'),
      users: JSON.parse(localStorage.getItem('users') || '[]'),
      orders: JSON.parse(localStorage.getItem('orders') || '[]'),
      currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
      version: '1.0.0',
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error al exportar datos:', error);
    throw new Error('Error al exportar los datos de la aplicación');
  }
};

// Importar datos a la aplicación
export const importAppData = (jsonData: string): boolean => {
  try {
    const data: AppData = JSON.parse(jsonData);
    
    // Validar estructura básica
    if (!data.products || !data.users || !data.orders) {
      throw new Error('Formato de datos inválido');
    }
    
    // Hacer backup de datos actuales
    const backup = {
      products: localStorage.getItem('products'),
      users: localStorage.getItem('users'),
      orders: localStorage.getItem('orders'),
      currentUser: localStorage.getItem('currentUser')
    };
    
    try {
      // Importar datos
      localStorage.setItem('products', JSON.stringify(data.products));
      localStorage.setItem('users', JSON.stringify(data.users));
      localStorage.setItem('orders', JSON.stringify(data.orders));
      
      if (data.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(data.currentUser));
      }
      
      return true;
    } catch (importError) {
      // Restaurar backup en caso de error
      Object.entries(backup).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });
      throw importError;
    }
  } catch (error) {
    console.error('Error al importar datos:', error);
    throw new Error('Error al importar los datos. Verifica que el archivo sea válido.');
  }
};

// Descargar datos como archivo JSON
export const downloadAppData = (): void => {
  try {
    const jsonData = exportAppData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `arkion-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar datos:', error);
    throw new Error('Error al descargar el archivo de respaldo');
  }
};

// Leer archivo y importar datos
export const uploadAndImportData = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const success = importAppData(jsonData);
        resolve(success);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file);
  });
};