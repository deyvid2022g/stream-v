-- GUÍA DE MIGRACIÓN A SUPABASE
-- Este archivo contiene instrucciones paso a paso para migrar tu base de datos a Supabase

-- PASO 1: LIMPIAR BASE DE DATOS EXISTENTE (OPCIONAL)
-- Solo ejecuta esto si necesitas empezar desde cero
/*
DROP TABLE IF EXISTS order_item_accounts CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS product_accounts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
*/

-- PASO 2: EJECUTAR EL ESQUEMA PRINCIPAL
-- Copia y pega todo el contenido de supabase-schema.sql en el SQL Editor de Supabase

-- PASO 3: VERIFICAR LA INSTALACIÓN
-- Ejecuta estas consultas para verificar que todo se creó correctamente:

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verificar datos de ejemplo
SELECT 'users' as tabla, count(*) as registros FROM users
UNION ALL
SELECT 'products' as tabla, count(*) as registros FROM products
UNION ALL
SELECT 'product_accounts' as tabla, count(*) as registros FROM product_accounts;

-- Verificar estructura de la tabla orders
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- PASO 4: CONFIGURAR VARIABLES DE ENTORNO
-- Actualiza tu archivo .env con las credenciales de Supabase:
/*
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
*/

-- PASO 5: PROBAR LA CONEXIÓN
-- Ejecuta una consulta simple para verificar la conexión:
SELECT 
    u.name as usuario,
    p.name as producto,
    pa.email as cuenta_email
FROM users u
CROSS JOIN products p
LEFT JOIN product_accounts pa ON pa.product_id = p.id
WHERE u.role = 'admin'
LIMIT 5;

-- COMANDOS ÚTILES PARA DESARROLLO

-- Ver todas las políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Deshabilitar RLS temporalmente para desarrollo (NO RECOMENDADO EN PRODUCCIÓN)
/*
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_accounts DISABLE ROW LEVEL SECURITY;
*/

-- Rehabilitar RLS
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_accounts ENABLE ROW LEVEL SECURITY;
*/

-- SOLUCIÓN DE PROBLEMAS COMUNES

-- Error: "relation does not exist"
-- Solución: Verificar que las tablas se crearon en el orden correcto
-- Ejecutar: SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Error: "permission denied"
-- Solución: Verificar las políticas RLS o usar la clave de servicio

-- Error: "foreign key constraint"
-- Solución: Verificar que las tablas referenciadas existen antes de crear las relaciones

-- MIGRACIÓN DE DATOS EXISTENTES
-- Si tienes datos en otra base de datos, usa estos comandos como plantilla:

/*
-- Migrar usuarios
INSERT INTO users (email, name, password, balance, role)
SELECT email, name, password, balance, role
FROM tu_tabla_usuarios_anterior
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    balance = EXCLUDED.balance,
    role = EXCLUDED.role;

-- Migrar productos
INSERT INTO products (name, description, price, discount, image, category)
SELECT name, description, price, discount, image, category
FROM tu_tabla_productos_anterior
ON CONFLICT DO NOTHING;
*/