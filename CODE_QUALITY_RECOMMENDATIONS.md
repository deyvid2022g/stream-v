# Recomendaciones para Mejorar la Calidad del Código

## 1. Tipado TypeScript Más Estricto

### Problema Actual
El acceso a propiedades anidadas puede causar errores en tiempo de ejecución si la estructura de datos cambia.

### Solución Recomendada
```typescript
// Definir interfaces más específicas
interface OrderItemAccount {
  product_accounts: ProductAccount; // No array, objeto único
}

interface ProductAccount {
  id: string;
  email: string;
  password: string;
  additional_info?: string;
}
```

## 2. Validación de Datos

### Agregar Validaciones en Servicios
```typescript
// En orderService.ts
private validateOrderData(orderData: any): void {
  if (!orderData.order_items) {
    throw new Error('Orden sin items');
  }
  
  orderData.order_items.forEach((item: any) => {
    if (!item.order_item_accounts) {
      console.warn(`Item ${item.id} sin cuentas asociadas`);
    }
  });
}
```

## 3. Manejo de Errores Mejorado

### Logging Estructurado
```typescript
// Crear un logger centralizado
class Logger {
  static error(context: string, error: any, metadata?: any) {
    console.error(`[${context}]`, error, metadata);
  }
  
  static warn(context: string, message: string, metadata?: any) {
    console.warn(`[${context}]`, message, metadata);
  }
}

// Uso en servicios
Logger.error('OrderService.getUserOrders', error, { userId });
```

## 4. Pruebas Unitarias

### Estructura Recomendada
```
src/
├── services/
│   ├── __tests__/
│   │   ├── orderService.test.ts
│   │   ├── authService.test.ts
│   │   └── transactionService.test.ts
│   └── ...
└── components/
    ├── __tests__/
    │   ├── Account.test.tsx
    │   └── Admin.test.tsx
    └── ...
```

### Ejemplo de Test
```typescript
// orderService.test.ts
describe('OrderService', () => {
  describe('getUserOrders', () => {
    it('should return orders with credentials', async () => {
      const mockOrders = [
        {
          id: '123',
          order_items: [{
            order_item_accounts: [{
              product_accounts: {
                id: 'acc1',
                email: 'test@test.com',
                password: 'pass123'
              }
            }]
          }]
        }
      ];
      
      // Mock supabase response
      jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockOrders,
              error: null
            })
          })
        })
      });
      
      const result = await orderService.getUserOrders('user123');
      expect(result[0].items[0].accounts).toHaveLength(1);
      expect(result[0].items[0].accounts[0].email).toBe('test@test.com');
    });
  });
});
```

## 5. Optimización de Consultas

### Consultas Más Eficientes
```typescript
// Usar select específico en lugar de select('*')
const { data, error } = await supabase
  .from('orders')
  .select(`
    id,
    user_id,
    total,
    status,
    created_at,
    order_items!inner (
      id,
      name,
      quantity,
      price,
      order_item_accounts!inner (
        product_accounts!inner (
          id,
          email,
          password
        )
      )
    )
  `)
  .eq('user_id', userId)
  .eq('status', 'completed'); // Filtrar solo completadas si es necesario
```

## 6. Gestión de Estado Mejorada

### Context con Reducers
```typescript
// orderReducer.ts
type OrderAction = 
  | { type: 'LOAD_ORDERS'; payload: OrderWithItems[] }
  | { type: 'ADD_ORDER'; payload: OrderWithItems }
  | { type: 'UPDATE_ORDER'; payload: { id: string; updates: Partial<OrderWithItems> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'LOAD_ORDERS':
      return { ...state, orders: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}
```

## 7. Componentes Más Modulares

### Separar Lógica de Presentación
```typescript
// hooks/useOrderCredentials.ts
export function useOrderCredentials(orderId: string) {
  const [viewingCredentials, setViewingCredentials] = useState<string | null>(null);
  
  const toggleCredentials = useCallback(() => {
    setViewingCredentials(prev => prev === orderId ? null : orderId);
  }, [orderId]);
  
  const isViewing = viewingCredentials === orderId;
  
  return { isViewing, toggleCredentials };
}

// components/OrderCredentials.tsx
interface OrderCredentialsProps {
  order: OrderWithItems;
  isViewing: boolean;
  onToggle: () => void;
}

export function OrderCredentials({ order, isViewing, onToggle }: OrderCredentialsProps) {
  const hasCredentials = order.items.some(item => hasAccounts(item));
  
  if (!hasCredentials || order.status !== 'completed') {
    return null;
  }
  
  return (
    <div>
      <button onClick={onToggle} className="...">
        {isViewing ? 'Ocultar Credencial' : 'Mostrar Credencial'}
      </button>
      {isViewing && (
        <CredentialsList items={order.items.filter(hasAccounts)} />
      )}
    </div>
  );
}
```

## 8. Configuración de Desarrollo

### ESLint Rules Adicionales
```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/strict-boolean-expressions": "error"
  }
}
```

### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## 9. Documentación de API

### JSDoc para Servicios
```typescript
/**
 * Obtiene las órdenes de un usuario con sus credenciales asociadas
 * @param userId - ID del usuario
 * @returns Promise con array de órdenes incluyendo credenciales
 * @throws Error si no se pueden obtener las órdenes
 * @example
 * ```typescript
 * const orders = await orderService.getUserOrders('user-123');
 * console.log(orders[0].items[0].accounts); // Credenciales disponibles
 * ```
 */
async getUserOrders(userId: string): Promise<OrderWithItems[]> {
  // ...
}
```

## 10. Monitoreo y Analytics

### Tracking de Errores
```typescript
// utils/errorTracking.ts
export function trackError(error: Error, context: string, metadata?: any) {
  // Integrar con Sentry, LogRocket, etc.
  console.error(`[${context}]`, error, metadata);
  
  // En producción, enviar a servicio de monitoreo
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { tags: { context }, extra: metadata });
  }
}
```

## Implementación Gradual

1. **Fase 1**: Agregar tipado estricto y validaciones
2. **Fase 2**: Implementar pruebas unitarias para servicios críticos
3. **Fase 3**: Refactorizar componentes grandes en módulos más pequeños
4. **Fase 4**: Agregar monitoreo y analytics
5. **Fase 5**: Optimizar consultas y rendimiento

Estas mejoras ayudarán a prevenir problemas similares y harán el código más mantenible y robusto.