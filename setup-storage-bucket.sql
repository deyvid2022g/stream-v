-- Script para configurar el bucket de Supabase Storage y las políticas de acceso

-- 1. Crear el bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- 2. Políticas de acceso para el bucket

-- Política para permitir a los administradores subir archivos
CREATE POLICY "Admins can upload images" 
ON storage.objects 
FOR INSERT 
TO authenticated 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Política para permitir a los administradores actualizar archivos
CREATE POLICY "Admins can update images" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Política para permitir a los administradores eliminar archivos
CREATE POLICY "Admins can delete images" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Política para permitir acceso público de lectura
CREATE POLICY "Public read access for product images" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'product-images');