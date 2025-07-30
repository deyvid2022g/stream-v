-- Solución para el problema de imágenes que no se guardan
-- El problema es que la columna 'image' tiene una restricción VARCHAR(500)
-- que es demasiado pequeña para imágenes base64

-- 1. Verificar el estado actual de la columna
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image';

-- 2. Cambiar la columna image de VARCHAR(500) a TEXT
ALTER TABLE products 
ALTER COLUMN image TYPE TEXT;

-- 3. Verificar que el cambio se aplicó correctamente
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'image';

-- 4. Opcional: Verificar productos existentes
SELECT id, name, 
       CASE 
         WHEN image IS NULL THEN 'Sin imagen'
         WHEN LENGTH(image) > 500 THEN 'Imagen grande (base64)'
         ELSE 'Imagen pequeña'
       END as image_status,
       LENGTH(image) as image_length
FROM products;